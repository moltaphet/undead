import "server-only";
import type { MessageStreamEvent } from "@anthropic-ai/sdk/resources/messages";
import { getAnthropic, toAiError } from "../anthropic";
import { MODEL } from "../config";
import { SEANCE_OPENING } from "../prompts/seance";
import type { SeanceMessage } from "../schemas";
import { logUsage } from "../usage";

export const FADING_LINE = "...the connection to the other side is fading. Try again.";
export const REFUSAL_LINE = "Some things stay buried.";

function textOf(event: MessageStreamEvent): string | null {
  return event.type === "content_block_delta" && event.delta.type === "text_delta" ? event.delta.text : null;
}

/**
 * Starts the ghost's reply. Waits for the first text chunk before returning, so errors that
 * happen before any output can still be answered with a typed JSON error and a real status.
 */
export async function createSeanceStream(system: string, history: SeanceMessage[], signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const stream = getAnthropic().messages.stream({
    model: MODEL,
    max_tokens: 600,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: SEANCE_OPENING }, ...history],
    thinking: { type: "between_tools" },
    output_config: { effort: "low" },
  });
  const abort = () => stream.abort();
  signal.addEventListener("abort", abort, { once: true });

  const events = stream[Symbol.asyncIterator]();
  let first: string | null = null;
  try {
    while (first === null) {
      const next = await events.next();
      if (next.done) break;
      first = textOf(next.value);
    }
  } catch (err) {
    signal.removeEventListener("abort", abort);
    throw toAiError(err);
  }

  let sentText = first !== null;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(first ?? REFUSAL_LINE));
    },
    async pull(controller) {
      try {
        const next = await events.next();
        if (next.done) {
          const final = await stream.finalMessage().catch(() => null);
          logUsage(`seance history=${history.length}`, final?.usage);
          if (final?.stop_reason === "refusal" && sentText) controller.enqueue(encoder.encode(` ${REFUSAL_LINE}`));
          signal.removeEventListener("abort", abort);
          controller.close();
          return;
        }
        const text = textOf(next.value);
        if (text) {
          sentText = true;
          controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        signal.removeEventListener("abort", abort);
        if (!signal.aborted) {
          console.warn("[seance] stream failed mid-reply", (err as Error).message);
          controller.enqueue(encoder.encode(`\n\n${FADING_LINE}`));
        }
        controller.close();
      }
    },
    cancel() {
      abort();
      signal.removeEventListener("abort", abort);
    },
  });
}
