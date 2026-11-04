import { cn } from "@/lib/cn";
import { STATUS_LABELS } from "@/lib/format";
import type { RepoStatus } from "@/lib/schemas";

const TONES: Record<RepoStatus, string> = {
  dead: "border-foreground/80 text-foreground",
  dormant: "border-muted text-muted",
  alive: "border-primary text-primary",
};

export function StatusStamp({ status, className }: { status: RepoStatus; className?: string }) {
  return (
    <p
      className={cn(
        "inline-block -rotate-6 select-none rounded-md border-4 border-double px-3 py-1",
        "font-mono text-base font-bold uppercase tracking-[0.3em] opacity-90 sm:text-lg",
        TONES[status],
        className,
      )}
    >
      <span className="sr-only">Status: </span>
      {STATUS_LABELS[status]}
    </p>
  );
}
