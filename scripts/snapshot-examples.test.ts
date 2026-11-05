import { mkdirSync, writeFileSync } from "node:fs";
import { describe, it } from "vitest";
import { runAutopsy } from "@/lib/ai/autopsy";
import { runResurrection } from "@/lib/ai/resurrection";
import { getDossier } from "@/lib/dossier";
import { EXAMPLE_REPOS } from "@/lib/examples";
import { getProvider } from "@/lib/llm";

/**
 * Generates the committed example snapshots from real model output. Run with the keys loaded:
 *   node --env-file=.env.local node_modules/.bin/vitest run --config vitest.snapshot.config.mts
 * Set ONLY=owner/repo to regenerate one example.
 */
describe("snapshot examples", () => {
  for (const ex of EXAMPLE_REPOS) {
    const only = process.env.ONLY;
    it.skipIf(only && only !== ex.label)(`${ex.label}`, async () => {
      const ref = { owner: ex.owner, repo: ex.repo };
      const dossier = await getDossier(ref);
      const autopsy = await runAutopsy(dossier);
      const resurrection = await runResurrection(dossier, autopsy);
      const provider = getProvider();
      const snapshot = { generatedAt: new Date().toISOString(), provider: provider.name, model: provider.model, dossier, autopsy, resurrection };
      mkdirSync("src/data/examples", { recursive: true });
      writeFileSync(`src/data/examples/${ex.owner}__${ex.repo}.json`, `${JSON.stringify(snapshot, null, 2)}\n`);
      console.info(`[snapshot] ${ex.label}: ${autopsy.causeOfDeath.headline} | score ${autopsy.revivalScore}`);
    });
  }
});
