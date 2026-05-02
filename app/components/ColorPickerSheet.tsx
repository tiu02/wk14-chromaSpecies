"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface ColorPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onColorPick: (hex: string) => void;
  pickedColor: string | null;
}

const PRESETS = [
  { hex: "#C84B3A", name: "Vermilion" },
  { hex: "#E8A33B", name: "Saffron" },
  { hex: "#D8C45E", name: "Mustard" },
  { hex: "#7AB58C", name: "Sage" },
  { hex: "#3A7A8A", name: "Teal" },
  { hex: "#5C5BA8", name: "Iris" },
  { hex: "#A8688E", name: "Rose Quartz" },
  { hex: "#6E5239", name: "Walnut" },
];

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  let r, g, b;

  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hueToRgb(p, q, hNorm + 1 / 3);
    g = hueToRgb(p, q, hNorm);
    b = hueToRgb(p, q, hNorm - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function EyedropperIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 13.87-.141-.141a2 2 0 0 0-2.828 0L2.172 15.728a2 2 0 1 0 2.828 2.828l1.973-1.973A2 2 0 0 0 6 13.87z" />
      <path d="m13 5 4-4" />
      <path d="M19.854 10.854 21.757 9a2 2 0 0 0-2.828-2.828l-1.858 1.858" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 17 23 23 17 23" />
      <polyline points="1 7 1 1 7 1" />
      <path d="M3.51 6.63A9 9 0 0 0 21 3m0 18a9 9 0 0 0-18.49-2.68" />
    </svg>
  );
}

