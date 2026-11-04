import { VERDICT_LABELS } from "@/lib/format";
import type { Autopsy } from "@/lib/schemas";
import { SectionLabel } from "../section-label";
import { Card } from "../ui/card";

export function Findings({ autopsy }: { autopsy: Autopsy }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <SectionLabel>Worth saving</SectionLabel>
        <ul className="mt-4 flex flex-col gap-3">
          {autopsy.worthSaving.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed sm:text-base">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <SectionLabel>Market today</SectionLabel>
        <p className="mt-4 font-display text-xl text-foreground">{VERDICT_LABELS[autopsy.marketToday.verdict]}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{autopsy.marketToday.reasoning}</p>
      </Card>
    </div>
  );
}
