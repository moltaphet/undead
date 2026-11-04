import { describe, expect, it } from "vitest";
import { nextReveal } from "./typewriter";

describe("nextReveal", () => {
  it("reveals about 50 chars per second", () => {
    expect(nextReveal(0, 100, 1000, false)).toBe(50);
    expect(nextReveal(0, 100, 16, false)).toBe(1);
  });

  it("never passes what was received", () => {
    expect(nextReveal(9, 10, 1000, false)).toBe(10);
    expect(nextReveal(10, 10, 1000, false)).toBe(10);
  });

  it("catches up when far behind", () => {
    expect(nextReveal(0, 600, 100, false)).toBeGreaterThan(nextReveal(0, 100, 100, false));
  });

  it("shows everything at once with reduced motion", () => {
    expect(nextReveal(0, 500, 16, true)).toBe(500);
  });
});
