import { describe, expect, it } from "vitest";
import { commitCadence, daysBetween, hasTests, repoStatus } from "./signals";

describe("repoStatus", () => {
  it.each([
    [0, false, "alive"],
    [60, false, "alive"],
    [61, false, "dormant"],
    [365, false, "dormant"],
    [366, false, "dead"],
    [1, true, "dead"],
  ] as const)("%i days, archived=%s -> %s", (days, archived, expected) => {
    expect(repoStatus(days, archived)).toBe(expected);
  });
});

describe("daysBetween", () => {
  it("floors whole days and never goes negative", () => {
    const now = new Date("2026-11-04T12:00:00Z");
    expect(daysBetween("2026-11-01T13:00:00Z", now)).toBe(2);
    expect(daysBetween("2027-01-01T00:00:00Z", now)).toBe(0);
  });
});

describe("commitCadence", () => {
  it("handles no commits", () => {
    expect(commitCadence([])).toEqual({ perWeek: 0, sampleSize: 0, firstCommitDate: null, lastCommitDate: null });
  });

  it("computes commits per week over the span", () => {
    const dates = ["2026-01-15T00:00:00Z", "2026-01-01T00:00:00Z", "2026-01-08T00:00:00Z"];
    const c = commitCadence(dates);
    expect(c.perWeek).toBe(1.5);
    expect(c.firstCommitDate).toBe("2026-01-01T00:00:00.000Z");
    expect(c.lastCommitDate).toBe("2026-01-15T00:00:00.000Z");
  });

  it("floors the span at one day so bursts don't explode", () => {
    expect(commitCadence(["2026-01-01T00:00:00Z", "2026-01-01T01:00:00Z"]).perWeek).toBe(14);
  });
});

describe("hasTests", () => {
  it.each([["test"], ["tests"], ["__tests__"], ["jest"], ["vitest"], ["@playwright/test"], ["cypress"], ["test:unit"]])(
    "detects %s",
    (name) => expect(hasTests([name])).toBe(true),
  );
  it("ignores look-alikes", () => {
    expect(hasTests(["contest", "latest-version", "attestation", "src", "README.md"])).toBe(false);
  });
});
