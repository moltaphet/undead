import "server-only";
import type { MessageStreamEvent } from "@anthropic-ai/sdk/resources/messages";
import { getAnthropic, toAiError } from "../anthropic";
import { MODEL } from "../config";
import type { ChatRequest, ChatStream, Effort, JsonRequest, JsonResponse, LlmProvider } from "./types";

function textOf(event: MessageStreamEvent): string | null {
  return event.type === "content_block_delta" && event.delta.type === "text_delta" ? event.delta.text : null;
}

/** Claude on the Anthropic API. Selected with LLM_PROVIDER=anthropic and ANTHROPIC_API_KEY. */
export const anthropicProvider: LlmProvider = {
  name: "anthropic",
  model: MODEL,

  async completeJson({ system, user, maxTokens, effort }: JsonRequest): Promise<JsonResponse> {
    try {
      const res = await getAnthropic().beta.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
        output_config: { effort: (effort === "none" ? "low" : effort) satisfies Exclude<Effort, "none"> },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
      const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      const stopReason = res.stop_reason === "refusal" ? "refusal" : res.stop_reason === "max_tokens" ? "max_tokens" : "end";
      return { text, stopReason, usage: res.usage };
    } catch (err) {
      throw toAiError(err);
    }
  },

  streamChat({ system, messages, maxTokens }: ChatRequest): ChatStream {
    const stream = getAnthropic().messages.stream({
      model: MODEL,
      max_tokens: maxTokens,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
      thinking: { type: "between_tools" },
      output_config: { effort: "low" },
    });
    async function* chunks() {
      for await (const event of stream) {
        const text = textOf(event);
        if (text) yield text;
      }
    }
    return {
      chunks: chunks(),
      async finish() {
        const final = await stream.finalMessage().catch(() => null);
        return { refused: final?.stop_reason === "refusal", usage: final?.usage };
      },
      abort: () => stream.abort(),
    };
  },

  toError: toAiError,
};
