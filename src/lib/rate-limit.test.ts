import { describe, expect, it } from "vitest";
import { SlidingWindowLimiter } from "./rate-limit";

describe("SlidingWindowLimiter", () => {
  it("allows up to the limit within the window, then frees up as hits age out", () => {
    let now = 0;
    const l = new SlidingWindowLimiter(2, 1000, () => now);
    expect(l.hit("ip").allowed).toBe(true);
    now = 400;
    expect(l.hit("ip").allowed).toBe(true);
    now = 500;
    expect(l.hit("ip")).toEqual({ allowed: false, retryAfterMs: 500 });
    now = 1000;
    expect(l.hit("ip").allowed).toBe(true);
  });

  it("tracks keys separately and throws a friendly error", () => {
    const l = new SlidingWindowLimiter(1, 60_000);
    l.enforce("a", "autopsies");
    expect(() => l.enforce("b", "autopsies")).not.toThrow();
    expect(() => l.enforce("a", "autopsies")).toThrowError(expect.objectContaining({ code: "RATE_LIMITED" }));
  });
});
