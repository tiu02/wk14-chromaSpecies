"use client";

export interface SpecimenData {
  commonName: string;
  scientificName: string;
  family: string;
  description: string;
  funFact: string;
  dominantHex: string;
  deltaE: number;
  wikiTitle: string;
  imageUrl: string | null;
}

interface SpecimenCardProps {
  type: "botanical" | "zoological";
  data: SpecimenData;
  index: number;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  );
}

const CARD_IDS = ["0247.A", "0247.B"];

export default function SpecimenCard({ type, data, index }: SpecimenCardProps) {
  const typeLabel = type === "botanical" ? "Botanical" : "Zoological";
  const cardId = CARD_IDS[index] ?? `0247.${String.fromCharCode(65 + index)}`;

  return (
    <div
      className="card-enter col-span-12 md:col-span-6 rounded-[14px] bg-surface"
      style={{
        boxShadow: "0 1px 0 rgba(25,22,19,0.04), 0 1px 2px rgba(25,22,19,0.05), 0 8px 16px -10px rgba(25,22,19,0.10)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="label">{typeLabel} · {cardId}</div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="de-tooltip">
              <span className="pill cursor-help">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: data.dominantHex }}
                  aria-hidden="true"
                />
                ΔE {data.deltaE.toFixed(1)}
              </span>
              <div className="de-tooltip-content" role="tooltip">
                Color distance · ≤10 in tolerance · lower = closer
              </div>
            </div>
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(data.wikiTitle.replace(/ /g, "_"))}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${data.commonName} on Wikipedia`}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-3 transition-colors duration-[120ms] ease hover:text-ink hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <ArrowIcon />
            </a>
          </div>
        </div>

        <h2 className="text-[26px] leading-[1.1] tracking-tight font-semibold text-ink mt-2">
          {data.commonName}
        </h2>
        <p className="mono text-[13px] text-ink-2 italic mt-0.5" translate="no">
          {data.scientificName} · {data.family}
        </p>
      </div>

      {/* Image */}
      <div className="px-5">
        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt={`${data.commonName} (${data.scientificName})`}
            className="w-full object-cover rounded-[10px]"
            style={{ aspectRatio: "7/5" }}
          />
        ) : (
          <div
            className="w-full rounded-[10px] bg-canvas-2 flex items-center justify-center"
            style={{ aspectRatio: "7/5" }}
          >
            <span className="mono text-[11px] text-ink-4">No image available</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="px-5 pt-4">
        <p className="text-[14.5px] leading-[1.55] text-ink-2">{data.description}</p>
      </div>

      {/* Fun fact */}
      <div className="mx-5 mt-4 pt-4 border-t border-rule">
        <div className="label mb-1.5">Color biology</div>
        <p className="text-[13.5px] leading-[1.55] text-ink-2">{data.funFact}</p>
      </div>

      {/* Dominant color footer */}
      <div className="mx-5 mt-4 pt-4 pb-5 border-t border-rule flex items-center gap-3 flex-wrap">
        <span
          className="w-4 h-4 rounded-sm flex-shrink-0"
          style={{
            background: data.dominantHex,
            boxShadow: "inset 0 0 0 1px rgba(25,22,19,0.10)",
          }}
          aria-hidden="true"
        />
        <span className="mono text-[12px] text-ink" translate="no">{data.dominantHex.toUpperCase()}</span>
        <span className="mono text-[12px] text-ink-3" translate="no">{hexToRgb(data.dominantHex)}</span>
        {data.deltaE <= 10 ? (
          <span className="pill">within tolerance</span>
        ) : (
          <span className="pill" style={{ background: "#F0ECE3", color: "var(--color-ink-3)" }}>outside tolerance</span>
        )}
      </div>
    </div>
  );
}
