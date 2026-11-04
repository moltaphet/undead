"use client";

import { useCallback, useEffect, useRef } from "react";

/** Keeps a scroll container pinned to the bottom until the user scrolls up (more than ~48px). */
export function useStickToBottom<T extends HTMLElement>(dependency: unknown) {
  const ref = useRef<T>(null);
  const stuck = useRef(true);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (el) stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (el && stuck.current) el.scrollTop = el.scrollHeight;
  }, [dependency]);

  return { ref, onScroll };
}
