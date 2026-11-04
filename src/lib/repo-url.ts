export interface RepoRef {
  owner: string;
  repo: string;
}

export const INVALID_URL_MESSAGE = "That doesn't look like a GitHub repo. Try github.com/owner/repo.";

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9_-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const RESERVED_OWNERS = new Set([
  "orgs", "settings", "marketplace", "features", "topics", "collections", "sponsors",
  "explore", "notifications", "login", "join", "pricing", "enterprise", "about",
  "apps", "users", "search", "issues", "pulls", "new", "organizations",
]);

export function isValidOwner(owner: string): boolean {
  return OWNER_RE.test(owner) && !RESERVED_OWNERS.has(owner.toLowerCase());
}

export function isValidRepo(repo: string): boolean {
  return REPO_RE.test(repo) && repo !== "." && repo !== "..";
}

/** Normalizes a GitHub repo URL (or owner/repo shorthand) to { owner, repo }. Returns null if it isn't one. */
export function tryParseRepoUrl(input: string): RepoRef | null {
  const raw = input.trim();
  if (!raw || raw.length > 300) return null;

  let path: string;
  if (/^https?:\/\//i.test(raw) || /^(www\.)?github\.com\//i.test(raw)) {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch {
      return null;
    }
    const host = url.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") return null;
    path = url.pathname;
  } else if (/^[^/\s:]+\/[^/\s:]+\/?$/.test(raw)) {
    path = raw;
  } else {
    return null;
  }

  const [owner, repoRaw] = path.split("/").filter(Boolean);
  if (!owner || !repoRaw) return null;
  const repo = repoRaw.replace(/\.git$/i, "");
  return isValidOwner(owner) && isValidRepo(repo) ? { owner, repo } : null;
}

export function repoKey({ owner, repo }: RepoRef): string {
  return `${owner}/${repo}`.toLowerCase();
}
