# Current State

### Scaffold — Commit 1: Complete
- **Next.js 16.2.4** (App Router, `create-next-app@latest` pulled ahead of 15; App Router conventions identical)
- **Tailwind CSS v4** — `@tailwindcss/postcss` plugin, `postcss.config.mjs` configured
- **`app/layout.tsx`** — Geist 400/500/600/700 + Geist Mono 400/500 loaded via `next/font/google`; sets CSS variables `--font-geist-sans` / `--font-geist-mono`; metadata set to "Color Match"
- **`@google/generative-ai` 0.24.1** — installed
- **`chroma-js` 3.2.0 + `@types/chroma-js`** — installed
- **`.env.local`** — `GEMINI_API_KEY` set (real key; never commits — `.env*` in `.gitignore`)
- **Dev server** — verified booting, returns 200, `.env.local` loaded

### Empty State UI — Commit 2: Complete
- **`app/globals.css`** — full `@theme {}` brand token block (11 color tokens); ink-3 corrected to `#6B6557` (WCAG AA — dark mode scaffold removed); font vars wired from layout CSS variables; utility classes: `.mono`, `.label`, `.checker`, `.ring-dim`, `.field`, `.pill`, `.swatch-tile`, `.btn-primary`, `.btn-secondary`, `.swatch-trigger`, `.pick-cta`; `@media (hover: hover) and (pointer: fine)` guards on hover transforms
- **`app/page.tsx`** — `'use client'`; `previewColor: string | null` hover state; hero 12-col grid (eyebrow with `<time>` element, H1 at 44px/md:56px, checker swatch trigger, hex display with `translate="no"`, state label, CTA button); right panel (how it works copy, `<kbd>space</kbd>` hint, status dot, sub-status); 8-tile suggested swatches grid with hover preview + `aria-label`; footer bar
- **Build** — `npm run build` clean; TypeScript passes

### Bottom-Sheet Picker — Commit 3: Complete
- **`app/components/ColorPickerSheet.tsx`** — new Client Component; rendered via `createPortal` into `document.body`; full HSL color picker with pointer drag on saturation/lightness plane and hue strip; hex input (18px Geist Mono, uppercase, live preview swatch); format dropdown (HSL/RGB/HEX) with read-only display fields; spacebar shuffle (random preset, 160ms flash); Eye Dropper API (feature-detected, hidden if unsupported); focus trap (Tab/Shift+Tab); Escape closes; `role="dialog" aria-modal="true"`; `role="slider"` on HSL plane and hue strip; 44×44 icon touch targets; `pb-[env(safe-area-inset-bottom)]`; `overscrollBehavior: contain`; sheet animation 320ms open / asymmetric cubic-bezier(0.22,1,0.36,1); "Use this color" commits hex and closes
- **`app/page.tsx`** — updated: added `sheetOpen` + `pickedColor` state; swatch trigger, CTA, and preset swatches all wire to `setSheetOpen(true)`; preset click also commits `setPickedColor`; hero reflects `pickedColor` vs `previewColor` vs empty; state label cycles "click swatch to pick" → "preview" → "your input"; `<ColorPickerSheet>` rendered at page root
- **`app/globals.css`** — added: `focus-visible` outline rings (2px solid ink, 2px offset) on all button classes; `:active` scale(0.98) for large buttons (120ms ease-out); `:active` scale(0.93) for icon buttons; `@media (prefers-reduced-motion: reduce)` disables transitions
- **Build** — `npm run build` clean; TypeScript passes

