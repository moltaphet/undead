import "server-only";
import { dossierToPrompt } from "../dossier";
import { AUTOPSY_SYSTEM_PROMPT, autopsyUserMessage } from "../prompts/autopsy";
import { autopsyModelSchema, type Autopsy, type RepoDossier } from "../schemas";
import { generateJson } from "./generate";

/** Accepts the model's date only if it parses and falls within the repo's lifetime; otherwise uses the data. */
export function sanitizeTimeOfDeath(date: string, dossier: RepoDossier, now: Date): string {
  const fallback = dossier.signals.commitCadence.lastCommitDate ?? dossier.repo.pushedAt;
  const t = new Date(date).getTime();
  const born = new Date(dossier.repo.createdAt).getTime() - 86_400_000;
  if (!Number.isFinite(t) || t < born || t > now.getTime()) return fallback;
  return new Date(t).toISOString();
}

export function finalizeAutopsy(
  raw: Omit<Autopsy, "lastWords">,
  dossier: RepoDossier,
  now: Date,
): Autopsy {
  return {
    ...raw,
    timeOfDeath: { ...raw.timeOfDeath, date: sanitizeTimeOfDeath(raw.timeOfDeath.date, dossier, now) },
    diagnosis: [...raw.diagnosis].sort((a, b) => b.severity - a.severity),
    lastWords: dossier.signals.lastWords,
  };
}

export async function runAutopsy(dossier: RepoDossier, now = new Date()): Promise<Autopsy> {
  const raw = await generateJson({
    label: "autopsy",
    system: AUTOPSY_SYSTEM_PROMPT,
    user: autopsyUserMessage(dossierToPrompt(dossier), now.toISOString().slice(0, 10)),
    schema: autopsyModelSchema,
    maxTokens: 4_096,
    effort: "medium",
  });
  return finalizeAutopsy(raw, dossier, now);
}
