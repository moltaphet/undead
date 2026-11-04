import type { Metadata } from "next";
import { headers } from "next/headers";
import { ResultError } from "@/components/result-error";
import { Spellbook } from "@/components/resurrection/spellbook";
import { clientIp } from "@/lib/http";
import { loadResurrection } from "@/lib/report";

export const maxDuration = 180;

type Props = PageProps<"/r/[owner]/[repo]/resurrect">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { repo } = await params;
  const title = `${decodeURIComponent(repo)} — Resurrection plan | Undead`;
  return { title: { absolute: title }, description: "A 7-night relaunch kit built from the autopsy." };
}

export default async function ResurrectPage({ params }: Props) {
  const { owner, repo } = await params;
  const result = await loadResurrection(owner, repo, clientIp(await headers()));
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      {result.ok ? <Spellbook report={result.report} plan={result.resurrection} /> : <ResultError {...result.error} />}
    </main>
  );
}
