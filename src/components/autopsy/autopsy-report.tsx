import { buildShareText, xIntentUrl } from "@/lib/certificate/data";
import { SITE_URL } from "@/lib/config";
import { formatDate } from "@/lib/format";
import type { Report } from "@/lib/report";
import { SectionLabel } from "../section-label";
import { CaseHeader } from "./case-header";
import { CtaRow } from "./cta-row";
import { Diagnosis } from "./diagnosis";
import { Findings } from "./findings";
import { LastWords } from "./last-words";
import { RevivalDial } from "./revival-dial";
import { Tombstone } from "./tombstone";

export function AutopsyReport({ report }: { report: Report }) {
  const { dossier, autopsy } = report;
  const alive = dossier.signals.status === "alive";
  const { owner, name } = dossier.repo;
  const resultUrl = `${SITE_URL}/r/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const shareText = buildShareText(name, autopsy.causeOfDeath.headline, autopsy.revivalScore, resultUrl, dossier.signals.status);

  return (
    <article className="flex flex-col gap-10 sm:gap-14">
      <CaseHeader dossier={dossier} autopsy={autopsy} />

      <section aria-labelledby="cause">
        <SectionLabel id="cause">{alive ? "Diagnosis at a glance" : "Cause of death"}</SectionLabel>
        <p className="mt-3 font-display text-3xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
          {autopsy.causeOfDeath.headline}
        </p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">{autopsy.causeOfDeath.explanation}</p>
        <p className="mt-3 text-sm text-muted">
          <span className="text-foreground">Time of death: {formatDate(autopsy.timeOfDeath.date)}.</span>{" "}
          {autopsy.timeOfDeath.note}
        </p>
      </section>

      <LastWords dossier={dossier} />
      <Diagnosis items={autopsy.diagnosis} />
      <Findings autopsy={autopsy} />

      <section aria-labelledby="revival" className="flex flex-col items-center gap-6 rounded-xl border border-border bg-surface/60 p-6 sm:flex-row sm:p-8">
        <RevivalDial score={autopsy.revivalScore} />
        <div className="text-center sm:text-left">
          <SectionLabel id="revival">Revival odds</SectionLabel>
          <p className="mt-3 font-display text-2xl leading-snug text-foreground">{autopsy.revivalScoreReason}</p>
        </div>
      </section>

      <Tombstone
        epitaph={autopsy.epitaph}
        born={new Date(dossier.repo.createdAt).getUTCFullYear().toString()}
        died={alive ? "still kicking" : new Date(autopsy.timeOfDeath.date).getUTCFullYear().toString()}
      />

      <CtaRow owner={owner} repo={name} resultUrl={resultUrl} shareUrl={xIntentUrl(shareText)} />
    </article>
  );
}
