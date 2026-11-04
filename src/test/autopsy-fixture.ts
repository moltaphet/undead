import type { Autopsy } from "@/lib/schemas";

export function modelAutopsy(over: Partial<Omit<Autopsy, "lastWords">> = {}): Omit<Autopsy, "lastWords"> {
  return {
    causeOfDeath: { headline: "Promised dark mode, delivered silence", explanation: "It shipped fast, then stopped." },
    timeOfDeath: { date: "2021-06-01", note: "The last commit that changed behavior." },
    diagnosis: [
      { factor: "no_distribution", severity: 3, evidence: "42 stars, no homepage." },
      { factor: "lost_interest", severity: 5, evidence: "Five years of silence after 'feat: dark mode (almost)'." },
    ],
    worthSaving: ["The CLI parser", "The niche of solo devs"],
    marketToday: { verdict: "same", reasoning: "The problem still exists." },
    revivalScore: 48,
    revivalScoreReason: "The idea holds; the execution needs a restart.",
    epitaph: "Here lies r: almost had dark mode.",
    ...over,
  };
}
