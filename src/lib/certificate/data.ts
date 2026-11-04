import { formatCount, formatDate } from "../format";
import type { Autopsy, RepoDossier, RepoStatus } from "../schemas";

export type CertificateFormat = "landscape" | "square";

export const CERTIFICATE_SIZES: Record<CertificateFormat, { width: number; height: number }> = {
  landscape: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
};

export interface CertificateData {
  deceased: string;
  born: string;
  died: string;
  ageAtDeath: string;
  cause: string;
  lastWords: string | null;
  survivedBy: string;
  score: number;
  epitaph: string;
  domain: string;
  status: RepoStatus;
}

/** Characters our bundled Latin fonts can draw (Fontsource "latin" subset). Everything else is dropped. */
function drawable(cp: number): boolean {
  return (
    (cp >= 0x20 && cp <= 0x7e) ||
    (cp >= 0xa0 && cp <= 0xff) ||
    cp === 0x131 || cp === 0x152 || cp === 0x153 ||
    (cp >= 0x2000 && cp <= 0x206f) ||
    cp === 0x20ac || cp === 0x2122
  );
}

/** Normalizes text so the card never shows missing-glyph boxes. */
export function sanitize(text: string): string {
  return Array.from(text.normalize("NFKC"))
    .filter((ch) => drawable(ch.codePointAt(0) ?? 0))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space >= max * 0.5 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export function clean(text: string, max: number): string {
  return truncate(sanitize(text), max);
}

/** "2 years, 3 months" between two dates (UTC calendar months). */
export function formatAge(fromIso: string, toIso: string): string {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  if (!Number.isFinite(months) || months < 1) return "Under a month";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (rest) parts.push(`${rest} month${rest === 1 ? "" : "s"}`);
  return parts.join(", ");
}

export function toCertificateData(dossier: RepoDossier, autopsy: Autopsy, siteUrl: string): CertificateData {
  const r = dossier.repo;
  const alive = dossier.signals.status === "alive";
  const end = alive ? new Date().toISOString() : autopsy.timeOfDeath.date;
  return {
    deceased: clean(r.fullName, 60),
    born: formatDate(r.createdAt),
    died: alive ? "Not yet" : formatDate(autopsy.timeOfDeath.date),
    ageAtDeath: formatAge(r.createdAt, end),
    cause: clean(autopsy.causeOfDeath.headline, 110),
    lastWords: autopsy.lastWords ? clean(autopsy.lastWords, 90) || null : null,
    survivedBy: `${formatCount(r.stars)} star${r.stars === 1 ? "" : "s"}, ${formatCount(r.forks)} fork${r.forks === 1 ? "" : "s"}`,
    score: autopsy.revivalScore,
    epitaph: clean(autopsy.epitaph, 70),
    domain: new URL(siteUrl).host,
    status: dossier.signals.status,
  };
}

const SHARE_LIMIT = 260;

/** Prefilled X post text, always at most 260 characters including the URL. */
export function buildShareText(repoName: string, headline: string, score: number, url: string, status: RepoStatus): string {
  const opening = status === "alive" ? `My project ${repoName} went in for an autopsy and came out breathing.` : `My project ${repoName} has been declared dead.`;
  const compose = (cause: string) =>
    `${opening} Cause of death: ${cause} 🪦 Revival odds: ${score}%. Get your autopsy: ${url}`;
  const room = SHARE_LIMIT - compose("").length;
  if (room >= headline.length) return compose(headline);
  if (room >= 12) return compose(truncate(headline, room));
  return truncate(`${opening} Revival odds: ${score}%. ${url}`, SHARE_LIMIT);
}

export function xIntentUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}
