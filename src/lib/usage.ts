import "server-only";

/** Sonnet 5.5 list prices in USD per million tokens. Estimates only: check the Anthropic console for billed cost. */
const PRICE_PER_MTOK = { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 } as const;

interface UsageLike {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** Estimated cost of one call in USD. Output includes thinking tokens, which the API reports in output_tokens. */
export function estimateCostUsd(usage: UsageLike): number {
  const mtok = (n: number | null | undefined, price: number) => ((n ?? 0) / 1_000_000) * price;
  return (
    mtok(usage.input_tokens, PRICE_PER_MTOK.input) +
    mtok(usage.output_tokens, PRICE_PER_MTOK.output) +
    mtok(usage.cache_read_input_tokens, PRICE_PER_MTOK.cacheRead) +
    mtok(usage.cache_creation_input_tokens, PRICE_PER_MTOK.cacheWrite)
  );
}

/** One greppable line per model call: `[usage] autopsy in=4510 out=2210 cache_read=0 cache_write=0 est=$0.0316`. */
export function logUsage(label: string, usage: UsageLike | null | undefined): void {
  if (!usage) return;
  console.info(
    `[usage] ${label} in=${usage.input_tokens ?? 0} out=${usage.output_tokens ?? 0}` +
      ` cache_read=${usage.cache_read_input_tokens ?? 0} cache_write=${usage.cache_creation_input_tokens ?? 0}` +
      ` est=$${estimateCostUsd(usage).toFixed(4)}`,
  );
}
