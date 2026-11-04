import "server-only";
import type { ProviderName } from "./llm/types";

interface Prices {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

/**
 * List prices in USD per million tokens, for estimates only (check the provider's console for billed cost).
 * Gemini is the paid-tier price of gemini-2.5-flash; the free tier bills nothing. A different GEMINI_MODEL
 * is still priced as 2.5 Flash.
 */
const PRICE_PER_MTOK: Record<ProviderName, Prices> = {
  anthropic: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  gemini: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0 },
};

export interface TokenUsage {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** Estimated cost of one call in USD. Output includes thinking tokens, which both APIs bill as output. */
export function estimateCostUsd(provider: ProviderName, usage: TokenUsage): number {
  const price = PRICE_PER_MTOK[provider];
  const mtok = (n: number | null | undefined, perMtok: number) => ((n ?? 0) / 1_000_000) * perMtok;
  return (
    mtok(usage.input_tokens, price.input) +
    mtok(usage.output_tokens, price.output) +
    mtok(usage.cache_read_input_tokens, price.cacheRead) +
    mtok(usage.cache_creation_input_tokens, price.cacheWrite)
  );
}

/** One greppable line per model call: `[usage] autopsy gemini in=4510 out=2210 cache_read=0 cache_write=0 est=$0.0063`. */
export function logUsage(label: string, provider: ProviderName, usage: TokenUsage | null | undefined): void {
  if (!usage) return;
  console.info(
    `[usage] ${label} ${provider} in=${usage.input_tokens ?? 0} out=${usage.output_tokens ?? 0}` +
      ` cache_read=${usage.cache_read_input_tokens ?? 0} cache_write=${usage.cache_creation_input_tokens ?? 0}` +
      ` est=$${estimateCostUsd(provider, usage).toFixed(4)}`,
  );
}
