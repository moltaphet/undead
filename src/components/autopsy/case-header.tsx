import Image from "next/image";
import { caseNumber, formatCount, formatDate } from "@/lib/format";
import type { Autopsy, RepoDossier } from "@/lib/schemas";
import { StatusStamp } from "./status-stamp";

export function CaseHeader({ dossier, autopsy }: { dossier: RepoDossier; autopsy: Autopsy }) {
  const r = dossier.repo;
  const facts = [
    { label: "Born", value: formatDate(r.createdAt) },
    { label: "Died", value: dossier.signals.status === "alive" ? "Not yet" : formatDate(autopsy.timeOfDeath.date) },
    { label: "Language", value: r.language ?? "Unknown" },
    { label: "Stars", value: formatCount(r.stars) },
  ];

  return (
    <header className="rounded-xl border border-border bg-surface/80 p-5 backdrop-blur-sm sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted">Case file #{caseNumber(r.fullName)}</p>
        <StatusStamp status={dossier.signals.status} />
      </div>
      <div className="mt-5 flex items-center gap-4">
        <Image
          src={r.avatarUrl}
          alt={`${r.owner} on GitHub`}
          width={56}
          height={56}
          className="size-12 shrink-0 rounded-full border border-border sm:size-14"
        />
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight break-words sm:text-4xl">
            <a href={r.url} className="-my-2 inline-block py-2 hover:text-primary" target="_blank" rel="noopener noreferrer">
              {r.fullName}
            </a>
          </h1>
          {r.description && <p className="mt-1 text-sm text-muted sm:text-base">{r.description}</p>}
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-5 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{f.label}</dt>
            <dd className="mt-0.5 text-sm text-foreground sm:text-base">{f.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
