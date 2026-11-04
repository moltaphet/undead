import type { ReactNode } from "react";
import { CopyButton } from "../copy-button";

export function Chapter({ id, title, copy, children }: { id: string; title: string; copy?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-border pt-10 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id={`${id}-title`} className="font-display text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {copy && <CopyButton text={copy} label={title} />}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface/60 p-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{label}</p>
        <p className="mt-1.5 leading-relaxed text-foreground">{text}</p>
      </div>
      <CopyButton text={text} label={label} />
    </div>
  );
}
