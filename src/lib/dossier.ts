import "server-only";
import { TtlCache } from "./cache";
import { LIMITS } from "./config";
import { fetchRepoData, type RawRepoData, type Section } from "./github";
import { cleanReadme, truncateOnParagraph } from "./readme";
import { repoKey, type RepoRef } from "./repo-url";
import type { RepoDossier } from "./schemas";
import { commitCadence, daysBetween, hasTests, repoStatus } from "./signals";

const { readmeMaxChars, commitSubjectMaxChars, treeMaxEntries, packageNamesMax, languagesTop, packageJsonMaxBytes } =
  LIMITS.github;

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function value<T>(s: Section<T>): T | null {
  return s.kind === "ok" ? s.value : null;
}

function parsePackageJson(text: string | null): RepoDossier["packageJson"] {
  if (!text || text.length > packageJsonMaxBytes) return null;
  try {
    const pkg = JSON.parse(text) as Record<string, unknown>;
    const keys = (v: unknown) =>
      v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).slice(0, packageNamesMax) : [];
    return {
      name: typeof pkg.name === "string" ? pkg.name : null,
      description: typeof pkg.description === "string" ? pkg.description : null,
      dependencies: keys(pkg.dependencies),
      devDependencies: keys(pkg.devDependencies),
      scripts: keys(pkg.scripts),
    };
  } catch {
    return null;
  }
}

function languagePercents(bytes: Record<string, number> | null): RepoDossier["languages"] {
  if (!bytes) return null;
  const total = Object.values(bytes).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  return Object.entries(bytes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, languagesTop)
    .map(([name, n]) => ({ name, percent: Math.round((n / total) * 1000) / 10 }))
    .filter((l) => l.percent > 0);
}

const SECTION_LABELS = {
  readme: "README",
  commits: "commit history",
  languages: "language breakdown",
  tree: "file listing",
  packageJson: "package.json",
  issues: "open issues",
} as const;

/** Pure: turns raw GitHub data into a dossier. `cacheable` is false if any section failed transiently. */
export function buildDossier(raw: RawRepoData, now: Date): { dossier: RepoDossier; cacheable: boolean } {
  const r = raw.repo;
  const notes: string[] = [];
  let cacheable = true;
  for (const key of Object.keys(SECTION_LABELS) as Array<keyof typeof SECTION_LABELS>) {
    const s = raw[key];
    if (s.kind === "failed") {
      cacheable = false;
      notes.push(`The ${SECTION_LABELS[key]} could not be loaded (${s.error.message}).`);
    }
  }

  const readmeText = value(raw.readme);
  const cleaned = readmeText ? cleanReadme(readmeText) : "";
  const readme = cleaned ? truncateOnParagraph(cleaned, readmeMaxChars) : null;
  if (!readme && raw.readme.kind !== "failed") notes.push("No README: the repo never explained itself.");

  const ghCommits = value(raw.commits);
  const commits = ghCommits?.length
    ? ghCommits.map((c) => ({
        sha: c.sha.slice(0, 7),
        message: clip(c.commit.message.split("\n")[0]?.trim() ?? "", commitSubjectMaxChars),
        author: c.commit.author?.name ?? null,
        date: c.commit.author?.date ?? c.commit.committer?.date ?? r.pushed_at ?? r.created_at,
      }))
    : null;
  if (!commits && raw.commits.kind !== "failed") notes.push("No commits on the default branch.");

  const tree = value(raw.tree)
    ?.slice(0, treeMaxEntries)
    .map((e) => ({ name: e.name, type: e.type === "dir" ? ("dir" as const) : ("file" as const) })) ?? null;

  const packageJson = parsePackageJson(value(raw.packageJson));
  const issues = value(raw.issues);
  const openIssueTitles = issues
    ? issues.filter((i) => !i.pull_request).map((i) => clip(i.title, commitSubjectMaxChars))
    : null;

  const pushedAt = r.pushed_at ?? r.created_at;
  const daysSinceLastPush = daysBetween(pushedAt, now);
  const testNames = [
    ...(tree?.map((e) => e.name) ?? []),
    ...(packageJson?.dependencies ?? []),
    ...(packageJson?.devDependencies ?? []),
    ...(packageJson?.scripts ?? []),
  ];
  const cadence = commitCadence(commits?.map((c) => c.date) ?? []);
  if (cadence.sampleSize > 0) {
    notes.push(`Commit cadence is measured over the latest ${cadence.sampleSize} commits only.`);
  }

  const dossier: RepoDossier = {
    repo: {
      owner: r.owner.login,
      name: r.name,
      fullName: r.full_name,
      description: r.description?.replace(/:[a-z0-9_+-]+:\s*/g, "").trim() || null,
      url: r.html_url,
      homepage: r.homepage || null,
      avatarUrl: r.owner.avatar_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      watchers: r.subscribers_count ?? r.watchers_count,
      openIssues: r.open_issues_count,
      language: r.language,
      topics: r.topics ?? [],
      license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : null,
      createdAt: r.created_at,
      pushedAt,
      archived: r.archived,
      isFork: r.fork,
      defaultBranch: r.default_branch,
    },
    readme,
    commits,
    languages: languagePercents(value(raw.languages)),
    tree,
    packageJson,
    openIssueTitles,
    signals: {
      ageDays: daysBetween(r.created_at, now),
      daysSinceLastPush,
      status: repoStatus(daysSinceLastPush, r.archived),
      commitCadence: cadence,
      lastWords: commits?.[0]?.message ?? null,
      hasHomepage: Boolean(r.homepage),
      hasLicense: Boolean(r.license),
      hasTests: hasTests(testNames),
    },
    notes,
    fetchedAt: now.toISOString(),
  };
  return { dossier: fitDossier(dossier), cacheable };
}

