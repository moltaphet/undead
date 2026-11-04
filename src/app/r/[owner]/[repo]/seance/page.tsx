import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ResultError } from "@/components/result-error";
import { SeanceChat } from "@/components/seance/seance-chat";
import { clientIp } from "@/lib/http";
import { loadReport } from "@/lib/report";

export const maxDuration = 120;

export const viewport: Viewport = { interactiveWidget: "resizes-content" };

type Props = PageProps<"/r/[owner]/[repo]/seance">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { repo } = await params;
  return { title: { absolute: `${decodeURIComponent(repo)} — Séance | Undead` }, description: "Talk to the ghost of your project." };
}

export default async function SeancePage({ params }: Props) {
  const { owner, repo } = await params;
  const result = await loadReport(owner, repo, clientIp(await headers()));
  if (!result.ok) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <ResultError {...result.error} />
      </main>
    );
  }
  const r = result.report.dossier.repo;
  return (
    <main className="flex flex-1 flex-col">
      <SeanceChat owner={r.owner} repo={r.name} fullName={r.fullName} avatarUrl={r.avatarUrl} />
    </main>
  );
}
