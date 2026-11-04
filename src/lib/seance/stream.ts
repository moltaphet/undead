import "server-only";
import { getProvider } from "../llm";
import { SEANCE_OPENING } from "../prompts/seance";
import type { SeanceMessage } from "../schemas";
import { logUsage } from "../usage";

export const FADING_LINE = "...the connection to the other side is fading. Try again.";
export const REFUSAL_LINE = "Some things stay buried.";

/**
 * Starts the ghost's reply. Waits for the first text chunk before returning, so errors that
 * happen before any output can still be answered with a typed JSON error and a real status.
 */
export async function createSeanceStream(system: string, history: SeanceMessage[], signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const provider = getProvider();
  const stream = provider.streamChat({
    system,
    messages: [{ role: "user", content: SEANCE_OPENING }, ...history],
    maxTokens: 600,
  });
  const abort = () => stream.abort();
  signal.addEventListener("abort", abort, { once: true });

  const chunks = stream.chunks[Symbol.asyncIterator]();
  let first: string | null = null;
  try {
    while (first === null) {
      const next = await chunks.next();
      if (next.done) break;
      first = next.value;
    }
  } catch (err) {
    signal.removeEventListener("abort", abort);
    throw provider.toError(err);
  }

  let sentText = first !== null;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(first ?? REFUSAL_LINE));
    },
    async pull(controller) {
      try {
        const next = await chunks.next();
        if (next.done) {
          const final = await stream.finish();
          logUsage(`seance history=${history.length}`, provider.name, final.usage, final.model);
          if (final.refused && sentText) controller.enqueue(encoder.encode(` ${REFUSAL_LINE}`));
          signal.removeEventListener("abort", abort);
          controller.close();
          return;
        }
        sentText = true;
        controller.enqueue(encoder.encode(next.value));
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
