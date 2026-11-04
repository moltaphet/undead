import type { GhCommit, GhRepo } from "@/lib/github";

export function ghRepo(over: Partial<GhRepo> = {}): GhRepo {
  return {
    name: "r",
    full_name: "o/r",
    description: "A thing",
    html_url: "https://github.com/o/r",
    homepage: "",
    stargazers_count: 42,
    forks_count: 3,
    subscribers_count: 5,
    watchers_count: 42,
    open_issues_count: 2,
    language: "TypeScript",
    topics: ["cli"],
    license: { spdx_id: "MIT" },
    created_at: "2020-01-01T00:00:00Z",
    pushed_at: "2021-06-01T00:00:00Z",
    archived: false,
    fork: false,
    private: false,
    default_branch: "main",
    owner: { login: "o", avatar_url: "https://avatars.githubusercontent.com/u/1" },
    ...over,
  };
}

export function ghCommits(n: number, message = "fix: final touches"): GhCommit[] {
  return Array.from({ length: n }, (_, i) => ({
    sha: `${i}`.padStart(40, "a"),
    commit: {
      message: i === 0 ? `${message}\n\nbody text` : `commit ${i}`,
      author: { name: "Dev", date: new Date(Date.UTC(2021, 5, 1) - i * 86_400_000).toISOString() },
      committer: null,
    },
  }));
}
