import type { RepoStatus } from "./schemas";

const DAY_MS = 86_400_000;

export function daysBetween(fromIso: string, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - new Date(fromIso).getTime()) / DAY_MS));
}

/** alive: pushed within 60 days; dormant: 61-365; dead: over 365. Archived repos are always dead. */
export function repoStatus(daysSinceLastPush: number, archived: boolean): RepoStatus {
  if (archived || daysSinceLastPush > 365) return "dead";
  if (daysSinceLastPush > 60) return "dormant";
  return "alive";
}

export interface CommitCadence {
  perWeek: number;
  sampleSize: number;
  firstCommitDate: string | null;
  lastCommitDate: string | null;
}

/** Commits per week across the date span of the fetched sample (span floored at 1 day). */
export function commitCadence(dates: string[]): CommitCadence {
  const times = dates.map((d) => new Date(d).getTime()).filter(Number.isFinite).sort((a, b) => a - b);
  if (times.length === 0) {
    return { perWeek: 0, sampleSize: 0, firstCommitDate: null, lastCommitDate: null };
  }
  const first = times[0];
  const last = times[times.length - 1];
  const spanDays = Math.max(1, (last - first) / DAY_MS);
  return {
    perWeek: Math.round((times.length / spanDays) * 7 * 10) / 10,
    sampleSize: times.length,
    firstCommitDate: new Date(first).toISOString(),
    lastCommitDate: new Date(last).toISOString(),
  };
}

const TEST_RE = /(^|[^a-z])(tests?|__tests__|jest|vitest|playwright|cypress)([^a-z]|$)/i;

/** True if a root entry or dependency name looks like a test setup. Word-ish boundaries avoid "contest"/"latest". */
export function hasTests(names: string[]): boolean {
  return names.some((n) => TEST_RE.test(n));
}
