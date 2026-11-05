import { describe, expect, it } from "vitest";
import { EXAMPLE_REPOS } from "./examples";
import { EXAMPLE_SNAPSHOTS, exampleSnapshot } from "./example-snapshots";
import { checkResurrection } from "./ai/resurrection-rules";

describe("example snapshots", () => {
  it("covers every example repo", () => {
    for (const ex of EXAMPLE_REPOS) expect(EXAMPLE_SNAPSHOTS.has(ex.label.toLowerCase())).toBe(true);
  });

  it("holds a dossier that matches its repo", () => {
    for (const [key, snap] of EXAMPLE_SNAPSHOTS) expect(snap.dossier.repo.fullName.toLowerCase()).toBe(key);
  });

  it("passes the same tone checks as live output", () => {
    for (const [key, snap] of EXAMPLE_SNAPSHOTS) {
      expect(checkResurrection(snap.resurrection, snap.autopsy.revivalScore), key).toEqual([]);
    }
  });

  it("matches repos case-insensitively and ignores others", () => {
    expect(exampleSnapshot({ owner: "Atom", repo: "ATOM" })).toBeDefined();
    expect(exampleSnapshot({ owner: "vercel", repo: "next.js" })).toBeUndefined();
  });
});
