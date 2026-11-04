import { describe, expect, it } from "vitest";
import { tryParseRepoUrl } from "./repo-url";

describe("tryParseRepoUrl", () => {
  it.each([
    "https://github.com/atom/atom",
    "https://github.com/atom/atom/",
    "https://github.com/atom/atom.git",
    "https://github.com/atom/atom/tree/master/src/sub",
    "https://github.com/atom/atom?tab=readme-ov-file",
    "http://www.github.com/atom/atom#readme",
    "github.com/atom/atom",
    "www.github.com/atom/atom",
    "atom/atom",
    "  atom/atom/  ",
  ])("accepts %s", (input) => {
    expect(tryParseRepoUrl(input)).toEqual({ owner: "atom", repo: "atom" });
  });

  it("keeps dots and dashes in repo names", () => {
    expect(tryParseRepoUrl("github.com/some-org/my.repo_x")).toEqual({ owner: "some-org", repo: "my.repo_x" });
  });

  it.each([
    "",
    "not a url",
    "https://gitlab.com/a/b",
    "https://github.com.evil.com/a/b",
    "https://github.com/onlyowner",
    "https://github.com/orgs/foo",
    "https://github.com/-bad/repo",
    "git@github.com:a/b.git",
    "javascript:alert(1)",
    "a".repeat(400),
  ])("rejects %s", (input) => {
    expect(tryParseRepoUrl(input)).toBeNull();
  });
});
