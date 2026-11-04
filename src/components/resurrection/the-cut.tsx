import type { Resurrection } from "@/lib/schemas";

export function TheCut({ cut }: { cut: Resurrection["mvpCut"] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-primary/40 bg-surface/60 p-5">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Keep</h3>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed">
          {cut.keep.map((k) => <li key={k}>{k}</li>)}
        </ul>
      </div>
      <div className="rounded-lg border border-border bg-background/60 p-5">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Kill</h3>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed">
          {cut.kill.map((k) => {
            const [item, ...reason] = k.split(/\s+[—–-]\s+(?=because)/i);
            return (
              <li key={k}>
                <span className="text-muted line-through decoration-danger decoration-2">{item}</span>
                {reason.length > 0 && <span className="block text-muted">— {reason.join(" ")}</span>}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="rounded-lg border border-dashed border-primary/50 bg-surface/30 p-5">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Build</h3>
        <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed">
          {cut.build.map((b) => <li key={b}>{b}</li>)}
        </ul>
      </div>
    </div>
  );
}