/** Shrinks the largest sections until the serialized dossier fits the character budget. */
export function fitDossier(dossier: RepoDossier, maxChars: number = LIMITS.dossier.maxChars): RepoDossier {
  const d = structuredClone(dossier);
  const size = () => JSON.stringify(d).length;
  while (size() > maxChars) {
    if (d.readme && d.readme.text.length > 1_500) {
      const over = size() - maxChars;
      d.readme = truncateOnParagraph(d.readme.text, Math.max(1_500, d.readme.text.length - over - 50));
      d.readme.truncated = true;
    } else if (d.commits && d.commits.length > 10) d.commits = d.commits.slice(0, -5);
    else if (d.tree && d.tree.length > 20) d.tree = d.tree.slice(0, -10);
    else if (d.openIssueTitles && d.openIssueTitles.length > 3) d.openIssueTitles = d.openIssueTitles.slice(0, -2);
    else if (d.packageJson && d.packageJson.devDependencies.length > 10) {
      d.packageJson.devDependencies = d.packageJson.devDependencies.slice(0, 10);
      d.packageJson.dependencies = d.packageJson.dependencies.slice(0, 20);
    } else if (d.readme && d.readme.text.length > 500) {
      d.readme = { text: truncateOnParagraph(d.readme.text, 500).text, truncated: true };
    } else break;
  }
  return d;
}

function list(items: string[] | null | undefined, empty: string): string {
  return items && items.length ? items.join(", ") : empty;
}

/** Clean, labeled plain text for Claude. Repo content is untrusted data and marked as such by callers. */
export function dossierToPrompt(d: RepoDossier): string {
  const r = d.repo;
  const s = d.signals;
  const date = (iso: string | null) => (iso ? iso.slice(0, 10) : "unknown");
  const lines = [
    `REPOSITORY: ${r.fullName}${r.isFork ? " (fork)" : ""}${r.archived ? " (archived)" : ""}`,
    `DESCRIPTION: ${r.description ?? "none"}`,
    `URL: ${r.url}`,
    `HOMEPAGE: ${r.homepage ?? "none"}`,
    `BORN: ${date(r.createdAt)} | LAST PUSH: ${date(r.pushedAt)} | AGE: ${s.ageDays} days | SINCE LAST PUSH: ${s.daysSinceLastPush} days`,
    `STATUS: ${s.status}`,
    `STARS: ${r.stars} | FORKS: ${r.forks} | WATCHERS: ${r.watchers} | OPEN ISSUES+PRS: ${r.openIssues}`,
    `LANGUAGES: ${d.languages ? d.languages.map((l) => `${l.name} ${l.percent}%`).join(", ") : r.language ?? "unknown"}`,
    `TOPICS: ${list(r.topics, "none")}`,
    `LICENSE: ${r.license ?? "none"} | HAS TESTS: ${s.hasTests ? "yes" : "no"}`,
    `COMMIT CADENCE: ${s.commitCadence.perWeek} commits/week across the latest ${s.commitCadence.sampleSize} commits (${date(s.commitCadence.firstCommitDate)} to ${date(s.commitCadence.lastCommitDate)})`,
    `LAST WORDS (most recent commit): ${s.lastWords ? `"${s.lastWords}"` : "none"}`,
    "",
    "RECENT COMMITS (newest first):",
    ...(d.commits?.map((c) => `- ${date(c.date)} ${c.sha} ${c.message}`) ?? ["- none"]),
    "",
    `ROOT FILES: ${list(d.tree?.map((e) => (e.type === "dir" ? `${e.name}/` : e.name)), "unknown")}`,
  ];
  if (d.packageJson) {
    const p = d.packageJson;
    lines.push(
      `PACKAGE.JSON: name=${p.name ?? "none"}; description=${p.description ?? "none"}`,
      `  dependencies: ${list(p.dependencies, "none")}`,
      `  devDependencies: ${list(p.devDependencies, "none")}`,
      `  scripts: ${list(p.scripts, "none")}`,
    );
  }
  lines.push("", "OPEN ISSUE TITLES:", ...(d.openIssueTitles?.length ? d.openIssueTitles.map((t) => `- ${t}`) : ["- none"]));
  lines.push("", `README${d.readme?.truncated ? " (truncated)" : ""}:`, d.readme?.text ?? "none");
  if (d.notes.length) lines.push("", "DATA NOTES:", ...d.notes.map((n) => `- ${n}`));
  return lines.join("\n");
}

const cache = new TtlCache<RepoDossier>(LIMITS.dossier.cacheTtlMs, LIMITS.dossier.cacheMax);

/** Cached (30 min, per instance) dossier fetch. Partial dossiers are returned but not cached. */
export function getDossier(ref: RepoRef): Promise<RepoDossier> {
  return cache.getOrLoad(repoKey(ref), async () => {
    const { dossier, cacheable } = buildDossier(await fetchRepoData(ref), new Date());
    return { value: dossier, cache: cacheable };
  });
}
