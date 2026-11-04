import "server-only";
import { ApiError, FinishReason, GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { AppError } from "../errors";
import type { TokenUsage } from "../usage";
import { AI_BUSY_MESSAGE, AI_CONFIG_MESSAGE } from "./messages";
import type { ChatRequest, ChatStream, Effort, JsonRequest, JsonResponse, LlmProvider, StopReason } from "./types";

/** Override with GEMINI_MODEL. Keep it a Flash-class model: "none" thinking (budget 0) is not allowed on Pro models. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

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
  client = new GoogleGenAI({ apiKey, httpOptions: { timeout: 120_000 } });
  return client;
}

export function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
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
      const res = await getGemini().models.generateContent({
        model: geminiModel(),
        contents: user,
        config: {
          systemInstruction: system,
          maxOutputTokens: maxTokens + budget,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: budget },
        },
      });
      return { text: res.text ?? "", stopReason: stopReasonOf(res), usage: usageOf(res) };
    } catch (err) {
      throw toGeminiError(err);
    }
  },

  streamChat({ system, messages, maxTokens }: ChatRequest): ChatStream {
    const controller = new AbortController();
    let last: GenerateContentResponse | undefined;
    let blocked = false;

    async function* chunks() {
      const stream = await getGemini().models.generateContentStream({
        model: geminiModel(),
        contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        config: {
          systemInstruction: system,
          maxOutputTokens: maxTokens,
          thinkingConfig: { thinkingBudget: THINKING_BUDGET.none },
          abortSignal: controller.signal,
        },
      });
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
        return { refused: blocked, usage: last ? usageOf(last) : null };
      },
      abort: () => controller.abort(),
    };
  },

  toError: toGeminiError,
};
