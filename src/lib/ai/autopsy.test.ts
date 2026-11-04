import { describe, expect, it } from "vitest";
import { modelAutopsy } from "@/test/autopsy-fixture";
import { buildDossier } from "../dossier";
import { autopsyModelSchema } from "../schemas";
import { ghCommits, ghRepo } from "@/test/fixtures";
import { finalizeAutopsy, sanitizeTimeOfDeath } from "./autopsy";

const NOW = new Date("2026-11-04T00:00:00Z");
const dossier = buildDossier(
  {
    repo: ghRepo(),
    readme: { kind: "missing" },
    commits: { kind: "ok", value: ghCommits(3, "the real last words") },
    languages: { kind: "missing" },
    tree: { kind: "missing" },
    packageJson: { kind: "missing" },
    issues: { kind: "missing" },
  },
  NOW,
).dossier;

describe("autopsy schema", () => {
  it("accepts a good payload", () => {
    expect(autopsyModelSchema.safeParse(modelAutopsy()).success).toBe(true);
  });

  it.each([
    ["headline too long", { causeOfDeath: { headline: "x".repeat(91), explanation: "e" } }],
    ["unknown factor", { diagnosis: [{ factor: "bad_vibes", severity: 3, evidence: "e" }, { factor: "no_users", severity: 2, evidence: "e" }] }],
    ["too few factors", { diagnosis: [{ factor: "no_users", severity: 2, evidence: "e" }] }],
    ["severity out of range", { diagnosis: [{ factor: "no_users", severity: 6, evidence: "e" }, { factor: "tech_debt", severity: 1, evidence: "e" }] }],
    ["fractional score", { revivalScore: 50.5 }],
    ["score over 100", { revivalScore: 101 }],
    ["epitaph too long", { epitaph: "x".repeat(71) }],
    ["bad verdict", { marketToday: { verdict: "booming", reasoning: "r" } }],
    ["one thing worth saving", { worthSaving: ["only one"] }],
  ])("rejects %s", (_name, over) => {
    expect(autopsyModelSchema.safeParse({ ...modelAutopsy(), ...over }).success).toBe(false);
  });
});

describe("finalizeAutopsy", () => {
  it("injects last words from the dossier and sorts diagnosis by severity", () => {
    const a = finalizeAutopsy(modelAutopsy(), dossier, NOW);
    expect(a.lastWords).toBe("the real last words");
    expect(a.diagnosis.map((d) => d.severity)).toEqual([5, 3]);
  });

  it("keeps a plausible date and replaces invented ones", () => {
    expect(sanitizeTimeOfDeath("2021-05-30", dossier, NOW)).toBe("2021-05-30T00:00:00.000Z");
    const fallback = dossier.signals.commitCadence.lastCommitDate;
    expect(sanitizeTimeOfDeath("2030-01-01", dossier, NOW)).toBe(fallback);
    expect(sanitizeTimeOfDeath("1999-01-01", dossier, NOW)).toBe(fallback);
    expect(sanitizeTimeOfDeath("last Tuesday", dossier, NOW)).toBe(fallback);
  });
});
