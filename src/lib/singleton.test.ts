import { describe, expect, it, vi } from "vitest";
import { singleton } from "./singleton";

describe("singleton", () => {
  it("creates once per name and returns the same instance", () => {
    const create = vi.fn(() => ({ n: 1 }));
    const a = singleton("test.once", create);
    const b = singleton("test.once", create);
    expect(a).toBe(b);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("keeps different names apart", () => {
    expect(singleton("test.a", () => ({}))).not.toBe(singleton("test.b", () => ({})));
  });
});
