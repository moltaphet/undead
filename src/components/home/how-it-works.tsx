import type { ReactNode } from "react";
import { AutopsyIcon, ResurrectionIcon, SeanceIcon } from "./icons";

const STEPS: { title: string; body: string; icon: ReactNode }[] = [
  { title: "Autopsy", body: "A deadpan coroner reads the commits, the README and the silence, then tells you what really killed it.", icon: <AutopsyIcon /> },
  { title: "Séance", body: "Talk to the ghost of your project. It remembers every promise you made it.", icon: <SeanceIcon /> },
  { title: "Resurrection", body: "A cut-down MVP, seven nights of work, launch copy and a pitch for Vibestarter.", icon: <ResurrectionIcon /> },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="py-16">
      <h2 id="how-title" className="text-center font-mono text-xs uppercase tracking-[0.3em] text-muted">
        How it works
      </h2>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-xl border border-border bg-surface/60 p-6">
            <div className="flex items-center justify-between text-primary">
              {s.icon}
              <span aria-hidden="true" className="font-mono text-xs text-muted">0{i + 1}</span>
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
