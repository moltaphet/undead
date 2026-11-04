import { describe, expect, it } from "vitest";
import { ghCommits, ghRepo } from "@/test/fixtures";
import { buildDossier, dossierToPrompt, fitDossier } from "./dossier";
import { AppError } from "./errors";
import type { RawRepoData } from "./github";
import { repoDossierSchema } from "./schemas";

const NOW = new Date("2026-11-04T00:00:00Z");

function raw(over: Partial<RawRepoData> = {}): RawRepoData {
  return {
    repo: ghRepo(),
    readme: { kind: "ok", value: "# Hello\n\n[![b](x)](y) A tool that does things." },
    commits: { kind: "ok", value: ghCommits(30, "feat: dark mode (almost)") },
    languages: { kind: "ok", value: { TypeScript: 900, CSS: 80, HTML: 10, Shell: 5, Makefile: 3, Dockerfile: 2 } },
    tree: { kind: "ok", value: [{ name: "src", type: "dir" }, { name: "jest.config.js", type: "file" }] },
    packageJson: {
      kind: "ok",
      value: JSON.stringify({ name: "r", dependencies: { react: "1" }, devDependencies: { vitest: "1" }, scripts: { test: "x" } }),
    },
    issues: { kind: "ok", value: [{ title: "Dark mode?" }, { title: "A PR", pull_request: {} }] },
    ...over,
  };
}

describe("buildDossier", () => {
  it("builds a valid dossier with derived signals", () => {
    const { dossier, cacheable } = buildDossier(raw(), NOW);
    expect(repoDossierSchema.parse(dossier)).toBeTruthy();
    expect(cacheable).toBe(true);
    expect(dossier.signals.status).toBe("dead");
    expect(dossier.signals.lastWords).toBe("feat: dark mode (almost)");
    expect(dossier.signals.hasTests).toBe(true);
    expect(dossier.signals.hasLicense).toBe(true);
    expect(dossier.signals.hasHomepage).toBe(false);
    expect(dossier.languages).toHaveLength(5);
    expect(dossier.openIssueTitles).toEqual(["Dark mode?"]);
    expect(dossier.readme?.text).toBe("# Hello\n\nA tool that does things.");
    expect(dossier.commits?.[0]).toMatchObject({ sha: "aaaaaaa", author: "Dev" });
  });

  it("treats missing README, commits and package.json as notes, not errors", () => {
    const { dossier, cacheable } = buildDossier(
      raw({ readme: { kind: "missing" }, commits: { kind: "missing" }, packageJson: { kind: "missing" } }),
      NOW,
    );
    expect(cacheable).toBe(true);
    expect(dossier.readme).toBeNull();
    expect(dossier.commits).toBeNull();
    expect(dossier.packageJson).toBeNull();
    expect(dossier.signals.lastWords).toBeNull();
    expect(dossier.notes.join(" ")).toMatch(/No README/);
    expect(dossier.notes.join(" ")).toMatch(/No commits/);
  });

  it("marks partial dossiers as not cacheable and says why", () => {
    const { dossier, cacheable } = buildDossier(
      raw({ commits: { kind: "failed", error: new AppError("TIMEOUT", "GitHub took too long.") } }),
      NOW,
    );
    expect(cacheable).toBe(false);
    expect(dossier.notes[0]).toMatch(/commit history could not be loaded/);
  });

  it("archived repos are dead even if recently pushed", () => {
    const { dossier } = buildDossier(raw({ repo: ghRepo({ archived: true, pushed_at: "2026-11-01T00:00:00Z" }) }), NOW);
    expect(dossier.signals.status).toBe("dead");
  });

  it("ignores malformed package.json", () => {
    const { dossier } = buildDossier(raw({ packageJson: { kind: "ok", value: "{ nope" } }), NOW);
    expect(dossier.packageJson).toBeNull();
  });
});

describe("size budget", () => {
  it("fits a worst-case dossier under 12,000 characters", () => {
    const huge = buildDossier(
      raw({
        repo: ghRepo({ description: "d".repeat(350), topics: Array.from({ length: 20 }, (_, i) => `topic-${i}`) }),
        readme: { kind: "ok", value: "Lorem ipsum dolor sit amet. ".repeat(2000) },
        commits: { kind: "ok", value: ghCommits(30, "x".repeat(300)).map((c) => ({ ...c, commit: { ...c.commit, message: "m".repeat(300) } })) },
        tree: { kind: "ok", value: Array.from({ length: 200 }, (_, i) => ({ name: `some-long-file-name-${i}.ts`, type: "file" })) },
        packageJson: {
          kind: "ok",
          value: JSON.stringify({
            dependencies: Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`@scope/dependency-${i}`, "1"])),
            devDependencies: Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`@scope/dev-dependency-${i}`, "1"])),
            scripts: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`script-${i}`, "x"])),
          }),
        },
        issues: { kind: "ok", value: Array.from({ length: 10 }, () => ({ title: "t".repeat(300) })) },
      }),
      NOW,
    ).dossier;
    expect(JSON.stringify(huge).length).toBeLessThanOrEqual(12_000);
    expect(huge.tree?.length).toBeLessThanOrEqual(60);
    expect(huge.commits?.every((c) => c.message.length <= 140)).toBe(true);
  });

  it("does not touch dossiers already under budget", () => {
    const { dossier } = buildDossier(raw(), NOW);
    expect(fitDossier(dossier)).toEqual(dossier);
  });
});

describe("dossierToPrompt", () => {
  it("renders labeled plain text with the key facts", () => {
    const text = dossierToPrompt(buildDossier(raw(), NOW).dossier);
    expect(text).toContain("REPOSITORY: o/r");
    expect(text).toContain('LAST WORDS (most recent commit): "feat: dark mode (almost)"');
    expect(text).toContain("STATUS: dead");
    expect(text).toContain("TypeScript 90%, CSS 8%");
    expect(text).toContain("- Dark mode?");
  });
});
