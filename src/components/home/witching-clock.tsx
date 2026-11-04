"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const id = setInterval(callback, 15_000);
  return () => clearInterval(id);
}

function snapshot(): string {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return now.getHours() < 4 ? `${time} · the witching hour` : time;
}

/** The visitor's local time. Rendered only in the browser, so there is no hydration mismatch. */
export function WitchingClock() {
  const label = useSyncExternalStore(subscribe, snapshot, () => null);
  if (!label) return null;
  return (
    <p className="font-mono text-xs tracking-[0.2em] text-muted" aria-label={`Your local time: ${label}`}>
      {label}
    </p>
  );
}
