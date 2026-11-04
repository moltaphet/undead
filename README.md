# Undead

> Your dead projects rise at midnight.

Paste the URL of an abandoned public GitHub repo. Undead performs an AI autopsy, issues a shareable death certificate, writes a seven-night resurrection plan with a crowdfunding pitch, and lets you talk to the project's ghost. Built for Vibeathon 02 ("Night shift") with Claude.

## Setup

Requires Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` (server-side only, never commit it):

| Variable | Required | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | Powers the autopsy, resurrection and séance. |
| `GITHUB_TOKEN` | Strongly recommended | Without it GitHub allows 60 requests an hour, about 8 repos. Use a fine-grained token with read-only access to public repositories. |
| `NEXT_PUBLIC_SITE_URL` | In production | Public origin used in share links and social images, e.g. `https://undead.example.com`. |

```bash
npm run dev    # http://localhost:3000
```

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Dev-only tools (404 in production): `/dev/ingest` (inspect a dossier), `/dev/certificate?fixture=long&format=square` (certificate fixtures), `/dev/preview/autopsy|resurrect|seance` (layouts with fixture AI output).

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel (framework: Next.js, defaults are fine).
2. In Project Settings → Environment Variables, add `ANTHROPIC_API_KEY`, `GITHUB_TOKEN` and `NEXT_PUBLIC_SITE_URL` for Production (and Preview if you use it).
3. Deploy. Then open `/r/atom/atom`, share it, and check the card with X's or a link-preview debugger.

Caches and rate limits are in memory per server instance (see `CLAUDE.md`, "Known limits").

Project conventions and progress: `CLAUDE.md`.
