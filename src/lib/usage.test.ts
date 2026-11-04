import { afterEach, describe, expect, it, vi } from "vitest";
import { estimateCostUsd, logUsage } from "./usage";

afterEach(() => vi.restoreAllMocks());

const million = {
  input_tokens: 1_000_000,
  output_tokens: 1_000_000,
  cache_read_input_tokens: 1_000_000,
  cache_creation_input_tokens: 1_000_000,
};

describe("estimateCostUsd", () => {
  it("prices Claude input, output and cache tokens separately", () => {
    expect(estimateCostUsd("anthropic", million)).toBeCloseTo(2 + 10 + 0.2 + 2.5);
  });

  it("prices Gemini with its own table", () => {
    expect(estimateCostUsd("gemini", million)).toBeCloseTo(1.5 + 9 + 0.15);
  });

  it("treats missing and null counts as zero", () => {
    expect(estimateCostUsd("gemini", { input_tokens: null })).toBe(0);
    expect(estimateCostUsd("anthropic", {})).toBe(0);
  });
});

describe("logUsage", () => {
  it("writes one line with the label, provider, counts and estimate", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    logUsage("autopsy", "anthropic", { input_tokens: 4_500, output_tokens: 2_000 });
    expect(info).toHaveBeenCalledWith("[usage] autopsy anthropic in=4500 out=2000 cache_read=0 cache_write=0 est=$0.0290");
    logUsage("autopsy", "gemini", { input_tokens: 4_000, output_tokens: 2_000 });
    expect(info).toHaveBeenLastCalledWith("[usage] autopsy gemini in=4000 out=2000 cache_read=0 cache_write=0 est=$0.0240");
  });

  it("does nothing without usage", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    logUsage("autopsy", "gemini", undefined);
    expect(info).not.toHaveBeenCalled();
  });
});
