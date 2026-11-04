import "server-only";
import { AppError } from "../errors";
import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";
import { AI_CONFIG_MESSAGE } from "./messages";
import type { LlmProvider } from "./types";

/**
 * Picks the model provider. LLM_PROVIDER=gemini|anthropic wins; otherwise Gemini is used unless
 * only an Anthropic key is present.
 */
export function getProvider(): LlmProvider {
  const choice = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (choice === "gemini") return geminiProvider;
  if (choice === "anthropic") return anthropicProvider;
  if (choice) {
    console.error(`[llm] LLM_PROVIDER must be "gemini" or "anthropic", got "${choice}"`);
    throw new AppError("AI_CONFIG", AI_CONFIG_MESSAGE);
  }
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  return hasAnthropic && !hasGemini ? anthropicProvider : geminiProvider;
}
