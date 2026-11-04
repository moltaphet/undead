"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { SEANCE_LIMITS } from "@/lib/schemas";
import { Button } from "../ui/button";

interface ChatInputProps {
  streaming: boolean;
  disabled: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function ChatInput({ streaming, disabled, onSend, onStop }: ChatInputProps) {
  const [text, setText] = useState("");

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!text.trim() || streaming || disabled) return;
    onSend(text);
    setText("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <label htmlFor="seance-input" className="sr-only">
        Speak to the ghost
      </label>
      <textarea
        id="seance-input"
        rows={1}
        value={text}
        maxLength={SEANCE_LIMITS.userChars}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={streaming || disabled}
        placeholder={disabled ? "The candles have burned out." : "Speak to the ghost…"}
        className="field-sizing-content max-h-40 min-h-12 flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none disabled:opacity-60"
      />
      {streaming ? (
        <Button variant="ghost" size="lg" onClick={onStop}>
          Stop
        </Button>
      ) : (
        <Button type="submit" size="lg" disabled={disabled || !text.trim()}>
          Send
        </Button>
      )}
    </form>
  );
}
