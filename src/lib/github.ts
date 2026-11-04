import "server-only";
import { LIMITS } from "./config";
import { AppError } from "./errors";
import type { RepoRef } from "./repo-url";

const API = "https://api.github.com";
const ACCEPT_JSON = "application/vnd.github+json";
const ACCEPT_RAW = "application/vnd.github.raw";

export const NOT_FOUND_MESSAGE = "We can't find that repo. It might be private, or it never existed.";

/** A section the dossier can live without: present, missing (404/empty), or failed. */
export type Section<T> = { kind: "ok"; value: T } | { kind: "missing" } | { kind: "failed"; error: AppError };

function headers(accept: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "undead-app",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export function rateLimitMessage(resetEpochSeconds: number | null, now = Date.now()): string {
  if (!resetEpochSeconds) return "GitHub is rate-limiting us. Try again in a few minutes.";
  const reset = new Date(resetEpochSeconds * 1000);
  const minutes = Math.max(1, Math.ceil((reset.getTime() - now) / 60_000));
  const hhmm = reset.toISOString().slice(11, 16);
  return `GitHub is rate-limiting us. Try again after ${hhmm} UTC (about ${minutes} min).`;
}

/** GET a GitHub API path. Returns null on 404 (and 409 empty repo); throws AppError otherwise. */
async function ghGet(path: string, accept = ACCEPT_JSON): Promise<Response | null> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      headers: headers(accept),
      signal: AbortSignal.timeout(LIMITS.github.timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new AppError("TIMEOUT", "GitHub took too long to answer. Try again in a moment.");
    }
    console.error("[github] network error", err);
    throw new AppError("GITHUB_UNAVAILABLE", "We couldn't reach GitHub. Try again in a moment.");
  }

  if (res.ok) return res;
  if (res.status === 404 || res.status === 409) return null;

  const remaining = res.headers.get("x-ratelimit-remaining");
  if (res.status === 429 || (res.status === 403 && (remaining === "0" || res.headers.has("retry-after")))) {
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    const retryAfter = Number(res.headers.get("retry-after"));
    const resetAt = Number.isFinite(reset) && reset > 0
      ? reset
      : Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.floor(Date.now() / 1000) + retryAfter
        : null;
    throw new AppError("RATE_LIMITED", rateLimitMessage(resetAt));
  }
  if (res.status === 401) console.error("[github] 401: GITHUB_TOKEN is invalid or expired");
  else console.error(`[github] unexpected ${res.status} for ${path}`);
  throw new AppError("GITHUB_UNAVAILABLE", "GitHub returned an error. Try again in a moment.");
}

async function section<T>(load: () => Promise<T | null>): Promise<Section<T>> {
  try {
    const value = await load();
    return value === null ? { kind: "missing" } : { kind: "ok", value };
  } catch (err) {
    if (err instanceof AppError) return { kind: "failed", error: err };
    throw err;
  }
}

function unwrap<T>(result: PromiseSettledResult<Section<T>>): Section<T> {
  if (result.status === "rejected") throw result.reason;
  return result.value;
}

async function json<T>(path: string): Promise<T | null> {
  const res = await ghGet(path);
  return res ? ((await res.json()) as T) : null;
}

async function raw(path: string): Promise<string | null> {
  const res = await ghGet(path, ACCEPT_RAW);
  return res ? res.text() : null;
}

export interface GhRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  subscribers_count?: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  license: { spdx_id: string | null } | null;
  created_at: string;
  pushed_at: string | null;
  archived: boolean;
  fork: boolean;
  private: boolean;
  default_branch: string;
  owner: { login: string; avatar_url: string };
}

export interface GhCommit {
  sha: string;
  commit: { message: string; author: { name?: string; date?: string } | null; committer: { date?: string } | null };
}

export interface GhContent {
  name: string;
  type: string;
}

export interface GhIssue {
  title: string;
  pull_request?: unknown;
}

export interface RawRepoData {
  repo: GhRepo;
  readme: Section<string>;
  commits: Section<GhCommit[]>;
  languages: Section<Record<string, number>>;
  tree: Section<GhContent[]>;
  packageJson: Section<string>;
  issues: Section<GhIssue[]>;
}

/** Fetches everything in parallel. Throws only for the repo itself or a rate limit anywhere. */
export async function fetchRepoData({ owner, repo }: RepoRef): Promise<RawRepoData> {
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const { commitCount, issueCount } = LIMITS.github;

  const [meta, readme, commits, languages, tree, packageJson, issues] = await Promise.allSettled([
    json<GhRepo>(base),
    section(() => raw(`${base}/readme`)),
    section(() => json<GhCommit[]>(`${base}/commits?per_page=${commitCount}`)),
    section(() => json<Record<string, number>>(`${base}/languages`)),
    section(() => json<GhContent[]>(`${base}/contents/`)),
    section(() => raw(`${base}/contents/package.json`)),
    section(() => json<GhIssue[]>(`${base}/issues?state=open&per_page=${issueCount}`)),
  ]);

  if (meta.status === "rejected") throw meta.reason;
  if (!meta.value || meta.value.private) throw new AppError("NOT_FOUND_OR_PRIVATE", NOT_FOUND_MESSAGE);

  const data: RawRepoData = {
    repo: meta.value,
    readme: unwrap(readme),
    commits: unwrap(commits),
    languages: unwrap(languages),
    tree: unwrap(tree),
    packageJson: unwrap(packageJson),
    issues: unwrap(issues),
  };
  const optional = [data.readme, data.commits, data.languages, data.tree, data.packageJson, data.issues];
  for (const s of optional) {
    if (s.kind === "failed" && s.error.code === "RATE_LIMITED") throw s.error;
  }
  return data;
}
