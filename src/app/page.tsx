import { ExampleCertificate } from "@/components/home/example-certificate";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { SiteFooter } from "@/components/home/site-footer";
import { WitchingClock } from "@/components/home/witching-clock";
import { Reveal } from "@/components/reveal";

export default function Home() {
  return (
    <>
      <div className="mx-auto flex w-full max-w-[1100px] justify-end px-4 pt-5 sm:px-6">
        <WitchingClock />
      </div>
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 sm:px-6">
        <Hero />
        <Reveal>
          <HowItWorks />
        </Reveal>
        <Reveal>
          <ExampleCertificate />
        </Reveal>
        <Reveal>
          <section aria-labelledby="why-title" className="mx-auto max-w-2xl py-16 text-center">
            <h2 id="why-title" className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
              Why this exists
            </h2>
            <p className="mt-6 font-display text-2xl leading-snug text-balance text-foreground sm:text-3xl">
              Every builder has a graveyard. Most of those projects didn&apos;t die because the idea was bad. They died at
              3am, one unfinished commit at a time.
            </p>
            <p className="mt-4 font-display text-2xl text-primary italic sm:text-3xl">Undead gives them a second shift.</p>
          </section>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
