import type { DiagnosisFactor, MarketVerdict, RepoStatus } from "./schemas";

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Unknown" : DATE_FMT.format(d);
}

export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: n >= 10_000 ? "compact" : "standard" }).format(n);
}

/** Stable, short case number from the repo name (FNV-1a). */
export function caseNumber(fullName: string): string {
  let h = 0x811c9dc5;
  for (const ch of fullName.toLowerCase()) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, "0").slice(0, 6);
}

export const FACTOR_LABELS: Record<DiagnosisFactor, string> = {
  scope_creep: "Scope creep",
  no_users: "No users",
  no_distribution: "No distribution",
  tech_debt: "Tech debt",
  lost_interest: "Lost interest",
  outcompeted: "Outcompeted",
  unclear_value: "Unclear value",
  platform_shift: "Platform shift",
  solo_burnout: "Solo burnout",
  never_finished: "Never finished",
};

export const VERDICT_LABELS: Record<MarketVerdict, string> = {
  stronger: "Demand is stronger",
  same: "Demand is unchanged",
  weaker: "Demand is weaker",
  gone: "The market is gone",
};

export const STATUS_LABELS: Record<RepoStatus, string> = {
  dead: "Dead",
  dormant: "Dormant",
  alive: "Alive?!",
};
