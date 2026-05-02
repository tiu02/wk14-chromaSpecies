## Tech Stack

- Frontend: Next.js 16.2.4 (App Router, React Server Components)
- Styling: Tailwind CSS v4 (`@tailwindcss/postcss` plugin, `@theme {}` tokens)
- Fonts: Geist + Geist Mono via `next/font/google`
- AI: Google Gemini 2.5 Flash via `@google/generative-ai` 0.24.1
- Color Science: `chroma-js` 3.2.0 (ΔE 2000 validation, HSL/LAB conversions)
- External API: Wikipedia REST API v1 (`/page/summary/{title}` — thumbnail fetch, no key required)
- Deployment: Netlify + `@netlify/plugin-nextjs`

## Key Files

- `app/layout.tsx` — Root layout. Loads Geist (400/500/600/700) and Geist Mono (400/500) via `next/font/google`. Sets CSS variables `--font-geist-sans` and `--font-geist-mono` on the `<html>` element. Body is `min-h-full flex flex-col`. Metadata: title "Color Match", description "Pick a color. Find the matching botanical and zoological specimens."
- `app/globals.css` — `@import "tailwindcss"` entry point. Full `@theme {}` brand token block: 11 color tokens (canvas, canvas-2, surface, surface-2, ink, ink-2, ink-3, ink-4, rule, rule-2, field); ink-3 = `#6B6557` (WCAG AA corrected — `#807A6E` fails). Font vars wired from layout CSS variables. `body` background set to `--color-canvas` (#FAF7F2). Utility classes: `.mono` (Geist Mono, tnum), `.label` (10px uppercase mono, ink-3), `.checker` (checkerboard pattern for empty swatch), `.ring-dim` (inset shadow border), `.field` (input background), `.pill` (badge), `.swatch-tile` (preset color tile with hover lift), `.btn-primary` / `.btn-secondary`, `.swatch-trigger`, `.pick-cta`. Hover transforms guarded with `@media (hover: hover) and (pointer: fine)`.
- `app/page.tsx` — Main page (`'use client'`). State: `previewColor`, `sheetOpen`, `pickedColor`, `results`, `loading`, `error`. Interfaces: `SpecimenData`, `MatchResponse`. Renders full empty state: hero 12-col grid (eyebrow, H1, swatch trigger, hex display, CTA); right panel (how it works, status dot); 8-tile suggested swatches grid with hover preview; footer bar. Match button (`btn-primary`) appears when `pickedColor` is set; calls `handleMatch()` which POSTs hex to `/api/match` and writes `results` state. Inline error message renders if `error` is set. Renders `<ColorPickerSheet>` at page root.
- `app/api/match/route.ts` — API Route Handler (`POST /api/match`). Validates hex (`^#[0-9A-Fa-f]{6}$`). Calls Gemini 2.5 Flash with `SYSTEM_PROMPT`, `FEW_SHOT_EXAMPLES` (3 warm/cool/neutral specimens), and `RESPONSE_SCHEMA` (botanical + zoological, 8 fields each). Parallel Wikipedia thumbnail fetch via `/api/rest_v1/page/summary/{wikiTitle}` with `User-Agent` header. Wikipedia failures soft (imageUrl: null). Returns `{ botanical, zoological }` with `imageUrl` or `{ error: "API_ERROR" }`. `GEMINI_API_KEY` server-only. No ΔE validation yet (Commit 5).
- `app/components/ColorPickerSheet.tsx` — Bottom-sheet color picker (`'use client'`). Rendered via `createPortal` into `document.body`. Props: `isOpen`, `onClose`, `onColorPick`, `pickedColor`. Internal state: `hue` (0–360), `saturation` (0–100), `lightness` (0–100), `hexInput`, `format` ("hsl"|"rgb"|"hex"), `mounted`. Controls: hex input (18px Geist Mono, uppercase, live preview swatch), HSL saturation/lightness plane (180px, pointer drag, keyboard arrow 1%/10% nudge, 20×20 cursor), hue strip (rainbow gradient, 20×20 thumb), format dropdown (HSL/RGB/HEX), read-only format display fields. Interactions: spacebar shuffle (random preset, flash chip), Eye Dropper API (feature-detected, hidden if unsupported), "Use this color" commits hex and closes. Sheet animation: 320ms open / asymmetric cubic-bezier(0.22,1,0.36,1). Accessibility: `role="dialog" aria-modal="true"`, focus trap (Tab cycles, Shift+Tab reverses), Escape closes, `role="slider"` on HSL plane and hue strip with `aria-valuenow/min/max`, 44×44 touch targets on icon buttons, `pb-[env(safe-area-inset-bottom)]`, `overscrollBehavior: contain`.
- `postcss.config.mjs` — PostCSS config: `@tailwindcss/postcss` plugin only.
- `next.config.ts` — Next.js config (default, no custom settings).
- `.env.local` — `GEMINI_API_KEY` (server-only; never `NEXT_PUBLIC_`; gitignored).
- `package.json` — Dependencies: `next`, `react`, `react-dom`, `@google/generative-ai`, `chroma-js`. DevDeps: `tailwindcss`, `@tailwindcss/postcss`, `@types/chroma-js`, TypeScript, ESLint.

## Data Model

Stateless per request — no database, no auth, no session history.

| Variable | Type | Description |
|---|---|---|
| `pickedColor` | `string \| null` | User-selected hex (e.g. `#7AB58C`). Committed on sheet "Use this color". |
| `previewColor` | `string \| null` | Transient hover preview from swatch tiles. Reverts on mouse leave. |
| `sheetOpen` | `boolean` | Controls `ColorPickerSheet` visibility. |
| `results` | `{ botanical, zoological } \| null` | API response. Null until Match succeeds. |
| `loading` | `boolean` | True while `/api/match` fetch in flight. |
| `error` | `string \| null` | `"API_ERROR"` or `"MATCH_FAILED"`. Null on success. |
| `hue` | `number` | 0–360, internal to `ColorPickerSheet`. |
| `saturation` | `number` | 0–100, internal to `ColorPickerSheet`. |
| `lightness` | `number` | 0–100, internal to `ColorPickerSheet`. |

**API request/response shape (Commit 4+):**

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
