"use client";

import { useState } from "react";
import ColorPickerSheet from "./components/ColorPickerSheet";
import SpecimenCard, { type SpecimenData } from "./components/SpecimenCard";

const SUGGESTED = [
  { hex: "#C84B3A", name: "Vermilion" },
  { hex: "#E8A33B", name: "Saffron" },
  { hex: "#D8C45E", name: "Mustard" },
  { hex: "#7AB58C", name: "Sage" },
  { hex: "#3A7A8A", name: "Teal" },
  { hex: "#5C5BA8", name: "Iris" },
  { hex: "#A8688E", name: "Rose Quartz" },
  { hex: "#6E5239", name: "Walnut" },
] as const;

interface MatchResults {
  botanical: SpecimenData;
  zoological: SpecimenData;
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 6l4 4-9 9H5v-4l9-9zM16 4l4 4" />
    </svg>
  );
}

function CrosshairIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      className="col-span-12 md:col-span-6 rounded-[14px] overflow-hidden"
      style={{
        background: "var(--color-canvas-2)",
        boxShadow: "0 1px 0 rgba(25,22,19,0.04), 0 1px 2px rgba(25,22,19,0.05)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="p-5">
        <div className="skeleton-shimmer h-2.5 w-28 rounded mb-3" />
        <div className="skeleton-shimmer h-7 w-48 rounded mb-2" />
        <div className="skeleton-shimmer h-3 w-36 rounded" />
      </div>
      <div className="px-5">
        <div className="skeleton-shimmer w-full rounded-[10px]" style={{ aspectRatio: "7/5" }} />
      </div>
      <div className="p-5">
        <div className="skeleton-shimmer h-3.5 w-full rounded mb-2" />
        <div className="skeleton-shimmer h-3.5 w-3/4 rounded mb-2" />
        <div className="skeleton-shimmer h-3.5 w-5/6 rounded" />
      </div>
    </div>
  );
}

