import "server-only";
import { cache } from "react";
import { runAutopsy } from "./ai/autopsy";
import { runResurrection } from "./ai/resurrection";
import { TtlCache } from "./cache";
import { getDossier } from "./dossier";
import { AppError, toAppError, type ErrorCode } from "./errors";
import { SlidingWindowLimiter } from "./rate-limit";
import { INVALID_URL_MESSAGE, isValidOwner, isValidRepo, repoKey, type RepoRef } from "./repo-url";
import type { Autopsy, RepoDossier, Resurrection } from "./schemas";

const HOUR = 3_600_000;
const autopsyCache = new TtlCache<Autopsy>(6 * HOUR, 200);
const autopsyLimiter = new SlidingWindowLimiter(10, 10 * 60_000);
const resurrectionCache = new TtlCache<Resurrection>(6 * HOUR, 200);
const resurrectionLimiter = new SlidingWindowLimiter(5, 10 * 60_000);

export interface Report {
  dossier: RepoDossier;
  autopsy: Autopsy;
}

type Failure = { ok: false; error: { code: ErrorCode; message: string } };

export type ReportResult = { ok: true; report: Report } | Failure;
export type ResurrectionResult = { ok: true; report: Report; resurrection: Resurrection } | Failure;

function failure(err: unknown): Failure {
  const e = toAppError(err);
  return { ok: false, error: { code: e.code, message: e.message } };
}

export function parseRefParams(owner: string, repo: string): RepoRef {
  const ref = { owner: decodeURIComponent(owner), repo: decodeURIComponent(repo) };
  if (!isValidOwner(ref.owner) || !isValidRepo(ref.repo)) throw new AppError("INVALID_URL", INVALID_URL_MESSAGE);
  return ref;
}

/**
 * Dossier + autopsy for a repo. Autopsies are cached 6h per instance, keyed by repo and last push.
 * Only cache misses count against the per-IP limit (10 per 10 minutes).
 */
export async function getReport(ref: RepoRef, ip: string): Promise<Report> {
  const dossier = await getDossier(ref);
  const key = `${repoKey(ref)}@${dossier.repo.pushedAt}`;
  const autopsy = await autopsyCache.getOrLoad(key, async () => {
    autopsyLimiter.enforce(ip, "autopsies");
    return { value: await runAutopsy(dossier), cache: true };
  });
  return { dossier, autopsy };
}

/** Request-deduped, never-throwing variant for pages and metadata. */
export const loadReport = cache(async (owner: string, repo: string, ip: string): Promise<ReportResult> => {
  try {
    return { ok: true, report: await getReport(parseRefParams(owner, repo), ip) };
  } catch (err) {
    return failure(err);
  }
});

/** Resurrection plan, generated on demand and cached 6h. Misses count against 5 per 10 minutes per IP. */
export async function getResurrection(ref: RepoRef, ip: string): Promise<{ report: Report; resurrection: Resurrection }> {
  const report = await getReport(ref, ip);
  const key = `${repoKey(ref)}@${report.dossier.repo.pushedAt}`;
  const resurrection = await resurrectionCache.getOrLoad(key, async () => {
    resurrectionLimiter.enforce(ip, "resurrections");
    return { value: await runResurrection(report.dossier, report.autopsy), cache: true };
  });
  return { report, resurrection };
}

export const loadResurrection = cache(async (owner: string, repo: string, ip: string): Promise<ResurrectionResult> => {
  try {
    return { ok: true, ...(await getResurrection(parseRefParams(owner, repo), ip)) };
  } catch (err) {
    return failure(err);
  }
});
