## Tech Stack

- Frontend: Next.js 16.2.4 (App Router, React Server Components)
- Styling: Tailwind CSS v4 (`@tailwindcss/postcss` plugin, `@theme {}` tokens)
- Fonts: Geist + Geist Mono via `next/font/google`
- AI: Google Gemini 2.5 Flash via `@google/generative-ai` 0.24.1
- Color Science: `chroma-js` 3.2.0 (ΔE 2000 validation, HSL/LAB conversions)
- External API: Wikipedia REST API v1 (`/page/summary/{title}` — thumbnail fetch, no key required)
- Deployment: Netlify + `@netlify/plugin-nextjs`

## Key Files

- `app/layout.tsx` — Root layout. Loads Geist (400/500/600/700) and Geist Mono (400/500) via `next/font/google`. Sets CSS variables `--font-geist-sans` and `--font-geist-mono`. Metadata: "Color Match".
- `app/globals.css` — `@import "tailwindcss"` entry point. Full `@theme {}` brand token block (11 color tokens, font vars). Utility classes: `.mono`, `.label`, `.checker`, `.field`, `.pill`, `.swatch-tile`, `.btn-primary`, `.btn-secondary`. Ink-3 = `#6B6557` (WCAG AA corrected).
- `app/page.tsx` — Main page (single-page app, `'use client'`). Holds all UI state and component composition. Currently: empty state with `previewColor` hover state.
- `postcss.config.mjs` — PostCSS config: `@tailwindcss/postcss` plugin only (no autoprefixer or postcss-import needed in v4).
- `next.config.ts` — Next.js config (default, no custom settings yet).
- `.env.local` — `GEMINI_API_KEY` (server-only; never `NEXT_PUBLIC_`; gitignored).
- `package.json` — Dependencies: `next`, `react`, `react-dom`, `@google/generative-ai`, `chroma-js`. DevDeps: `tailwindcss`, `@tailwindcss/postcss`, `@types/chroma-js`, TypeScript, ESLint.

## Data Model

Stateless per request — no database, no auth, no session history.

| Input | Type | Description |
|---|---|---|
| `pickedColor` | `string \| null` | User-selected hex (e.g. `#7AB58C`). Committed on sheet close. |
| `previewColor` | `string \| null` | Transient hover preview from swatch tiles. Reverts on mouse leave. |

**API request/response shape:**

```
POST /api/match
  body: { hex: string }

Response (success):
  {
    botanical: {
      commonName, scientificName, family,
      description, funFact,
      dominantHex, deltaE, wikiTitle,
      imageUrl
    },
    zoological: { ...same shape }
  }

Response (error):
  { error: "MATCH_FAILED" | "API_ERROR" | "INVALID_HEX" }
```
