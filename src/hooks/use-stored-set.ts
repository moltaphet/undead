"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const EVENT = "undead:storage";

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function parse(raw: string): Set<string> {
  try {
    const v: unknown = JSON.parse(raw);
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

/** A string set persisted in localStorage. Storage failures (private mode, blocked) degrade to in-memory-less no-ops. */
export function useStoredSet(key: string): [Set<string>, (item: string) => void] {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => "[]");
  const set = useMemo(() => parse(raw), [raw]);

  const toggle = useCallback(
    (item: string) => {
      const next = parse(read(key));
      if (next.has(item)) next.delete(item);
      else next.add(item);
      try {
        window.localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        return;
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  return [set, toggle];
}