### `/api/match` Route + Wikipedia Fetch — Commit 4: Complete
- **`app/api/match/route.ts`** — new API Route Handler; `POST /api/match` accepts `{ hex: string }` with server-side regex validation (`^#[0-9A-Fa-f]{6}$`); calls Gemini 2.5 Flash via `@google/generative-ai` with `SYSTEM_PROMPT` (naturalist researcher constraints), `FEW_SHOT_EXAMPLES` (3 specimens: Vermilion warm, Teal cool, Mustard neutral), and `RESPONSE_SCHEMA` (8-field botanical + zoological object); fetches Wikipedia thumbnails in parallel via `/api/rest_v1/page/summary/{wikiTitle}` with `User-Agent` header; Wikipedia failures soft (imageUrl: null); returns `{ botanical, zoological }` with `imageUrl` fields or generic `{ error: "API_ERROR" }` on Gemini failure (no raw SDK strings exposed); `GEMINI_API_KEY` accessed server-only (never `NEXT_PUBLIC_`)
- **`app/page.tsx`** — updated: added `results`, `loading`, `error` state; `SpecimenData` and `MatchResponse` interface definitions; `handleMatch()` async function POSTs `pickedColor` hex to `/api/match`; Match button appears when `pickedColor` set, disabled during `loading`, shows "Matching…" text; inline error message renders on failure
- **Tested** — curl POST `#C84B3A` (Vermilion → Oriental Poppy + Summer Tanager) and `#3A7A8A` (Teal → Blue Chalk Sticks + Malachite Kingfisher) both return specimens with Wikipedia image URLs; build passes
- **No ΔE validation yet** — route returns best Gemini result regardless; `chroma.deltaE()` + auto-retry deferred to Commit 5

### Results State + ΔE Validation — Commit 5: Complete
- **`app/api/match/route.ts`** — added `chroma-js` import + `DELTA_E_THRESHOLD = 10`; extracted `callGemini()` helper; `validateDeltaE()` computes `chroma.deltaE()` for both specimens; one auto-retry fires when either ΔE exceeds 10, appending `CORRECTION NEEDED: {violation feedback}` to user content; result returned regardless (best effort); cost ceiling: 2 Gemini calls max per request
- **`app/components/SpecimenCard.tsx`** — new Client Component; header (eyebrow + ΔE pill with tooltip + Wikipedia arrow link); H2 common name (26px); scientific + family mono italic; `aspect-[7/5]` image with real Wikipedia thumbnail or "No image available" fallback; description (14.5px); "Color biology" fun fact section (border-t); dominant color footer (swatch + hex + RGB + "verified" pill); `card-enter` animation class with `animationDelay` prop for 80ms stagger
- **`app/page.tsx`** — hero H1 toggles "Pick a color." / "Match found."; eyebrow toggles session / specimen labels; swatch trigger resizes (48→36px) in results state; CTA button label toggles "Open color picker" / "Edit color"; status dot fills with `pickedColor` in results state with color-matched ring; `hasActivity` gate controls results section vs. suggested swatches; toolbar row with "Specimens · 2", "Avg ΔE · {avg}", "Source · Wikimedia / Kew" pills; card grid `grid-cols-12` with `col-span-12 md:col-span-6` cards; loading skeleton (two card-shaped placeholders with shimmer); `MATCH_FAILED` inline error in card slots; footer text updates for results state
- **`app/globals.css`** — added: `@keyframes card-enter` (translateY 8px→0, opacity, 280ms); `.card-enter` class; `@keyframes shimmer` (translateX sweep, 1.4s linear); `.skeleton-shimmer` + `::after` pseudo for shimmer overlay; `@keyframes btn-pulse` (opacity 60–100%, 600ms); `.btn-loading` class; `prefers-reduced-motion` overrides for all three animations
- **Build** — `npm run build` clean; TypeScript passes; all routes compile

