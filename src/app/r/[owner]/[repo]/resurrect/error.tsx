"use client";

import { RepoForm } from "@/components/repo-form";
import { Button } from "@/components/ui/button";

export default function ResultErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Something went bump in the night.</h1>
      <p className="text-muted">The case file didn&apos;t open. It&apos;s probably us, not your repo.</p>
      <Button onClick={reset} variant="ghost">
        Try again
      </Button>
      <div className="mt-6 w-full">
        <p className="mb-3 text-sm text-muted">Or try another repo:</p>
        <RepoForm />
      </div>
    </main>
  );
}
