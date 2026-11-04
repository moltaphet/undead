import { afterEach, describe, expect, it, vi } from "vitest";
import { estimateCostUsd, logUsage } from "./usage";

afterEach(() => vi.restoreAllMocks());

describe("estimateCostUsd", () => {
  it("prices input, output and cache tokens separately", () => {
    const cost = estimateCostUsd({
      input_tokens: 1_000_000,
      output_tokens: 1_000_000,
      cache_read_input_tokens: 1_000_000,
      cache_creation_input_tokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(2 + 10 + 0.2 + 2.5);
  });

  it("treats missing and null counts as zero", () => {
    expect(estimateCostUsd({ input_tokens: null })).toBe(0);
    expect(estimateCostUsd({})).toBe(0);
  });
});

describe("logUsage", () => {
  it("writes one line with the label, counts and estimate", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    logUsage("autopsy", { input_tokens: 4_500, output_tokens: 2_000 });
    expect(info).toHaveBeenCalledWith("[usage] autopsy in=4500 out=2000 cache_read=0 cache_write=0 est=$0.0290");
  });

  it("does nothing without usage", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    logUsage("autopsy", undefined);
    expect(info).not.toHaveBeenCalled();
  });
});
