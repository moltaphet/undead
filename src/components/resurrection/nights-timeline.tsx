"use client";

import { useStoredSet } from "@/hooks/use-stored-set";
import type { Resurrection } from "@/lib/schemas";

/** "Days" are called nights in the UI only. Checkbox state lives in localStorage per repo. */
export function NightsTimeline({ plan, storageKey }: { plan: Resurrection["sevenDayPlan"]; storageKey: string }) {
  const [done, toggle] = useStoredSet(storageKey);
  const total = plan.reduce((n, d) => n + d.tasks.length, 0);
  const count = plan.reduce((n, d) => n + d.tasks.filter((_, i) => done.has(`${d.day}:${i}`)).length, 0);

  return (
    <div>
      <p className="mb-5 text-sm text-muted" aria-live="polite">
        {count} of {total} tasks done. Progress is saved in this browser.
      </p>
      <ol className="relative flex flex-col gap-6 border-l border-border pl-6 sm:pl-8">
        {plan.map((night) => (
          <li key={night.day} className="relative">
            <span aria-hidden="true" className="absolute top-5 -left-[31px] size-3 rounded-full border-2 border-primary bg-background sm:-left-[39px]" />
            <div className="rounded-lg border border-border bg-surface/60 p-5">
              <h3 className="font-display text-xl font-semibold">
                <span className="mr-2 font-mono text-xs font-normal uppercase tracking-[0.2em] text-primary">Night {night.day}</span>
                {night.title}
              </h3>
              <ul className="mt-3 flex flex-col gap-1">
                {night.tasks.map((task, i) => {
                  const id = `${night.day}:${i}`;
                  const checked = done.has(id);
                  return (
                    <li key={id}>
                      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md py-2 text-sm leading-relaxed hover:text-foreground">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(id)}
                          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-primary)]"
                        />
                        <span className={checked ? "text-muted line-through" : "text-foreground"}>{task}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
