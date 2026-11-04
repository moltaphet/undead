import Image from "next/image";
import Link from "next/link";
import { EXAMPLE_REPOS } from "@/lib/examples";

export function ExampleCertificate() {
  const e = EXAMPLE_REPOS[0];
  return (
    <section aria-labelledby="example-title" className="flex flex-col items-center gap-8 py-16 text-center">
      <div>
        <h2 id="example-title" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Every autopsy comes with paperwork.
        </h2>
        <p className="mt-3 text-muted">A shareable death certificate, made for posting.</p>
      </div>
      <Link
        href={`/r/${e.owner}/${e.repo}`}
        prefetch={false}
        className="group block w-full max-w-3xl -rotate-2 transition duration-500 hover:rotate-0 motion-reduce:rotate-0 motion-reduce:transition-none"
      >
        <Image
          src={`/api/certificate/${e.owner}/${e.repo}?format=landscape`}
          alt={`Death certificate for ${e.label}`}
          width={1200}
          height={630}
          unoptimized
          loading="lazy"
          className="h-auto w-full rounded-lg border border-border shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8),0_0_60px_-30px_rgb(124_255_178/0.35)]"
        />
        <span className="mt-4 inline-block text-sm text-muted group-hover:text-primary">Open the {e.label} case file →</span>
      </Link>
    </section>
  );
}
