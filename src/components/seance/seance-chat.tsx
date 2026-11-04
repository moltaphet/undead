"use client";

import Image from "next/image";
import Link from "next/link";
import { useSeance } from "@/hooks/use-seance";
import { useStickToBottom } from "@/hooks/use-stick-to-bottom";
import { useVisualViewportHeight } from "@/hooks/use-visual-viewport";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { ChatInput } from "./chat-input";
import { MessageBubble } from "./message-bubble";

const STARTERS = ["Why did you die?", "Do you blame me?", "Should I bring you back?"];

interface SeanceChatProps {
  owner: string;
  repo: string;
  fullName: string;
  avatarUrl: string;
}

export function SeanceChat({ owner, repo, fullName, avatarUrl }: SeanceChatProps) {
  useVisualViewportHeight();
  const s = useSeance(owner, repo);
  const streaming = s.status === "streaming";
  const last = s.messages[s.messages.length - 1];
  const { ref: scrollRef, onScroll } = useStickToBottom<HTMLDivElement>(last?.content);
  const waitingForFirstWord = streaming && last?.role === "assistant" && last.content === "";

  return (
    <div className="relative isolate mx-auto flex w-full max-w-3xl flex-col" style={{ height: "var(--vvh, 100dvh)" }}>
      <div className="candle-glow" aria-hidden="true" />

      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Image src={avatarUrl} alt="" width={40} height={40} className="size-10 rounded-full border border-border" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-semibold">{fullName}</h1>
          <p className="flex items-center gap-2 text-xs text-muted">
            <span aria-hidden="true" className="size-2 rounded-full bg-primary motion-safe:animate-pulse" />
            Séance in progress
          </p>
        </div>
        <Link
          href={`/r/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`}
          className="flex min-h-11 items-center rounded-lg px-3 text-sm text-muted transition hover:text-primary"
        >
          Leave the séance
        </Link>
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-busy={streaming}
        aria-label="Séance transcript"
        className="flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-6"
      >
        {s.messages.map((m, i) =>
          waitingForFirstWord && i === s.messages.length - 1 ? null : (
            <MessageBubble key={i} message={m} typing={streaming && i === s.messages.length - 1} />
          ),
        )}
        {waitingForFirstWord && (
          <p className="flex items-center gap-2 font-display text-lg text-muted italic">
            <Spinner className="size-4 text-primary" label="The ghost is gathering itself" />
            {s.messages.length <= 1 ? "Lighting the candles…" : "Something stirs…"}
          </p>
        )}
        {s.error && (
          <div role="alert" className="rounded-lg border border-danger/40 bg-surface p-4 text-sm">
            <p className="text-foreground">{s.error}</p>
            <Button variant="ghost" className="mt-3" onClick={s.messages.length ? s.retry : s.reset}>
              Try again
            </Button>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-border bg-background/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        {s.limitReached ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="font-display text-lg text-muted italic">The candles are burning low.</p>
            <Button variant="ghost" onClick={s.reset}>
              Light new candles
            </Button>
          </div>
        ) : (
          <>
            {!s.hasUserSpoken && !streaming && !s.error && (
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => s.send(q)}
                    className="min-h-11 rounded-full border border-border px-4 text-sm text-muted transition hover:border-primary/60 hover:text-primary"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <ChatInput streaming={streaming} disabled={s.limitReached} onSend={s.send} onStop={s.stop} />
          </>
        )}
      </div>
    </div>
  );
}