### ColorPickerSheet UI Pass (pre-Commit 6): Complete
- **Icons** — `lucide-react` installed; replaced all custom SVGs with `Shuffle`, `Pipette`, `ChevronDown`, `X` from lucide-react (consistent 1.5px stroke, tree-shakeable)
- **Hex field** — "Hex" label moved inside the `.field` div (stacked label/input pattern matching channel cards); color swatch repositioned `absolute right-4 top-1/2 -translate-y-1/2` (40×40px) so it stays vertically centered regardless of label height; `pr-14` added to input row to prevent text overlap
- **Format control** — replaced click-to-cycle button with custom-styled dropdown: `.field` trigger with `ChevronDown` (rotates 180° on open), white popover with `E7E3D9` border and elevation shadow, `.format-option` CSS class with 80ms hover transition, `ECE7DA` selected state; closes on outside click and Escape
- **Format options** — changed from `["HEX", "RGB", "HSL"]` to `["RGB", "HSL", "HSB"]`; added `hslToHSB()` conversion function; channel display renders Hue/Sat/Bright for HSB mode
- **Default gray** — removed all empty/no-color states; `DEFAULT_GRAY = "#A8A39A"` (matches `--color-ink-4`); `GRAY_HSL` computed at module scope; sheet initializes with gray and resets to it when opened without a `pickedColor`; HSL plane cursor always visible; hex swatch always shows color
- **Input field hover/active** — removed broad `button[aria-label]:active { transform: scale(0.93) }` rule from globals.css; static `.field` display cards have no interactive states
- **Hue strip labels** — removed `0°` / `drag the marker to set hue` / `360°` label row
- **Build** — `npm run build` clean; `tsc --noEmit` clean; TypeScript passes

