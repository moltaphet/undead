import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AutopsyReport } from "@/components/autopsy/autopsy-report";
import { Spellbook } from "@/components/resurrection/spellbook";
import { SeanceChat } from "@/components/seance/seance-chat";
import { finalizeAutopsy } from "@/lib/ai/autopsy";
import { getDossier } from "@/lib/dossier";
import { modelAutopsy } from "@/test/autopsy-fixture";
import { resurrectionFixture } from "@/test/resurrection-fixture";

/** Dev-only: real dossier (atom/atom) + fixture AI output, for layout checks without an API key. */
export default async function DevPreview({ params }: PageProps<"/dev/preview/[view]">) {
  await connection();
  if (process.env.NODE_ENV === "production") notFound();
  const { view } = await params;
  const dossier = await getDossier({ owner: "atom", repo: "atom" });
  const report = { dossier, autopsy: finalizeAutopsy(modelAutopsy({ revivalScore: 64 }), dossier, new Date()) };

  if (view === "autopsy") {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <AutopsyReport report={report} />
      </main>
    );
  }
  if (view === "resurrect") {
    const plan = { ...resurrectionFixture(), honestNote: "Fixture note: the original idea is crowded; pivot the plugin system." };
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <Spellbook report={report} plan={plan} />
      </main>
    );
  }
  if (view === "seance") {
    return (
      <main className="flex flex-1 flex-col">
        <SeanceChat owner="atom" repo="atom" fullName={dossier.repo.fullName} avatarUrl={dossier.repo.avatarUrl} />
      </main>
    );
  }
  notFound();
}
