"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { INVALID_URL_MESSAGE, tryParseRepoUrl } from "@/lib/repo-url";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface RepoFormProps {
  className?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}

export function RepoForm({ className, submitLabel = "Exhume", autoFocus = false }: RepoFormProps) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    const ref = tryParseRepoUrl(value);
    if (!ref) {
      setError(INVALID_URL_MESSAGE);
      return;
    }
    setError(null);
    startTransition(() => router.push(`/r/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`));
  }

  return (
    <form onSubmit={submit} noValidate className={cn("flex w-full flex-col gap-2", className)}>
      <label htmlFor={inputId} className="sr-only">
        GitHub repository URL
      </label>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Input
          id={inputId}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="github.com/you/that-project-you-abandoned"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus={autoFocus}
          invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="sm:h-14 sm:text-lg"
        />
        <Button type="submit" size="lg" loading={pending} className="sm:h-14 sm:px-8">
          {pending ? "Exhuming…" : submitLabel}
        </Button>
      </div>
      <p id={errorId} role="alert" className="min-h-5 text-left text-sm text-danger">
        {error}
      </p>
    </form>
  );
}
