## Tech Stack

- Frontend: Next.js 16.2.4 (App Router, React Server Components)
- Styling: Tailwind CSS v4 (`@tailwindcss/postcss` plugin, `@theme {}` tokens)
- Fonts: Geist + Geist Mono via `next/font/google`
- AI: Google Gemini 2.5 Flash via `@google/generative-ai` 0.24.1
- Color Science: `chroma-js` 3.2.0 (ΔE 2000 validation, HSL/LAB conversions)
- External API: Wikipedia REST API v1 (`/page/summary/{title}` — thumbnail fetch, no key required)
- Icons: `lucide-react` (Shuffle, Pipette, ChevronDown, X — 1.5px stroke, tree-shakeable)
- Deployment: Netlify + `@netlify/plugin-nextjs`

## Key Files

- `app/layout.tsx` — Root layout. Loads Geist (400/500/600/700) and Geist Mono (400/500) via `next/font/google`. Sets CSS variables `--font-geist-sans` and `--font-geist-mono` on the `<html>` element. Body is `min-h-full flex flex-col`. Metadata: title "Color Match", description "Pick a color. Find the matching botanical and zoological specimens."
- `app/globals.css` — `@import "tailwindcss"` entry point. Full `@theme {}` brand token block: 11 color tokens (canvas, canvas-2, surface, surface-2, ink, ink-2, ink-3, ink-4, rule, rule-2, field); ink-3 = `#6B6557` (WCAG AA corrected — `#807A6E` fails). Font vars wired from layout CSS variables. `body` background set to `--color-canvas` (#FAF7F2). Utility classes: `.mono`, `.label`, `.checker`, `.ring-dim`, `.field`, `.pill`, `.swatch-tile` (with `:focus-visible` ring), `.btn-primary` / `.btn-secondary`, `.btn-icon` (`:active` scale 0.93, distinct from `.btn-secondary` scale 0.98), `.swatch-trigger` (with `:focus-visible` ring), `.pick-cta`, `.format-option`. Hover transforms guarded with `@media (hover: hover) and (pointer: fine)`. Tooltip: `.de-tooltip` (relative wrapper) + `.de-tooltip-content` (absolute dark panel, opacity 0→1 on hover/focus-within, 120ms ease). Animations: `@keyframes card-enter` (translateY 8px→0 + opacity, 280ms), `.card-enter`; `@keyframes shimmer` (translateX sweep, 1.4s), `.skeleton-shimmer` + `::after`; `@keyframes btn-pulse` (opacity 60–100%, 600ms), `.btn-loading`; `@keyframes hue-pulse` (scale 1→1.8, opacity 0.5→0), `.hue-pulse-ring` (3 iterations, EMPTY state only); `@keyframes skeleton-pulse` (opacity fallback for reduced-motion). `prefers-reduced-motion: reduce` covers: all button/tile transitions, card-enter, shimmer (replaced by skeleton-pulse), btn-loading, hue-pulse-ring, `.sheet-panel` and `.sheet-backdrop` (instant).
- `app/page.tsx` — Main page (`'use client'`). State: `previewColor`, `sheetOpen`, `pickedColor`, `results`, `loading`, `error` (`"MATCH_FAILED" | "API_ERROR" | null`). Computed: `hasActivity` (gates results section vs. suggested swatches), `avgDeltaE`. Full state machine: EMPTY → READY → LOADING → RESULTS | MATCH_FAILED. Hero H1 / eyebrow / swatch size toggle between empty and results states; status dot fills with `pickedColor` and color-matched ring in results. CTA label toggles "Open color picker" / "Edit color". Results section: toolbar row with "Specimens · 2", "Avg ΔE · {avg}", "Source · Wikimedia / Kew" pills; `grid-cols-12` card grid. Loading: two `<SkeletonCard>` placeholders with `skeleton-shimmer`. MATCH_FAILED: inline error text in card slot positions. Footer text updates for results state. Renders `<ColorPickerSheet>` and `<SpecimenCard>` (imported from components).
- `app/api/match/route.ts` — API Route Handler (`POST /api/match`). Validates hex (`^#[0-9A-Fa-f]{6}$`). `SYSTEM_PROMPT` includes hue-family accuracy constraint (blue ≠ violet/purple) and `dominantHex` accuracy requirement. `FEW_SHOT_EXAMPLES`: 4 specimens — Vermilion warm (#C84B3A), Teal cool (#3A7A8A), Blue medium (#4080C8, added this session), Mustard neutral (#D8C45E). `RESPONSE_SCHEMA`: botanical + zoological, 8 fields each. `callGemini()` helper wraps content assembly. After first call, `validateDeltaE()` runs `chroma.deltaE()` for both specimens; if either exceeds `DELTA_E_THRESHOLD = 10`, one auto-retry fires with `CORRECTION NEEDED: {violation details}` appended (cost ceiling: 2 Gemini calls). Parallel Wikipedia thumbnail fetch. Returns `{ botanical, zoological, imageUrl }` or `{ error: "API_ERROR" }` on Gemini failure. `GEMINI_API_KEY` server-only.
- `app/components/SpecimenCard.tsx` — Specimen result card (`'use client'`). Props: `type` ("botanical"|"zoological"), `data` (`SpecimenData`), `index` (for 80ms animation stagger). Sections: header (eyebrow label + `.de-tooltip` ΔE pill with direction copy + Wikipedia `<a>` arrow); H2 common name (26px); scientific name + family (mono italic, `translate="no"`); `aspect-[7/5]` image with real Wikipedia thumbnail or text fallback; 14.5px description; "Color biology" fun fact (border-t); dominant color footer (16×16 swatch + hex + RGB + conditional "within tolerance" / "outside tolerance" pill based on `deltaE ≤ 10`). `.card-enter` class with inline `animationDelay` for stagger.
- `app/components/ColorPickerSheet.tsx` — Bottom-sheet color picker (`'use client'`). Rendered via `createPortal` into `document.body`. Props: `isOpen`, `onClose`, `onColorPick`, `pickedColor`. Internal state: `hue` (0–360), `saturation` (0–100), `lightness` (0–100), `hexInput`, `format` ("hsl"|"rgb"|"hex"), `mounted`, `pulseKey` (number, increments on each open to restart pulse ring animation), `willChange` (boolean, true during sheet transition, false on `transitionend`). Controls: hex input (18px Geist Mono, uppercase, live preview swatch), HSL saturation/lightness plane (180px, pointer drag, keyboard arrow 1%/10% nudge, 20×20 cursor), hue strip (rainbow gradient, 20×20 thumb with `.hue-pulse-ring` child when `!pickedColor`), format dropdown (RGB/HSL/HSB), read-only format display fields. Interactions: spacebar shuffle (random preset, flash chip), Eye Dropper API (feature-detected, hidden if unsupported), "Use this color" commits hex and closes. Sheet animation: 320ms open / asymmetric 200ms close, cubic-bezier(0.22,1,0.36,1); `will-change: transform` set on open/close intent, cleared on `transitionend`. Backdrop: 240ms enter / 160ms exit, `ease-out`. Accessibility: `role="dialog" aria-modal="true"`, focus trap (Tab cycles, Shift+Tab reverses), Escape closes, `role="slider"` on HSL plane and hue strip with `aria-valuenow/min/max`, `min-w-11 min-h-11` (44×44) touch targets on Pick/Shuffle/Close icon buttons, `pb-[env(safe-area-inset-bottom)]`, `overscrollBehavior: contain`.
- `postcss.config.mjs` — PostCSS config: `@tailwindcss/postcss` plugin only.
- `next.config.ts` — Next.js config (default, no custom settings).
- `.env.local` — `GEMINI_API_KEY` (server-only; never `NEXT_PUBLIC_`; gitignored).
- `app/lib/color-utils.ts` — Shared pure-function utilities. Exports: `hexToHSL`, `hslToHex`, `hue2rgb`, `hslToHSB`, `hexToRgb` (returns `{r,g,b}` object), `validateDeltaE`, `SpecimenData` interface. Used by `ColorPickerSheet.tsx` and `route.ts`. Note: `SpecimenCard.tsx` has its own local `hexToRgb` that returns an `"r g b"` CSS string — different signature, not shared.
- `vitest.config.mts` — Vitest config: `environment: jsdom`, `resolve: { tsconfigPaths: true }`, `setupFiles: ['./vitest.setup.ts']`.
- `vitest.setup.ts` — RTL `afterEach(cleanup)` to tear down the DOM between tests.
- `__tests__/color-utils.test.ts` — Unit tests for pure color conversion functions (19 tests).
- `__tests__/validateDeltaE.test.ts` — Unit tests for ΔE threshold branching (5 tests).
- `__tests__/SpecimenCard.test.tsx` — RTL component tests for SpecimenCard render behavior (10 tests).
- `package.json` — Dependencies: `next`, `react`, `react-dom`, `@google/generative-ai`, `chroma-js`, `lucide-react`. DevDeps: `tailwindcss`, `@tailwindcss/postcss`, `@types/chroma-js`, TypeScript, ESLint, `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`.

## Data Model

Stateless per request — no database, no auth, no session history.

| Variable | Type | Description |
|---|---|---|
| `pickedColor` | `string \| null` | User-selected hex (e.g. `#7AB58C`). Committed on sheet "Use this color". |
| `previewColor` | `string \| null` | Transient hover preview from swatch tiles. Reverts on mouse leave. |
| `sheetOpen` | `boolean` | Controls `ColorPickerSheet` visibility. |
| `results` | `{ botanical, zoological } \| null` | API response. Null until Match succeeds. |
| `loading` | `boolean` | True while `/api/match` fetch in flight. |
| `error` | `"MATCH_FAILED" \| "API_ERROR" \| null` | Typed union. `"API_ERROR"` = Gemini/network failure. `"MATCH_FAILED"` = explicit server error response. Null on success. |
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
