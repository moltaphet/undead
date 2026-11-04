import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">404</p>
      <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
        This page is truly dead. Not even we can bring it back.
      </h1>
      <Link href="/" className={buttonClasses("primary", "lg", "mt-4")}>
        Back to the graveyard
      </Link>
    </main>
  );
}