### UX Fixes (pre-Commit 6): Complete
- **Tooltip** — replaced `title` attribute on ΔE pill with `.de-tooltip` / `.de-tooltip-content` CSS class pair; triggers on hover and `:focus-within`; 120ms opacity transition; `role="tooltip"` on content div
- **ΔE tooltip copy** — updated to "Lower = closer match · <2 imperceptible · ≤10 within tolerance · >10 outside range"
- **Status sub-text** — `D65 · 2° · ΔE tolerance 10` → `Daylight D65 · 2° observer · max ΔE 10`; `title` attribute on element with full technical expansion on hover
- **Blue hue mismatch** — added 4th few-shot example (Himalayan Blue Poppy + Blue Grosbeak, target ~#4080C8); system prompt tightened with explicit hue-family accuracy constraint (blue ≠ violet/purple) and `dominantHex` accuracy requirement
- **"verified" pill** — now conditional: `"within tolerance"` (standard pill) when `deltaE ≤ 10`; `"outside tolerance"` (muted style, `--color-ink-3` text) when not
- **Build** — `npm run build` clean; TypeScript passes

### A11y + Motion Polish — Commit 6: Complete
- **`app/globals.css`** — added: `.swatch-tile:focus-visible` and `.swatch-trigger:focus-visible` outline rings (2px solid ink, 2px offset); `.btn-icon` base class with transition + `.btn-icon:active { scale(0.93) }` (distinct from `.btn-secondary` scale 0.98); `@keyframes hue-pulse` (scale 1→1.8, opacity 0.5→0) + `.hue-pulse-ring` class (3 iterations, ease-in-out, `forwards` fill-mode, EMPTY state only); `@keyframes skeleton-pulse` (opacity 0.6→1 fallback); expanded `prefers-reduced-motion` block to cover sheet (`.sheet-panel`), backdrop (`.sheet-backdrop`), pulse ring (animation none), swatch tile (transition none), and shimmer (opacity pulse instead of sweep); `.format-option:focus-visible` ring (2px solid ink, -2px inset offset); `.hex-field-wrapper:focus-within` ring (2px solid ink, keyboard focus for hex input container)
- **`app/components/ColorPickerSheet.tsx`** — added: `pulseKey` state (increments on each sheet open to restart pulse ring); `willChange` state (true on open/close intent, false on `transitionend` via `onTransitionEnd` handler) guarded by `hasBeenOpenedRef` (prevents GPU layer leak on page load); `sheet-backdrop` class + `ease-out` easing (was `ease`); `sheet-panel` class + `willChange: willChange ? "transform" : "auto"` inline style + `onTransitionEnd` handler; hue strip thumb `w-3 h-3` → `w-5 h-5` (12→20px, spec minimum); `overflow-hidden` removed from hue strip container (was clipping 20px thumb and pulse ring to 12px track height); icon buttons (Pick/Shuffle/Close) now have `btn-icon min-w-11 min-h-11` (44×44 touch target); pulse ring `<span className="hue-pulse-ring" key={pulseKey} aria-hidden="true">` inside thumb, rendered only when `!pickedColor`; `hex-field-wrapper` class on hex input container
- **`app/components/SpecimenCard.tsx`** — removed `overflow-hidden` from card root (was clipping absolutely-positioned `.de-tooltip-content`); shortened ΔE tooltip to single line: `"Color distance · ≤10 in tolerance · lower = closer"`
- **Build** — `npm run build` clean; TypeScript passes

### Vitest Test Suite — Session 10: Complete
- **Vitest 4.1.5** installed with `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`; `vite-tsconfig-paths` replaced with native `resolve: { tsconfigPaths: true }`
- **`vitest.config.mts`** — `environment: jsdom`, `setupFiles: ['./vitest.setup.ts']`
- **`vitest.setup.ts`** — `afterEach(cleanup)` for RTL DOM teardown between tests
- **`app/lib/color-utils.ts`** — new shared utility; extracted `hexToHSL`, `hslToHex`, `hue2rgb`, `hslToHSB`, `hexToRgb` (object form) from `ColorPickerSheet.tsx`; extracted `validateDeltaE` and `SpecimenData` interface from `route.ts`; all exported
- **`ColorPickerSheet.tsx`** — updated to import from `app/lib/color-utils.ts`; local function bodies removed
- **`route.ts`** — updated to import `validateDeltaE` + `SpecimenData` from `app/lib/color-utils.ts`; local `SpecimenData` interface, `validateDeltaE` function, `chroma` import, and `DELTA_E_THRESHOLD` constant removed; `eslint-disable` comment moved inline above `as any` cast
- **`__tests__/color-utils.test.ts`** — 19 unit tests: `hexToHSL` (6 cases: pure red/green/blue, white, black, default gray), `hslToHex` (4 cases: pure red, white, black, round-trip), `hslToHSB` (4 cases), `hexToRgb` (5 cases)
- **`__tests__/validateDeltaE.test.ts`** — 5 tests: both within threshold, botanical out, zoological out, both out, exact match (ΔE = 0)
- **`__tests__/SpecimenCard.test.tsx`** — 10 tests: common name, ΔE pill value, within/outside tolerance, boundary at exactly 10, fallback image, image renders, Botanical/Zoological labels, fallback card ID for index ≥ 2
- **`README.md`** — `[![Tests](https://img.shields.io/badge/tests-34%20passing-brightgreen)]` badge added
- **Result** — 34/34 passing; `npm test -- --run` exits 0

--

# Known Issues
- HSL plane gradient only adjusts lightness axis; a full SL-plane gradient (black/white corners) is not yet implemented. Color accuracy is approximate.
- `format` dropdown: RGB/HSL/HSB values are read-only display (derived from HSL state). Hex input is the authoritative editing field. This matches spec intent.
- `RESPONSE_SCHEMA` uses `as any` cast to satisfy strict TypeScript typing in the `@google/generative-ai` 0.24.1 SDK — the literal schema object is otherwise typed as `readonly` and conflicts with the mutable `string[]` required by the SDK's `ObjectSchema.required` field.
- **Blue hue mismatch (partial fix):** System prompt tightened + blue few-shot example added. However, ΔE validation checks Gemini's self-reported `dominantHex`, not the specimen's actual visual color — if Gemini misreports `dominantHex`, validation passes even for a wrong match. Prompt-level mitigation only; full fix would require server-side image color analysis.

--

## Next Steps
1. N/A
