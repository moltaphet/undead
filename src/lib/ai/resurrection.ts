import "server-only";
import { dossierToPrompt } from "../dossier";
import { RESURRECTION_SYSTEM_PROMPT, resurrectionUserMessage } from "../prompts/resurrection";
import { resurrectionSchema, type Autopsy, type RepoDossier, type Resurrection } from "../schemas";
import { generateJson } from "./generate";
import { checkResurrection } from "./resurrection-rules";

export async function runResurrection(dossier: RepoDossier, autopsy: Autopsy, now = new Date()): Promise<Resurrection> {
  const plan = await generateJson({
    label: "resurrection",
    system: RESURRECTION_SYSTEM_PROMPT,
    user: resurrectionUserMessage(dossierToPrompt(dossier), JSON.stringify(autopsy, null, 2), now.toISOString().slice(0, 10)),
    schema: resurrectionSchema,
    maxTokens: 8_000,
    effort: "medium",
    check: (r) => checkResurrection(r, autopsy.revivalScore),
  });
  return { ...plan, honestNote: autopsy.revivalScore < 25 ? plan.honestNote : null };
}
