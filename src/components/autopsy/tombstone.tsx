export function Tombstone({ epitaph, born, died }: { epitaph: string; born: string; died: string }) {
  return (
    <figure className="mx-auto flex w-full max-w-sm flex-col items-center rounded-t-[999px] border border-border bg-linear-to-b from-surface to-background px-8 pt-14 pb-10 text-center shadow-[inset_0_2px_24px_rgb(0_0_0/0.5)]">
      <p aria-hidden="true" className="font-display text-sm tracking-[0.4em] text-muted">
        R.I.P.
      </p>
      <blockquote className="mt-4 font-display text-xl leading-snug italic text-foreground sm:text-2xl">{epitaph}</blockquote>
      <figcaption className="mt-5 font-mono text-xs tracking-[0.2em] text-muted">
        {born} – {died}
      </figcaption>
    </figure>
  );
}
