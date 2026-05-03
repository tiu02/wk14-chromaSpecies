# Chroma Specimen

[![Netlify Status](https://api.netlify.com/api/v1/badges/BADGE-ID/deploy-status)](https://app.netlify.com/sites/color-match/deploys)
[![GitHub](https://img.shields.io/badge/github-tiu02%2Fcolor--match-blue?logo=github)](https://github.com/tiu02/color-match)

**Live Demo:** [color-match.netlify.app](https://color-match.netlify.app)

## Project Description
Color Match is a a custom color matcher tool that matches one animal with one plant using dominant chromatic value that falls within tolerance (ΔE 2000 ≤ 10). Users pick a hue from the custom color picker or paste a hex code, the server calls Gemini 2.5 Flash, validates the color distance, and fetches real Wikipedia photos.

## How It Works
Four prompt-engineering and validation techniques make the output objectively verifiable rather than subjectively plausible:

1. **Constraint prompt:** the system prompt restricts Gemini to real species with Wikipedia articles, requires binomial nomenclature, bans forced matches, and enforces hue-family accuracy.

2. **Few-shot examples:** four reference specimens anchored to warm, cool, blue, and neutral targets (Vermilion #C84B3A, Teal #3A7A8A, Blue #4080C8, Mustard #D8C45E) are prepended to every request. Without anchors, Gemini's output quality varies significantly across hue families.

3. **Structured output schema** — `responseSchema` (SchemaType.OBJECT with 8 required fields per specimen) is passed to `generationConfig`. This prevents field renames, missing keys, and schema creep between calls without additional parsing logic.

4. **ΔE 2000 validation + auto-retry** — after the first Gemini response, `chroma.deltaE()` runs server-side against both `dominantHex` values. If either exceeds the threshold of 10, one automatic retry fires with `CORRECTION NEEDED: {violation details}` appended to the user content. Maximum cost: 2 Gemini calls per request.

The prompt constants are readable at [`app/api/match/route.ts`](app/api/match/route.ts): `SYSTEM_PROMPT`, `FEW_SHOT_EXAMPLES`, `RESPONSE_SCHEMA`.

## Tech Stack
- **Frontend Framework:** Next.js 16.2.4 (App Router, React Server Components)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, `@theme {}` design tokens)
- **Fonts:** Geist + Geist Mono via `next/font/google`
- **AI:** Google Gemini 2.5 Flash via `@google/generative-ai` 0.24.1
- **Color Science:** `chroma-js` 3.2.0 (ΔE 2000 validation, HSL/LAB conversions)
- **Icons:** `lucide-react` (Shuffle, Pipette, ChevronDown, X — tree-shakeable)
- **External API:** Wikipedia REST API v1 (`/page/summary/{title}` — no key required)
- **Deployment:** Netlify + `@netlify/plugin-nextjs`
- **AI Dev Tool:** Claude Code (VSCode Extension)

## Setup Instructions
### Prerequisites
- Node.js 18+
- A Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com))

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/tiu02/color-match
   cd color-match
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root (already in `.gitignore`):
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [localhost:3000](http://localhost:3000).

5. Test the API route directly:
   ```bash
   curl -X POST http://localhost:3000/api/match \
     -H "Content-Type: application/json" \
     -d '{"hex":"#7AB58C"}' | jq
   ```

### Deployment (Netlify)
The `@netlify/plugin-nextjs` adapter is auto-detected from `package.json`. Before deploying:

1. Add `GEMINI_API_KEY` to Netlify dashboard → **Site configuration → Environment variables**. Never commit it to the repo.
2. Push to GitHub — Netlify builds automatically from the connected branch.
3. Verify `@netlify/plugin-nextjs` appears in the build log.
4. Test the deployed URL with at least three hue families (warm, cool, neutral) to confirm end-to-end.

## Known Limitations
- HSL plane gradient approximates the SL plane (black/white corner blending is partial). Color accuracy in the picker is approximate — the hex input is the authoritative editing field.
- ΔE validation checks Gemini's self-reported `dominantHex`, not the specimen's actual visual color. If Gemini misreports `dominantHex`, validation passes even for a visually wrong match. Full fix would require server-side image color analysis.
- Wikipedia thumbnails are unavailable for rare or poorly-documented species — the card falls back to a "No image available" placeholder.
- ΔE tolerance of 10 is intentionally permissive (the CIE threshold for "close" matches). Tighter tolerances (≤ 5) increase retry frequency and occasionally produce MATCH_FAILED for unusual hues.
- No session caching — each Match request is stateless. Re-picking the same hue triggers a new Gemini call.

## Why I Built This
- I was originally goijng to make a design brief tool that generated based off user's prompting, but then realized there are already alot of projects like this being built. I got inspired by seeing this social media post of wildlife photography, comparing birds to flowers (specifically a blue pansy flower to a fairywren bird). I'm also a nature lover who's an artist, so I know others like be will gain much inspiration from this, as well as science lovers with the specimen cards.

## What I'd Change
- Add server-side image color analysis (dominant color extraction from the Wikipedia thumbnail) as a second validation layer, so `dominantHex` accuracy doesn't depend solely on Gemini's self-report.
- Cache responses by hex bucket (e.g., round to nearest 5° hue) to avoid duplicate Gemini calls for near-identical inputs.
- Tighten the ΔE threshold to ≤ 7 with a smarter retry strategy — provide Gemini with the actual computed ΔE values, not just a pass/fail flag, so the correction prompt is more precise.
