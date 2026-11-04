import Link from "next/link";
import type { ErrorCode } from "@/lib/errors";
import { RepoForm } from "./repo-form";

const TITLES: Partial<Record<ErrorCode, string>> = {
  INVALID_URL: "That isn't a grave we know how to find.",
  NOT_FOUND_OR_PRIVATE: "No body found.",
  RATE_LIMITED: "The morgue needs a breather.",
  GITHUB_UNAVAILABLE: "GitHub isn't answering the door.",
  TIMEOUT: "GitHub isn't answering the door.",
  AI_BUSY: "The coroner is with another patient.",
  AI_CONFIG: "The coroner stepped out.",
  AI_BAD_OUTPUT: "The paperwork came back smudged.",
};

export function ResultError({ code, message }: { code: ErrorCode; message: string }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-16 text-center" aria-labelledby="error-title">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-danger">Case closed early · {code.replaceAll("_", " ").toLowerCase()}</p>
      <h1 id="error-title" className="font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        {TITLES[code] ?? "Something went bump in the night."}
      </h1>
      <p className="text-muted">{message}</p>
      <div className="mt-6 w-full">
        <p className="mb-3 text-sm text-muted">Try another repo:</p>
        <RepoForm />
      </div>
      <Link href="/" className="mt-2 inline-flex min-h-11 items-center text-sm text-muted underline underline-offset-4 hover:text-primary">
        Back to the graveyard
      </Link>
    </section>
  );
}