export default function Home() {
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [results, setResults] = useState<MatchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<"MATCH_FAILED" | "API_ERROR" | null>(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  const hasActivity = loading || !!results || error === "MATCH_FAILED";
  const avgDeltaE = results
    ? ((results.botanical.deltaE + results.zoological.deltaE) / 2).toFixed(1)
    : null;

  const handleMatch = async (hexOverride?: string) => {
    const hex = hexOverride ?? pickedColor;
    if (!hex) return;
    if (hexOverride) setPickedColor(hexOverride);

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hex }),
      });

      const data = await res.json() as {
        botanical?: SpecimenData;
        zoological?: SpecimenData;
        error?: string;
      };

      if (data.botanical && data.zoological) {
        setResults({ botanical: data.botanical, zoological: data.zoological });
        setError(null);
      } else if (data.error === "MATCH_FAILED") {
        setError("MATCH_FAILED");
      } else {
        setError("API_ERROR");
      }
    } catch {
      setError("API_ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-5 lg:px-8 pt-12 pb-24 max-w-[1320px] mx-auto">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-12 gap-8 mb-10">

        {/* Left col */}
        <div className="col-span-12 md:col-span-7">
          <div className="label mb-2">
            {results
              ? <>Specimen Card 0247.A · Session <time dateTime={now.toISOString()}>{dateStr} · {timeStr}</time></>
              : <>New session · <time dateTime={now.toISOString()}>{dateStr} · {timeStr}</time></>
            }
          </div>

          <h1 className="text-[44px] md:text-[56px] leading-[1.02] tracking-tight font-medium text-ink">
            {results ? "Match found." : "Pick a color."}
          </h1>

          {/* Swatch trigger row */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="Open color picker"
              className="swatch-trigger inline-flex items-center justify-center rounded-md checker ring-dim overflow-hidden"
              style={{ width: results ? 36 : 48, height: results ? 36 : 48 }}
            >
              {pickedColor ? (
                <span className="block w-full h-full" style={{ background: pickedColor }} />
              ) : previewColor ? (
                <span className="block w-full h-full" style={{ background: previewColor }} />
              ) : (
                <span className="text-ink-3"><CrosshairIcon /></span>
              )}
            </button>

            <span
              className="mono text-[28px] md:text-[36px] whitespace-nowrap"
              style={{ color: pickedColor || previewColor ? "var(--color-ink)" : "var(--color-ink-4)" }}
              translate="no"
            >
              {pickedColor || previewColor ? (pickedColor || previewColor)!.toUpperCase() : "#———————"}
            </span>

            <span className="label">
              {pickedColor ? "your input" : previewColor ? "preview" : "click swatch to pick"}
            </span>
          </div>

          {/* CTA + Match buttons */}
          <div className="mt-6 flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="pick-cta px-5 py-3 mono text-[13px] inline-flex items-center gap-2"
            >
              <PencilIcon />
              {results ? "Edit color" : "Open color picker"}
            </button>
            {pickedColor && (
              <button
                type="button"
                onClick={() => handleMatch()}
                disabled={loading}
                className={`btn-primary px-5 py-3 mono text-[13px] disabled:opacity-50 disabled:cursor-not-allowed${loading ? " btn-loading" : ""}`}
              >
                {loading ? "Matching…" : "Match specimens"}
              </button>
            )}
          </div>

          {/* API error */}
          {error === "API_ERROR" && (
            <div className="mt-4 p-3 rounded-md bg-canvas-2 border border-rule">
              <p className="mono text-[13px] text-ink-3">
                Unable to fetch specimens — try again.
              </p>
            </div>
          )}
        </div>

        {/* Right col */}
        <div className="col-span-12 md:col-span-5 md:pl-8 md:border-l border-rule flex flex-col justify-end">
          <div className="label mb-2">How this works</div>
          <p className="text-[14px] leading-[1.55] text-ink-2 max-w-[42ch] mb-5">
            Choose any hue from the picker below, paste a hex code, or hit{" "}
            <kbd
              className="mono text-[11px] px-1.5 py-0.5 rounded"
              style={{ background: "#ECE7DA", boxShadow: "inset 0 0 0 1px rgba(25,22,19,0.08)" }}
              title="Spacebar shuffles to a random preset hue"
            >
              space
            </kbd>{" "}
            to shuffle. The instrument returns one botanical and one zoological specimen whose
            dominant chromatic value falls within tolerance (ΔE&nbsp;≤&nbsp;10) per CIE 1976.
          </p>

          <div className="label mb-2">Status</div>
          <div className="flex items-center gap-2 mono text-[13px] text-ink-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: results && pickedColor ? pickedColor : "#A8A39A",
                boxShadow: results && pickedColor
                  ? `0 0 0 3px ${pickedColor}30`
                  : "0 0 0 3px rgba(168,163,154,0.18)",
              }}
            />
            <span>
              {results
                ? "Match found · Wikimedia ready · Active"
                : loading
                ? "Querying · Wikimedia fetching · Active"
                : "Awaiting selection · Wikimedia ready · Idle"}
            </span>
          </div>
          <div
            className="mt-2 mono text-[12px] text-ink-3"
            title="D65 = standard daylight illuminant · 2° = CIE standard observer angle · ΔE tolerance = max perceptual color distance allowed per match"
          >
            Daylight D65 · 2° observer · max ΔE 10
          </div>
        </div>
      </section>

      {/* ── Results / Loading / MATCH_FAILED ─────────────────────────────── */}
      {hasActivity && (
        <section className="mb-10">
          {/* Toolbar row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="pill">Specimens · 2</span>
              {avgDeltaE && <span className="pill">Avg ΔE · {avgDeltaE}</span>}
              <span className="pill">Source · Wikimedia / Kew</span>
            </div>
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-12 gap-6">
            {loading ? (
              <>
                <SkeletonCard delay={0} />
                <SkeletonCard delay={80} />
              </>
            ) : error === "MATCH_FAILED" ? (
              <>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="col-span-12 md:col-span-6 rounded-[14px] p-6 flex items-center justify-center"
                    style={{
                      background: "var(--color-canvas-2)",
                      minHeight: 200,
                      boxShadow: "0 1px 0 rgba(25,22,19,0.04)",
                    }}
                  >
                    <p className="text-[14px] text-ink-3 text-center max-w-[32ch]">
                      No match within tolerance — try a more saturated hue.
                    </p>
                  </div>
                ))}
              </>
            ) : results ? (
              <>
                <SpecimenCard type="botanical" data={results.botanical} index={0} />
                <SpecimenCard type="zoological" data={results.zoological} index={1} />
              </>
            ) : null}
          </div>
        </section>
      )}

      {/* ── Suggested swatches (empty state only) ────────────────────────── */}
      {!hasActivity && (
        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="label mb-1">Start from a suggestion</div>
              <h3 className="text-[18px] tracking-tight font-semibold text-ink">
                Common dominant hues
              </h3>
            </div>
            <div className="mono text-[11px] text-ink-3">8 presets · click to seed picker</div>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {SUGGESTED.map((s) => (
              <button
                key={s.hex}
                type="button"
                onClick={() => {
                  setPickedColor(s.hex);
                  setSheetOpen(true);
                }}
                className="swatch-tile aspect-square relative"
                style={{ background: s.hex }}
                aria-label={`${s.name} — ${s.hex}`}
                onMouseEnter={() => setPreviewColor(s.hex)}
                onMouseLeave={() => setPreviewColor(null)}
              >
                <span
                  className="absolute inset-x-0 bottom-1.5 mono text-[10px] text-white/95 text-center"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
                  aria-hidden="true"
                  translate="no"
                >
                  {s.hex}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="mt-12 flex items-center justify-between">
        <div className="mono text-[11px] text-ink-3">
          {results
            ? "Specimen match complete · re-pick to run again"
            : "Pick a hue above · specimens render once matched"}
        </div>
        <div className="mono text-[11px] text-ink-3">
          {results ? "results · 2 of 2" : "empty state · 0 of 0"}
        </div>
      </div>

      {/* ── Color Picker Sheet ───────────────────────────────────────────── */}
      <ColorPickerSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onColorPick={setPickedColor}
        onMatch={handleMatch}
        pickedColor={pickedColor}
      />
    </main>
  );
}
