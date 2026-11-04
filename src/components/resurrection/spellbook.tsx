import Link from "next/link";
import type { Report } from "@/lib/report";
import { resurrectionToMarkdown } from "@/lib/resurrection-markdown";
import type { Resurrection } from "@/lib/schemas";
import { CopyButton } from "../copy-button";
import { buttonClasses } from "../ui/button";
import { Chapter, Field } from "./chapter";
import { ExportBar } from "./export-bar";
import { NightsTimeline } from "./nights-timeline";
import { SpellbookNav, type NavItem } from "./spellbook-nav";
import { TheCut } from "./the-cut";

const NAV: NavItem[] = [
  { id: "positioning", label: "Positioning" },
  { id: "cut", label: "The Cut" },
  { id: "nights", label: "7 Nights" },
  { id: "landing", label: "Landing Copy" },
  { id: "launch", label: "Launch" },
  { id: "pitch", label: "Crowdfund Pitch" },
  { id: "prompt", label: "Rebuild Prompt" },
];

const lines = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

export function Spellbook({ report, plan }: { report: Report; plan: Resurrection }) {
  const { repo } = report.dossier;
  const autopsyHref = `/r/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
  const p = plan.newPositioning;
  const l = plan.landingCopy;
  const c = plan.crowdfundingPitch;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Link href={autopsyHref} className="inline-flex min-h-11 w-fit items-center text-sm text-muted hover:text-primary">
          ← Back to the autopsy
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Resurrection plan</p>
        <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">{repo.fullName}</h1>
        <p className="max-w-2xl text-muted">
          A relaunch kit built from the autopsy: what to keep, what to kill, and seven nights to bring it back.
        </p>
        <ExportBar markdown={resurrectionToMarkdown(repo.fullName, plan)} fileName={repo.name} />
      </header>

      {plan.honestNote && (
        <aside className="rounded-lg border border-primary/40 bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">An honest note first</p>
          <p className="mt-2 leading-relaxed text-foreground">{plan.honestNote}</p>
        </aside>
      )}

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[13rem_1fr] lg:gap-12">
        <div className="lg:relative">
          <SpellbookNav items={NAV} />
        </div>
        <div className="flex min-w-0 flex-col gap-12">
          <Chapter id="positioning" title="Positioning" copy={`${p.oneLiner}\n\nTarget user: ${p.targetUser}\nPain point: ${p.painPoint}\nWhy now: ${p.whyNow}`}>
            <p className="mb-5 font-display text-2xl leading-snug text-foreground sm:text-3xl">{p.oneLiner}</p>
            <div className="flex flex-col gap-3">
              <Field label="Target user" text={p.targetUser} />
              <Field label="Pain point" text={p.painPoint} />
              <Field label="Why now" text={p.whyNow} />
            </div>
          </Chapter>

          <Chapter id="cut" title="The Cut" copy={`Keep:\n${lines(plan.mvpCut.keep)}\n\nKill:\n${lines(plan.mvpCut.kill)}\n\nBuild:\n${lines(plan.mvpCut.build)}`}>
            <TheCut cut={plan.mvpCut} />
          </Chapter>

          <Chapter id="nights" title="7 Nights" copy={plan.sevenDayPlan.map((d) => `Night ${d.day}: ${d.title}\n${lines(d.tasks)}`).join("\n\n")}>
            <NightsTimeline plan={plan.sevenDayPlan} storageKey={`undead:nights:${repo.fullName.toLowerCase()}`} />
          </Chapter>

          <Chapter id="landing" title="Landing Copy" copy={`${l.headline}\n\n${l.subheadline}\n\n${lines(l.bullets)}\n\n[${l.cta}]`}>
            <div className="rounded-xl border border-border bg-background/70 p-6 text-center sm:p-10">
              <p className="font-display text-3xl leading-tight font-semibold text-balance">{l.headline}</p>
              <p className="mx-auto mt-3 max-w-xl text-muted">{l.subheadline}</p>
              <ul className="mx-auto mt-6 flex max-w-xl flex-col gap-2 text-left text-sm">
                {l.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden="true" className="text-primary">✦</span>
                    {b}
                  </li>
                ))}
              </ul>
              <span className={buttonClasses("primary", "lg", "pointer-events-none mt-6")} aria-hidden="true">
                {l.cta}
              </span>
            </div>
          </Chapter>

          <Chapter id="launch" title="Launch">
            <div className="flex flex-col gap-3">
              <Field label="Post for X" text={plan.launchPosts.x} />
              <div className="rounded-lg border border-border bg-surface/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Where to find the first users</p>
                  <CopyButton text={lines(plan.launchPosts.firstUsersWhere)} label="first-user channels" />
                </div>
                <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5 leading-relaxed">
                  {plan.launchPosts.firstUsersWhere.map((w) => <li key={w}>{w}</li>)}
                </ol>
              </div>
            </div>
          </Chapter>

          <Chapter
            id="pitch"
            title="Crowdfund Pitch"
            copy={`${c.title}\n\n${c.story}\n\nWhat the funding is for:\n${lines(c.fundingUse)}\n\nBacker reward: ${c.backerReward}`}
          >
            <article className="rounded-lg border border-border bg-surface/60 p-5 sm:p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Draft for a Vibestarter campaign</p>
              <h3 className="mt-2 font-display text-2xl font-semibold">{c.title}</h3>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-foreground">{c.story}</p>
              <h4 className="mt-5 text-sm font-medium text-foreground">What the funding is for</h4>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-muted">
                {c.fundingUse.map((f) => <li key={f}>{f}</li>)}
              </ul>
              <p className="mt-4 text-sm">
                <span className="font-medium text-foreground">Backer reward:</span> <span className="text-muted">{c.backerReward}</span>
              </p>
            </article>
          </Chapter>

          <Chapter id="prompt" title="Rebuild Prompt">
            <p className="mb-3 text-sm text-muted">Paste this into your AI coding tool to rebuild the MVP cut from scratch.</p>
            <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-background p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {plan.aiBuildPrompt}
            </pre>
            <CopyButton text={plan.aiBuildPrompt} label="prompt" prominent className="mt-4 w-full sm:w-auto" />
          </Chapter>

          <aside className="rounded-xl border border-primary/40 bg-surface p-6 text-center sm:p-8">
            <p className="font-display text-2xl font-semibold">Ready to raise?</p>
            <p className="mx-auto mt-2 max-w-md text-muted">Take the pitch above, tune it, and launch it on Vibestarter.</p>
            <a href="https://app.vibestarter.xyz" target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "lg", "mt-5")}>
              Launch it on Vibestarter
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
