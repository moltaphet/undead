import "server-only";
import { ApiError, FinishReason, GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { AppError } from "../errors";
import { singleton } from "../singleton";
import type { TokenUsage } from "../usage";
import { AI_BUSY_MESSAGE, AI_CONFIG_MESSAGE } from "./messages";
import type { ChatRequest, ChatStream, Effort, JsonRequest, JsonResponse, LlmProvider, StopReason } from "./types";

/** Override with GEMINI_MODEL. Keep it a Flash-class model: "none" thinking (budget 0) is not allowed on Pro models. */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

/**
 * Used when the main model answers 429/5xx (new Gemini models are often overloaded). Override with
 * GEMINI_FALLBACK_MODEL, or set it to "none" to turn the fallback off.
 */
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-3-flash-preview";

/** Thinking tokens per effort level. They count against the output limit, so callers add them to maxOutputTokens. */
const THINKING_BUDGET: Record<Effort, number> = { none: 0, low: 512, medium: 1_024, high: 4_096 };

const REFUSAL_REASONS = new Set<string>([
  FinishReason.SAFETY,
  FinishReason.BLOCKLIST,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.SPII,
  FinishReason.RECITATION,
]);

let client: GoogleGenAI | undefined;

function getGemini(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("[gemini] GEMINI_API_KEY is not set");
    throw new AppError("AI_CONFIG", AI_CONFIG_MESSAGE);
  }
  // The SDK retries 408/429/5xx with backoff; its defaults (5 attempts, up to 60 s) are too slow for a page load.
  client = new GoogleGenAI({ apiKey, httpOptions: { timeout: 120_000, retryOptions: { attempts: 2, initialDelay: 1, maxDelay: 4 } } });
  return client;
}

export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function geminiFallbackModel(): string | undefined {
  const fallback = process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_GEMINI_FALLBACK_MODEL;
  return fallback.toLowerCase() === "none" || fallback === geminiModel() ? undefined : fallback;
}

/** Overloaded, rate limited or timed out. A client that went away (`signal` aborted) is not the model's fault. */
function isOverloaded(err: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return false;
  if (err instanceof ApiError) return err.status === 429 || err.status >= 500;
  const name = err instanceof Error ? err.name : "";
  return name === "AbortError" || name === "TimeoutError";
}

/** The main model gets this long per attempt when a fallback exists; an overloaded model otherwise holds a page for minutes. */
const MAIN_MODEL_TIMEOUT_MS = 45_000;
/** After the main model fails, go straight to the fallback for this long instead of paying the timeout again. */
const MAIN_MODEL_COOLDOWN_MS = 60_000;

const breaker = singleton("geminiMainModelBreaker", () => ({ downUntil: 0 }));

/** For tests: forget that the main model recently failed. */
export function resetGeminiBreaker(): void {
  breaker.downUntil = 0;
}

type CallOptions = { timeout: number; retryOptions: { attempts: number } } | undefined;

/**
 * Runs `call` on the main model, and on the fallback model if the main one is overloaded, rate limited or
 * too slow. Without a fallback, the main model gets the client's normal timeout and retries.
 */
async function withFallback<T>(call: (model: string, http: CallOptions) => Promise<T>, signal?: AbortSignal): Promise<{ result: T; model: string }> {
  const main = geminiModel();
  const fallback = geminiFallbackModel();
  if (!fallback) return { result: await call(main, undefined), model: main };
  if (Date.now() >= breaker.downUntil) {
    try {
      return { result: await call(main, { timeout: MAIN_MODEL_TIMEOUT_MS, retryOptions: { attempts: 1 } }), model: main };
    } catch (err) {
      if (!isOverloaded(err, signal)) throw err;
      breaker.downUntil = Date.now() + MAIN_MODEL_COOLDOWN_MS;
      console.warn(`[gemini] ${main} overloaded (${err instanceof ApiError ? err.status : (err as Error).name}), using ${fallback} for a minute`);
    }
  }
  return { result: await call(fallback, undefined), model: fallback };
}

