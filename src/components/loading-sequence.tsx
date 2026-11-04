"use client";

import { useEffect, useState } from "react";
import { Spinner } from "./ui/spinner";

/** Cycles themed lines every ~1.5s. Flavor text, not real progress, so there is no progress bar. */
export function LoadingSequence({ lines, note }: { lines: readonly string[]; note?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % lines.length), 1500);
    return () => clearInterval(id);
  }, [lines.length]);

  return (
    <div className="flex min-h-[60dvh] flex-1 flex-col items-center justify-center gap-5 px-4 text-center">
      <Spinner className="size-8 text-primary" label="Loading" />
      <p role="status" aria-live="polite" className="font-display text-2xl italic text-foreground sm:text-3xl">
        {lines[index]}
      </p>
      {note && <p className="max-w-sm text-sm text-muted">{note}</p>}
    </div>
  );
}
