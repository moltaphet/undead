import { FACTOR_LABELS } from "@/lib/format";
import type { Autopsy } from "@/lib/schemas";
import { SectionLabel } from "../section-label";

function SeverityMeter({ severity }: { severity: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Severity ${severity} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= severity ? "h-2 w-5 rounded-full bg-primary" : "h-2 w-5 rounded-full bg-border"}
        />
      ))}
    </div>
  );
}

export function Diagnosis({ items }: { items: Autopsy["diagnosis"] }) {
  return (
    <section aria-labelledby="diagnosis">
      <SectionLabel id="diagnosis">Diagnosis</SectionLabel>
      <ol className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface/60">
        {items.map((d) => (
          <li key={d.factor} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-5">
            <div className="flex shrink-0 items-center justify-between gap-4 sm:w-44 sm:flex-col sm:items-start">
              <span className="font-medium text-foreground">{FACTOR_LABELS[d.factor]}</span>
              <SeverityMeter severity={d.severity} />
            </div>
            <p className="text-sm leading-relaxed text-muted sm:text-base">{d.evidence}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
