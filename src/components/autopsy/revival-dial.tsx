"use client";

import { useEffect, useState } from "react";

const R = 52;
const C = 2 * Math.PI * R;

/** Counts up once on mount; jumps straight to the score under reduced motion. */
export function RevivalDial({ score }: { score: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : 1200;
    let frame = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = duration === 0 ? 1 : Math.min(1, (t - start) / duration);
      setShown(Math.round(score * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative size-40 shrink-0 sm:size-48" role="img" aria-label={`Revival score ${score} out of 100`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-border)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - shown / 100)}
          style={{ filter: "drop-shadow(0 0 6px rgb(124 255 178 / 0.45))" }}
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-semibold tabular-nums text-foreground sm:text-6xl">{shown}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">of 100</span>
      </div>
    </div>
  );
}
