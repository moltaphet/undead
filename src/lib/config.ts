/** The single place the model id lives. */
export const MODEL = "claude-sonnet-5-5";

const MINUTE = 60_000;

export const LIMITS = {
  github: {
    timeoutMs: 8_000,
    readmeMaxChars: 6_000,
    commitCount: 30,
    commitSubjectMaxChars: 140,
    treeMaxEntries: 60,
    packageNamesMax: 40,
    issueCount: 10,
    languagesTop: 5,
    packageJsonMaxBytes: 200_000,
  },
  dossier: { maxChars: 12_000, cacheTtlMs: 30 * MINUTE, cacheMax: 200 },
  ingest: { maxBodyBytes: 2_048 },
} as const;

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = explicit || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}

/** Public origin of the app. Set NEXT_PUBLIC_SITE_URL to override; Vercel's production host is used otherwise. */
export const SITE_URL = resolveSiteUrl();