export default function ColorPickerSheet({ isOpen, onClose, onColorPick, pickedColor }: ColorPickerSheetProps) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(50);
  const [lightness, setLightness] = useState(50);
  const [hexInput, setHexInput] = useState("#7AB58C");
  const [format, setFormat] = useState<"hsl" | "rgb" | "hex">("hex");
  const [mounted, setMounted] = useState(false);

  const planeRef = useRef<HTMLDivElement>(null);
  const hueThumbRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<HTMLDivElement>(null);

  const currentHex = hslToHex(hue, saturation, lightness);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pickedColor) {
      const { h, s, l } = hexToHSL(pickedColor);
      setHue(h);
      setSaturation(s);
      setLightness(l);
      setHexInput(pickedColor.toUpperCase());
    }
  }, [pickedColor, isOpen]);

  // Spacebar shuffle
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
        const { h, s, l } = hexToHSL(preset.hex);
        setHue(h);
        setSaturation(s);
        setLightness(l);
        setHexInput(preset.hex);
        onColorPick(preset.hex);

        // Flash the space key chip
        const spaceChip = document.querySelector("[data-space-chip]");
        if (spaceChip) {
          spaceChip.classList.add("flash");
          setTimeout(() => spaceChip.classList.remove("flash"), 160);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onColorPick]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !focusTrapRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = focusTrapRef.current?.querySelectorAll(
        "button, input, [role=slider], select"
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstEl = focusableElements[0] as HTMLElement;
      const lastEl = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    const focus = focusTrapRef.current;
    focus.addEventListener("keydown", handleTabKey);
    return () => focus.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  // Backdrop close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // HSL plane interaction
  const handlePlanePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!planeRef.current) return;
    const rect = planeRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setSaturation(Math.round(x * 100));
    setLightness(Math.round((1 - y) * 100));

    const handleMove = (moveEvent: PointerEvent) => {
      const moveRect = planeRef.current!.getBoundingClientRect();
      const moveX = Math.max(0, Math.min(1, (moveEvent.clientX - moveRect.left) / moveRect.width));
      const moveY = Math.max(0, Math.min(1, (moveEvent.clientY - moveRect.top) / moveRect.height));

      setSaturation(Math.round(moveX * 100));
      setLightness(Math.round((1 - moveY) * 100));
    };

    const handleUp = () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }, []);

  // HSL plane keyboard
  const handlePlaneKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setLightness((l) => Math.min(100, l + step));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setLightness((l) => Math.max(0, l - step));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSaturation((s) => Math.min(100, s + step));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSaturation((s) => Math.max(0, s - step));
    }
  }, []);

  // Hue strip interaction
  const handleHuePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!hueThumbRef.current?.parentElement) return;
    const rect = hueThumbRef.current.parentElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHue(Math.round(x * 360));

    const handleMove = (moveEvent: PointerEvent) => {
      const moveRect = hueThumbRef.current!.parentElement!.getBoundingClientRect();
      const moveX = Math.max(0, Math.min(1, (moveEvent.clientX - moveRect.left) / moveRect.width));
      setHue(Math.round(moveX * 360));
    };

    const handleUp = () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }, []);

  // Hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    if (!value.startsWith("#")) value = "#" + value;
    value = value.slice(0, 7);
    setHexInput(value);

    if (/^#[0-9A-F]{6}$/.test(value)) {
      const { h, s, l } = hexToHSL(value);
      setHue(h);
      setSaturation(s);
      setLightness(l);
    }
  };


  // RGB values (read-only, for display)
  const getRGBValues = () => {
    const r = parseInt(currentHex.slice(1, 3), 16);
    const g = parseInt(currentHex.slice(3, 5), 16);
    const b = parseInt(currentHex.slice(5, 7), 16);
    return { r, g, b };
  };

  const { r, g, b } = getRGBValues();

  // Eyedropper support
  const supportsEyedropper = typeof window !== "undefined" && "EyeDropper" in window;

  const handleEyedropper = async () => {
    if (!supportsEyedropper) return;
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        const hex = result.sRGBHex.toUpperCase();
        const { h, s, l } = hexToHSL(hex);
        setHue(h);
        setSaturation(s);
        setLightness(l);
        setHexInput(hex);
        onColorPick(hex);
      }
    } catch (err) {
      console.error("Eyedropper cancelled or not supported");
    }
  };

  const sheet = isOpen && mounted ? (
    createPortal(
      <div
        className="fixed inset-0 z-50 flex items-end"
        onClick={handleBackdropClick}
        style={{
          background: "rgba(25, 22, 19, 0.18)",
          animation: "fadeIn 240ms ease-out",
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .sheet-content {
            animation: slideUp 320ms cubic-bezier(0.22, 1, 0.36, 1);
          }
          @media (prefers-reduced-motion: reduce) {
            .sheet-content {
              animation: none;
            }
          }
          [data-space-chip].flash {
            background: var(--color-ink);
            color: var(--color-canvas);
            transition: none;
          }
        `}</style>

        <div
          className="sheet-content w-full rounded-t-[22px] bg-surface pt-6 pb-[env(safe-area-inset-bottom)] px-5 shadow-lg max-h-[90vh] overflow-y-auto"
          style={{
            boxShadow: "0 -1px 0 #E7E3D9, 0 -2px 6px rgba(25,22,19,0.04), 0 -30px 60px -30px rgba(25,22,19,0.18)",
            overscrollBehavior: "contain",
          }}
          ref={focusTrapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 id="sheet-title" className="text-[20px] font-semibold tracking-tight text-ink">
              {pickedColor ? "Edit color" : "Pick a color"}
            </h2>
            <div className="flex items-center gap-1">
              {supportsEyedropper && (
                <button
                  type="button"
                  onClick={handleEyedropper}
                  aria-label="Pick color from screen"
                  className="p-2.5 text-ink hover:bg-surface-2 rounded-md transition-colors 120ms ease"
                  style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <EyedropperIcon />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
                  const { h, s, l } = hexToHSL(preset.hex);
                  setHue(h);
                  setSaturation(s);
                  setLightness(l);
                  setHexInput(preset.hex);
                  onColorPick(preset.hex);
                }}
                aria-label="Shuffle to random preset"
                className="p-2.5 text-ink hover:bg-surface-2 rounded-md transition-colors 120ms ease relative"
                style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ShuffleIcon />
                <span className="absolute bottom-1.5 right-1.5 text-[10px] bg-field rounded px-1 py-0.5 text-ink-3">
                  space
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close color picker"
                className="p-2.5 text-ink hover:bg-surface-2 rounded-md transition-colors 120ms ease"
                style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <XIcon />
              </button>
            </div>
          </div>

          {/* Hex input */}
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            className="field w-full px-4 py-3 mono text-[18px] tracking-[0.04em] text-ink mb-5 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            placeholder="#XXXXXX"
            autoComplete="off"
            translate="no"
          />

          {/* Hex preview swatch (inline, right of input) */}
          <div className="mb-5 flex gap-3 items-center">
            <div
              className="w-7 h-7 rounded-md flex-shrink-0"
              style={{
                background: currentHex,
                boxShadow: "inset 0 0 0 1px rgba(25,22,19,0.10)",
              }}
            />
            <span className="mono text-[14px] text-ink-2">{currentHex}</span>
          </div>

          {/* HSL saturation/lightness plane */}
          <div
            ref={planeRef}
            onPointerDown={handlePlanePointerDown}
            role="slider"
            aria-label="Color saturation and lightness"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={saturation}
            aria-valuetext={`Saturation ${saturation}%, Lightness ${lightness}%`}
            tabIndex={0}
            onKeyDown={handlePlaneKeyDown}
            className="mb-5 h-[180px] rounded-lg cursor-crosshair relative outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            style={{
              background: `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`,
            }}
          >
            {/* Cursor */}
            <div
              className="absolute w-5 h-5 rounded-full border-2 border-white pointer-events-none"
              style={{
                left: `${saturation}%`,
                top: `${100 - lightness}%`,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 0 2px rgba(25,22,19,0.2)",
              }}
            />
          </div>

          {/* Hue strip */}
          <div
            ref={hueThumbRef}
            onPointerDown={handleHuePointerDown}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={hue}
            aria-label="Hue"
            className="mb-5 h-3 rounded-md relative cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            style={{
              background: "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))",
            }}
          >
            {/* Thumb */}
            <div
              className="absolute top-1/2 w-5 h-5 rounded-full bg-white pointer-events-none"
              style={{
                left: `${(hue / 360) * 100}%`,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 0 2px rgba(25,22,19,0.2)",
              }}
            />
          </div>

          {/* Format dropdown + RGB display */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "hsl" | "rgb" | "hex")}
              className="field px-4 py-3 mono text-[13px] text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <option value="hex">HEX</option>
              <option value="hsl">HSL</option>
              <option value="rgb">RGB</option>
            </select>

            {format === "rgb" && (
              <>
                <div className="field px-4 py-3 mono text-[13px] text-ink text-center">
                  {r}
                </div>
                <div className="field px-4 py-3 mono text-[13px] text-ink text-center">
                  {g}
                </div>
                <div className="field px-4 py-3 mono text-[13px] text-ink text-center">
                  {b}
                </div>
              </>
            )}

            {format === "hsl" && (
              <>
                <div className="field px-4 py-3 mono text-[13px] text-ink text-center">
                  {hue}°
                </div>
                <div className="field px-4 py-3 mono text-[13px] text-ink text-center">
                  {saturation}%
                </div>
                <div className="field px-4 py-3 mono text-[13px] text-ink text-center">
                  {lightness}%
                </div>
              </>
            )}

            {format === "hex" && (
              <>
                <div className="field px-4 py-3 mono text-[13px] text-ink text-center" translate="no">
                  {currentHex}
                </div>
                <div className="field px-4 py-3 mono text-[13px] text-ink-3 text-center">
                  —
                </div>
                <div className="field px-4 py-3 mono text-[13px] text-ink-3 text-center">
                  —
                </div>
              </>
            )}
          </div>

          {/* Helper text */}
          <div className="mono text-[11px] text-ink-3 text-center mb-6">
            {pickedColor ? "Edit & click Match to find specimens" : "Pick a color to enable match · ΔE returns once specimens are found"}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 px-5 py-3 mono text-[13px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onColorPick(currentHex);
                onClose();
              }}
              className="btn-primary flex-1 px-5 py-3 mono text-[13px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Use this color
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  ) : null;

  return sheet;
}
