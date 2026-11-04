"use client";

import { useState } from "react";
import { copyText } from "@/hooks/use-toast";
import { cn } from "@/lib/cn";

export function CopyButton({ text, label, className, prominent = false }: { text: string; label: string; className?: string; prominent?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    setState((await copyText(text)) ? "copied" : "failed");
    setTimeout(() => setState("idle"), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={state === "idle" ? `Copy ${label}` : undefined}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border px-3 text-sm transition",
        prominent
          ? "border-primary bg-primary px-5 font-medium text-background hover:shadow-ecto hover:brightness-110"
          : "border-border text-muted hover:border-primary/60 hover:text-primary",
        className,
      )}
    >
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : prominent ? `Copy ${label}` : "Copy"}</span>
    </button>
  );
}
