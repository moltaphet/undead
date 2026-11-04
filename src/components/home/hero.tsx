import Link from "next/link";
import { EXAMPLE_REPOS } from "@/lib/examples";
import { RepoForm } from "../repo-form";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="flex min-h-[min(85dvh,52rem)] flex-col items-center justify-center gap-7 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Vibeathon 02 · Night shift</p>
      <h1 id="hero-title" className="max-w-4xl font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-7xl">
        Your dead projects rise at midnight.
      </h1>
      <p className="max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
        Paste an abandoned GitHub repo. Get an autopsy, a death certificate, and a plan to bring it back.
      </p>
      <RepoForm className="mt-2 max-w-2xl" />
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted">Or dig up a famous corpse:</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {EXAMPLE_REPOS.map((e) => (
            <li key={e.label}>
              <Link
                href={`/r/${e.owner}/${e.repo}`}
                prefetch={false}
                title={e.hint}
                className="flex min-h-11 items-center rounded-full border border-border bg-surface/50 px-4 font-mono text-sm text-foreground transition hover:border-primary/60 hover:text-primary active:bg-surface"
              >
                {e.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