/** Maps SDK errors to user-safe AppErrors. Details are logged server-side only. */
export function toGeminiError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof ApiError) {
    // 429 is the free tier's per-minute or per-day quota; 5xx is Google being overloaded.
    if (err.status === 429 || err.status >= 500) {
      console.warn(`[gemini] busy ${err.status} ${err.message.slice(0, 300)}`);
      return new AppError("AI_BUSY", AI_BUSY_MESSAGE);
    }
    console.error(`[gemini] ${err.status} ${err.message.slice(0, 300)}`);
    return new AppError("AI_CONFIG", AI_CONFIG_MESSAGE);
  }
  const name = err instanceof Error ? err.name : "";
  const message = err instanceof Error ? err.message : String(err);
  if (name === "AbortError" || name === "TimeoutError" || /fetch failed|ECONN|ETIMEDOUT|ENOTFOUND|network/i.test(message)) {
    console.warn("[gemini] busy", message);
    return new AppError("AI_BUSY", AI_BUSY_MESSAGE);
  }
  console.error("[gemini] unexpected error", err);
  return new AppError("AI_CONFIG", AI_CONFIG_MESSAGE);
}

function usageOf(res: GenerateContentResponse): TokenUsage | null {
  const u = res.usageMetadata;
  if (!u) return null;
  const cached = u.cachedContentTokenCount ?? 0;
  return {
    input_tokens: Math.max(0, (u.promptTokenCount ?? 0) - cached),
    // Thinking tokens are billed as output.
    output_tokens: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
    cache_read_input_tokens: cached,
    cache_creation_input_tokens: 0,
  };
}

function refused(res: GenerateContentResponse): boolean {
  if (res.promptFeedback?.blockReason) return true;
  const reason = res.candidates?.[0]?.finishReason;
  return reason !== undefined && REFUSAL_REASONS.has(reason);
}

function stopReasonOf(res: GenerateContentResponse): StopReason {
  if (refused(res)) return "refusal";
  return res.candidates?.[0]?.finishReason === FinishReason.MAX_TOKENS ? "max_tokens" : "end";
}

/** Google Gemini. The default provider; needs GEMINI_API_KEY. */
export const geminiProvider: LlmProvider = {
  name: "gemini",
  get model() {
    return geminiModel();
  },

  async completeJson({ system, user, maxTokens, effort }: JsonRequest): Promise<JsonResponse> {
    try {
      const budget = THINKING_BUDGET[effort];
      const { result: res, model } = await withFallback((m, http) =>
        getGemini().models.generateContent({
          model: m,
          contents: user,
          config: {
            httpOptions: http,
            systemInstruction: system,
            maxOutputTokens: maxTokens + budget,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: budget },
          },
        }),
      );
      return { text: res.text ?? "", stopReason: stopReasonOf(res), usage: usageOf(res), model };
    } catch (err) {
      throw toGeminiError(err);
    }
  },

  streamChat({ system, messages, maxTokens }: ChatRequest): ChatStream {
    const controller = new AbortController();
    let last: GenerateContentResponse | undefined;
    let blocked = false;
    let usedModel: string | undefined;

    async function* chunks() {
      const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      const { result: stream, model } = await withFallback((m, http) =>
        getGemini().models.generateContentStream({
          model: m,
          contents,
          config: {
            httpOptions: http,
            systemInstruction: system,
            maxOutputTokens: maxTokens,
            thinkingConfig: { thinkingBudget: THINKING_BUDGET.none },
            abortSignal: controller.signal,
          },
        }),
        controller.signal,
      );
      usedModel = model;
      for await (const chunk of stream) {
        last = chunk;
        blocked ||= refused(chunk);
        const text = chunk.text;
        if (text) yield text;
      }
    }

    return {
      chunks: chunks(),
      async finish() {
        return { refused: blocked, usage: last ? usageOf(last) : null, model: usedModel };
      },
      abort: () => controller.abort(),
    };
  },

  toError: toGeminiError,
};
