import "server-only";
import type { z } from "zod";
import { AppError } from "../errors";
import { getProvider } from "../llm";
import type { Effort, StopReason } from "../llm/types";
import { logUsage } from "../usage";
import { extractJsonObject } from "./json";

export const AI_BAD_OUTPUT_MESSAGE = "The coroner's handwriting came out illegible. Try again.";

export interface GenerateJsonOptions<S extends z.ZodType> {
  /** Short name for usage logs, e.g. "autopsy". */
  label: string;
  system: string;
  user: string;
  schema: S;
  maxTokens: number;
  effort: Exclude<Effort, "none">;
  /** Extra deterministic checks after zod; returns a list of problems (empty = fine). */
  check?: (data: z.infer<S>) => string[];
}

type Attempt<T> = { ok: true; data: T } | { ok: false; output: string; problems: string[] };

function evaluate<S extends z.ZodType>(
  text: string,
  stopReason: StopReason,
  opts: GenerateJsonOptions<S>,
): Attempt<z.infer<S>> {
  if (stopReason === "refusal") return { ok: false, output: text, problems: ["The response was declined."] };
  if (stopReason === "max_tokens") {
    return { ok: false, output: text, problems: ["The response was cut off. Be more concise."] };
  }
  let raw: unknown;
  try {
    raw = extractJsonObject(text);
  } catch (err) {
    return { ok: false, output: text, problems: [(err as Error).message] };
  }
  const parsed = opts.schema.safeParse(raw);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
    return { ok: false, output: text, problems };
  }
  const problems = opts.check?.(parsed.data) ?? [];
  return problems.length ? { ok: false, output: text, problems } : { ok: true, data: parsed.data };
}

/**
 * Calls Claude for a JSON object, validates it with zod (plus optional checks),
 * and retries once with the problems listed. Throws AI_BAD_OUTPUT if both attempts fail.
 */
export async function generateJson<S extends z.ZodType>(opts: GenerateJsonOptions<S>): Promise<z.infer<S>> {
  const provider = getProvider();
  let user = opts.user;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await provider.completeJson({ system: opts.system, user, maxTokens: opts.maxTokens, effort: opts.effort });
    logUsage(attempt === 1 ? opts.label : `${opts.label}#retry`, provider.name, res.usage, res.model);
    const result = evaluate(res.text, res.stopReason, opts);
    if (result.ok) return result.data;

    console.warn(`[ai] attempt ${attempt} invalid:`, result.problems.slice(0, 8).join(" | "));
    user = [
      opts.user,
      "",
      "Your previous answer was rejected. It was:",
      "<previous_answer>",
      result.output.slice(0, 12_000),
      "</previous_answer>",
      "Problems found:",
      ...result.problems.slice(0, 20).map((p) => `- ${p}`),
      "",
      "Return the corrected JSON object only.",
    ].join("\n");
  }
  throw new AppError("AI_BAD_OUTPUT", AI_BAD_OUTPUT_MESSAGE);
}
