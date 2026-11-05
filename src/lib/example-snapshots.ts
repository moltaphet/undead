import atom from "@/data/examples/atom__atom.json";
import brackets from "@/data/examples/adobe__brackets.json";
import angularjs from "@/data/examples/angular__angular.js.json";
import { z } from "zod";
import { repoKey, type RepoRef } from "./repo-url";
import { autopsySchema, repoDossierSchema, resurrectionSchema } from "./schemas";

const snapshotSchema = z.object({
  generatedAt: z.string(),
  provider: z.string(),
  model: z.string(),
  dossier: repoDossierSchema,
  autopsy: autopsySchema,
  resurrection: resurrectionSchema,
});

export type ExampleSnapshot = z.infer<typeof snapshotSchema>;

const RAW = { "atom/atom": atom, "adobe/brackets": brackets, "angular/angular.js": angularjs };

/** Real model output saved once, so the three example repos open instantly and never spend credits. */
export const EXAMPLE_SNAPSHOTS: ReadonlyMap<string, ExampleSnapshot> = new Map(
  Object.entries(RAW).map(([key, raw]) => [key, snapshotSchema.parse(raw)]),
);

export function exampleSnapshot(ref: RepoRef): ExampleSnapshot | undefined {
  return EXAMPLE_SNAPSHOTS.get(repoKey(ref));
}
