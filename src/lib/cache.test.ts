import { describe, expect, it, vi } from "vitest";
import { TtlCache } from "./cache";

describe("TtlCache", () => {
  it("expires entries after the TTL", () => {
    let now = 0;
    const c = new TtlCache<string>(1000, 10, () => now);
    c.set("a", "1");
    now = 999;
    expect(c.get("a")).toBe("1");
    now = 1000;
    expect(c.get("a")).toBeUndefined();
  });

  it("evicts the least recently used entry", () => {
    const c = new TtlCache<number>(60_000, 2);
    c.set("a", 1);
    c.set("b", 2);
    c.get("a");
    c.set("c", 3);
    expect(c.get("b")).toBeUndefined();
    expect(c.get("a")).toBe(1);
  });

  it("dedupes concurrent loads and respects the cache flag", async () => {
    const c = new TtlCache<number>(60_000, 10);
    const load = vi.fn(async () => ({ value: 7, cache: false }));
    const [x, y] = await Promise.all([c.getOrLoad("k", load), c.getOrLoad("k", load)]);
    expect([x, y]).toEqual([7, 7]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(c.get("k")).toBeUndefined();
  });

  it("does not cache failures", async () => {
    const c = new TtlCache<number>(60_000, 10);
    await expect(c.getOrLoad("k", async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(c.getOrLoad("k", async () => ({ value: 1, cache: true }))).resolves.toBe(1);
  });
});
