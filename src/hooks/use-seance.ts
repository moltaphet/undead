"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SEANCE_LIMITS, type SeanceMessage } from "@/lib/schemas";
import { nextReveal } from "@/lib/seance/typewriter";

export type SeanceStatus = "idle" | "streaming" | "error";

const LIMIT = SEANCE_LIMITS.maxMessages;

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return body?.error?.message ?? "The spirits are silent. Try again.";
}

/** Conversation state lives in memory only. The ghost always speaks first. */
export function useSeance(owner: string, repo: string) {
  const [messages, setMessages] = useState<SeanceMessage[]>([{ role: "assistant", content: "" }]);
  const [status, setStatus] = useState<SeanceStatus>("streaming");
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const runId = useRef(0);

  const run = useCallback(
    async (history: SeanceMessage[]) => {
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      const id = ++runId.current;
      const live = () => runId.current === id;

      let received = "";
      let revealed = 0;
      let done = false;
      let last = performance.now();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const reveal = new Promise<void>((resolve) => {
        const tick = (t: number) => {
          if (!live() || ctrl.signal.aborted) return resolve();
          revealed = nextReveal(revealed, received.length, t - last, reduce);
          last = t;
          const text = received.slice(0, revealed);
          setMessages([...history, { role: "assistant", content: text }]);
          if (done && revealed >= received.length) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      let failure: string | null = null;
      try {
        const res = await fetch("/api/seance", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ owner, repo, messages: history }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) throw new Error(await readError(res));
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          received += decoder.decode(chunk.value, { stream: true });
        }
      } catch (err) {
        if (!ctrl.signal.aborted) failure = (err as Error).message;
      }
      done = true;
      if (failure) ctrl.abort();
      await reveal;
      if (!live()) return;

      if (failure) {
        setMessages(history);
        setError(failure);
        setStatus("error");
        return;
      }
      const kept = received.slice(0, revealed).trim();
      setMessages(kept ? [...history, { role: "assistant", content: kept }] : history);
      setStatus("idle");
    },
    [owner, repo],
  );

  /** Callers show the pending state; `run` only updates state asynchronously. */
  const begin = useCallback(
    (history: SeanceMessage[]) => {
      setError(null);
      setStatus("streaming");
      setMessages([...history, { role: "assistant", content: "" }]);
      void run(history);
    },
    [run],
  );

  useEffect(() => {
    void run([]);
    return () => controller.current?.abort();
  }, [run]);

  const send = useCallback(
    (text: string) => {
      const content = text.trim().slice(0, SEANCE_LIMITS.userChars);
      if (!content || status === "streaming" || messages.length >= LIMIT - 1) return;
      begin([...messages, { role: "user", content }]);
    },
    [begin, messages, status],
  );

  const stop = useCallback(() => controller.current?.abort(), []);
  const retry = useCallback(() => begin(messages), [begin, messages]);
  const reset = useCallback(() => begin([]), [begin]);

  return {
    messages,
    status,
    error,
    send,
    stop,
    reset,
    retry,
    limitReached: messages.length >= LIMIT - 1 && status !== "streaming",
    hasUserSpoken: messages.some((m) => m.role === "user"),
  };
}
