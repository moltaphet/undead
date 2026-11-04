import type { Metadata } from "next";
import { headers } from "next/headers";
import { AutopsyReport } from "@/components/autopsy/autopsy-report";
import { ResultError } from "@/components/result-error";
import { clientIp } from "@/lib/http";
import { loadReport } from "@/lib/report";

export const maxDuration = 120;

type Props = PageProps<"/r/[owner]/[repo]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, repo } = await params;
  const result = await loadReport(owner, repo, clientIp(await headers()));
  const title = `${decodeURIComponent(repo)} — Autopsy | Undead`;
  if (!result.ok) return { title: { absolute: title } };
  const description = result.report.autopsy.causeOfDeath.headline;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: "article", url: `/r/${owner}/${repo}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ResultPage({ params }: Props) {
  const { owner, repo } = await params;
  const result = await loadReport(owner, repo, clientIp(await headers()));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      {result.ok ? <AutopsyReport report={result.report} /> : <ResultError {...result.error} />}
    </main>
  );
}
