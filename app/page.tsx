"use client";

import { useState } from "react";

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

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 6l4 4-9 9H5v-4l9-9zM16 4l4 4" />
    </svg>
  );
}

function CrosshairIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function Home() {
  const [previewColor, setPreviewColor] = useState<string | null>(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <main className="px-5 lg:px-8 pt-12 pb-24 max-w-[1320px] mx-auto">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-12 gap-8 mb-10">

        {/* Left col */}
        <div className="col-span-12 md:col-span-7">
          <div className="label mb-2">
            New session · <time dateTime={now.toISOString()}>{dateStr} · {timeStr}</time>
          </div>

          <h1 className="text-[44px] md:text-[56px] leading-[1.02] tracking-tight font-medium text-ink">
            Pick a color.
          </h1>

          {/* Swatch trigger row */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              aria-label="Open color picker"
              className="swatch-trigger inline-flex items-center justify-center w-12 h-12 rounded-md checker ring-dim overflow-hidden"
            >
              {previewColor ? (
                <span className="block w-full h-full" style={{ background: previewColor }} />
              ) : (
                <span className="text-ink-3"><CrosshairIcon /></span>
              )}
            </button>

            <span
              className="mono text-[28px] md:text-[36px] whitespace-nowrap"
              style={{ color: previewColor ? "var(--color-ink)" : "var(--color-ink-4)" }}
              translate="no"
            >
              {previewColor ? previewColor.toUpperCase() : "#———————"}
            </span>

            <span className="label">
              {previewColor ? "preview" : "click swatch to pick"}
            </span>
          </div>

          {/* CTA */}
          <div className="mt-6">
            <button
              type="button"
              className="pick-cta px-5 py-3 mono text-[13px] inline-flex items-center gap-2"
            >
              <PencilIcon />
              Open color picker
            </button>
          </div>
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
              style={{ background: "#A8A39A", boxShadow: "0 0 0 3px rgba(168,163,154,0.18)" }}
            />
            <span>Awaiting selection · Wikimedia ready · Idle</span>
          </div>
          <div className="mt-2 mono text-[12px] text-ink-3">D65 · 2° · ΔE tolerance 10</div>
        </div>
      </section>

      {/* ── Suggested swatches ───────────────────────────────────────────── */}
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

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="mt-12 flex items-center justify-between">
        <div className="mono text-[11px] text-ink-3">
          Pick a hue above · specimens render once matched
        </div>
        <div className="mono text-[11px] text-ink-3">empty state · 0 of 0</div>
      </div>

    </main>
  );
}
