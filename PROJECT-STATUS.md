# Current State

### Scaffold — Commit 1: Complete
- **Next.js 16.2.4** (App Router, `create-next-app@latest` pulled ahead of 15; App Router conventions identical)
- **Tailwind CSS v4** — `@tailwindcss/postcss` plugin, `postcss.config.mjs` configured
- **`app/layout.tsx`** — Geist 400/500/600/700 + Geist Mono 400/500 loaded via `next/font/google`; sets CSS variables `--font-geist-sans` / `--font-geist-mono`; metadata set to "Color Match"
- **`@google/generative-ai` 0.24.1** — installed
- **`chroma-js` 3.2.0 + `@types/chroma-js`** — installed
- **`.env.local`** — `GEMINI_API_KEY` set (real key; never commits — `.env*` in `.gitignore`)
- **`.gitignore`** — merged Next.js defaults + course entries (`transcripts/`, `docs/`, `plans/`, `ref-screenshots/`, `.claude`, `.mcp.json`, `AGENTS.md`, `CLAUDE.md`)
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

--

# Known Issues
- HSL plane gradient only adjusts lightness axis; a full SL-plane gradient (black/white corners) is not yet implemented. Color accuracy is approximate — correctable in Commit 6 polish pass if needed.
- `format` dropdown state currently controls display-only fields; hex input is the authoritative editing field. RGB triple is read-only (display derived from `currentHex`). This matches the spec intent.

--

## Next Steps
1. Start Commit 4: `/api/match` Route + Wikipedia Fetch.
