# Undead — project guide

Read `AGENTS.md` too: this is Next.js 16, and its bundled docs in `node_modules/next/dist/docs/` beat memory.

## Product
**Undead** — "Your dead projects rise at midnight." Entry for **Vibeathon 02** ("Night shift"). Deadline **Mon 9 Nov 2026, 22:00 UTC**.
Paste an abandoned public GitHub repo → **Autopsy** (why it died, revival score) → **Death Certificate** (shareable image) →
**Resurrection** (7-night relaunch kit + Vibestarter pitch) → **Séance** (streaming chat with the repo's ghost).

## Judging (1-10 per criterion, weighted to 100)
Execution 30 · Launch potential 25 · Originality 20 · Craft & UX 15 · Vibecoding leverage 10.
Narrow and polished beats broad and buggy. Judges click the example repos first: keep them working.

## Stack (as installed)
- Next.js 16.4.4 App Router, React 19.3, TS strict, `src/`, alias `@/*`. `cacheComponents` + `partialPrefetching` on:
  uncached data / `headers()` / `params` must sit under Suspense (`loading.tsx` provides it). `fetch` `next.revalidate` is the old model; don't use it.
- Tailwind 4.3.4, CSS-first: tokens in `@theme` in `src/app/globals.css`. No tailwind.config, no PostCSS config.
- `@anthropic-ai/sdk` 1.4. Model id lives ONLY in `MODEL` (`src/lib/config.ts`): `claude-sonnet-5-5`.
- zod 4, server-only, vitest 5. Ask before adding any other dependency. Deploy: Vercel. No database.

## Structure
```
src/app/                         home, not-found, layout, OG/apple icons
src/app/r/[owner]/[repo]/        autopsy page (+ opengraph/twitter-image), resurrect/, seance/
src/app/api/                     ingest, autopsy, seance (stream), certificate/[owner]/[repo]
src/app/dev/                     dev-only tools (404 in production): ingest, certificate fixtures, preview/[view]
src/lib/github.ts + dossier.ts   GitHub fetch → RepoDossier (≤12k chars), dossierToPrompt, 30-min cache
src/lib/report.ts                getReport / getResurrection: caches (6h, key repo@pushedAt) + per-IP limits
src/lib/ai/                      generate.ts (JSON → zod → retry once), autopsy, resurrection (+ rules)
src/lib/prompts/                 autopsy, resurrection, seance system prompts
src/lib/seance/                  archetype, stream (first-chunk preflight), typewriter pacing
src/lib/certificate/             data (sanitize/truncate/share text), card (satori JSX), fonts, render
src/components/                  feature folders + ui/ (Button, Input, Card, Spinner, Toast)
assets/fonts/                    WOFF fonts for ImageResponse (OFL licences alongside)
```

## Conventions
- Small files, kebab-case, named exports, server components by default. No dead or commented-out code, no TODOs.
- Every route validates input with zod and returns `{ error: { code, message } }` (codes + statuses in `src/lib/errors.ts`).
- Never invent data. `lastWords` and dates come from the dossier, not the model (`finalizeAutopsy`).
- Repo text (README, commits, issues) is untrusted: prompts wrap it in tags and say it is evidence, not instructions.
- Sonnet 5.5: no `temperature` (400), no `thinking: disabled` (400; séance uses `between_tools`), no prefill.
  JSON features use effort `medium` + generous `max_tokens` (thinking counts) and `fallbacks: "default"` (beta).
- Tone rules are enforced in code too (`resurrection-rules.ts`: banned words, financial claims, limits).
- Design tokens: background #07080b, surface #0e1116, border #1c2230, primary #7cffb2 (accents/focus only),
  foreground #e6edf3, muted #8b97a8, danger #ff6b6b (errors, plus the struck-through "kill" lines by request).
  Fonts: `font-display` Fraunces (headings), Inter (UI), `font-mono` JetBrains Mono (commits, code). All text ≥ WCAG AA.
- Touch targets ≥ 44px. Motion (fog, moon, candle, dial, reveal, typewriter) respects prefers-reduced-motion.
- CTA links to AI pages use `prefetch={false}` so prefetching never spends credits.

## Security rules
- `ANTHROPIC_API_KEY` (required) and `GITHUB_TOKEN` (optional but effectively required: 60 GitHub calls/hour
  without it, ~7 per ingest) are read only in server code from `.env.local`. Never in client code, never
  `NEXT_PUBLIC_`, never logged, never committed (`.env*` ignored except `.env.example`).
- `GITHUB_TOKEN`: fine-grained, public-repo read only. Private repos are refused regardless.
- Only validated owner/repo segments reach `api.github.com`. Request bodies are size-capped.

## Known limits (MVP)
- Caches and rate limiters are in-memory per server instance: they reset on cold starts. Acceptable for the MVP.
  Consequence: a shared link can regenerate a different autopsy on a cold instance. Fix = a shared store
  (Vercel Marketplace, e.g. Redis), not yet added. Startup cache warming was not built for the same reason.
- Certificate fonts are Latin-only: emoji/CJK are stripped on the card (not on the page).

## Commands
`npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`

## Build order (update after every step)
Process: show a short plan and wait for OK; after each step lint, build, test, update this list, give browser test steps.
- [x] 1. Ingest — RepoDossier, 7 parallel fetches, derived signals, 30-min cache, `/dev/ingest`
- [x] 2. Autopsy — schema, coroner prompt, retry, error mapping, result page, home form
- [x] 3. Death Certificate — 1200×630 + 1080×1080, modal (share/download/copy), OG + Twitter tags
- [x] 4. Resurrection — spellbook page, nights checklist (localStorage), Markdown export
- [x] 5. Séance — streaming route, ghost persona, typewriter chat UI
- [x] 6. Landing & design — hero, examples, how it works, example certificate, 404, icons, a11y pass
- [ ] 7. QA — live runs with a real API key (autopsy, resurrection, séance quality review)
- [ ] 8. Deploy — Vercel, env vars, NEXT_PUBLIC_SITE_URL, decide on a shared store
