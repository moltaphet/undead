import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AppError } from "./errors";
import { AI_BUSY_MESSAGE, AI_CONFIG_MESSAGE } from "./llm/messages";

let client: Anthropic | undefined;

export { AI_BUSY_MESSAGE, AI_CONFIG_MESSAGE };

/** Server-only Anthropic client, created on first use so builds don't need the key. */
export function getAnthropic(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    console.error("[anthropic] ANTHROPIC_API_KEY is not set");
    throw new AppError("AI_CONFIG", AI_CONFIG_MESSAGE);
  }
  client = new Anthropic({ apiKey, timeout: 120_000, maxRetries: 2 });
  return client;
}

/** Maps SDK errors to user-safe AppErrors. Details are logged server-side only. */
export function toAiError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (
    err instanceof Anthropic.RateLimitError ||
    err instanceof Anthropic.InternalServerError ||
    err instanceof Anthropic.APIConnectionError
  ) {
    console.warn("[anthropic] busy", err.message);
    return new AppError("AI_BUSY", AI_BUSY_MESSAGE);
  }
  if (err instanceof Anthropic.APIError) {
    console.error(`[anthropic] ${err.status ?? "?"} ${err.message}`);
    return new AppError("AI_CONFIG", AI_CONFIG_MESSAGE);
  }
  console.error("[anthropic] unexpected error", err);
  return new AppError("AI_CONFIG", AI_CONFIG_MESSAGE);
}
