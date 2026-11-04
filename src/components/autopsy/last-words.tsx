import { formatDate } from "@/lib/format";
import type { RepoDossier } from "@/lib/schemas";
import { SectionLabel } from "../section-label";

export function LastWords({ dossier }: { dossier: RepoDossier }) {
  const last = dossier.commits?.[0];
  return (
    <section aria-labelledby="last-words">
      <SectionLabel id="last-words">Last words</SectionLabel>
      {last ? (
        <figure className="mt-3 rounded-lg border border-border bg-background/60 p-5">
          <blockquote className="font-mono text-base break-words text-foreground sm:text-lg">“{last.message}”</blockquote>
          <figcaption className="mt-3 text-sm text-muted">
            Committed {formatDate(last.date)}
            {last.author && <> by {last.author}</>} ·{" "}
            <a
              href={`${dossier.repo.url}/commit/${last.sha}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-mono underline decoration-border underline-offset-4 hover:text-primary hover:decoration-primary"
            >
              {last.sha}
            </a>
          </figcaption>
        </figure>
      ) : (
        <p className="mt-3 text-muted">No last words. It never committed to anything.</p>
      )}
    </section>
  );
}
