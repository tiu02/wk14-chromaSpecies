"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Shuffle, Pipette, ChevronDown, X } from "lucide-react";
import { COLOR_PRESETS } from "../lib/presets";
import { hexToHSL, hslToHex, hslToHSB, hexToRgb } from "../lib/color-utils";

export interface ColorPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onColorPick: (hex: string) => void;
  onMatch: (hex: string) => void;
  pickedColor: string | null;
}


const FORMATS = ["RGB", "HSL", "HSB"] as const;
type Format = typeof FORMATS[number];

const DEFAULT_GRAY = "#A8A39A";


const GRAY_HSL = hexToHSL(DEFAULT_GRAY);

export default function ColorPickerSheet({ isOpen, onClose, onColorPick, onMatch, pickedColor }: ColorPickerSheetProps) {
  const [hue, setHue] = useState(GRAY_HSL.h);
  const [saturation, setSaturation] = useState(GRAY_HSL.s);
  const [lightness, setLightness] = useState(GRAY_HSL.l);
  const [hexInput, setHexInput] = useState(DEFAULT_GRAY);
  const [format, setFormat] = useState<Format>("RGB");
  const [formatOpen, setFormatOpen] = useState(false);
  const [flashSpace, setFlashSpace] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [willChange, setWillChange] = useState(false);

  const planeRef = useRef<HTMLDivElement>(null);
  const hueTrackRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<HTMLDivElement>(null);
  const formatDropRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const hasBeenOpenedRef = useRef(false);

  const currentHex = hexInput.length === 7 && /^#[0-9A-F]{6}$/i.test(hexInput)
    ? hexInput.toUpperCase()
    : hslToHex(hue, saturation, lightness);

  const rgb = hexToRgb(currentHex);
  const hsb = hslToHSB(hue, saturation, lightness);

  useEffect(() => { setMounted(true); }, []);

  // Sync from pickedColor (or reset to gray) when sheet opens
  useEffect(() => {
    if (isOpen) {
      hasBeenOpenedRef.current = true;
      const source = pickedColor ?? DEFAULT_GRAY;
      const { h, s, l } = hexToHSL(source);
      setHue(h); setSaturation(s); setLightness(l);
      setHexInput(source.toUpperCase());
      openerRef.current = document.activeElement as HTMLElement;
      setPulseKey(k => k + 1);
      setWillChange(true);
    }
  }, [isOpen, pickedColor]);

  // Return focus on close; trigger will-change for exit transition
  useEffect(() => {
    if (!isOpen) {
      if (hasBeenOpenedRef.current) setWillChange(true);
      if (openerRef.current) {
        openerRef.current.focus();
        openerRef.current = null;
      }
    }
  }, [isOpen]);

  // Click outside to close format dropdown
  useEffect(() => {
    if (!formatOpen) return;
    const handler = (e: MouseEvent) => {
      if (formatDropRef.current && !formatDropRef.current.contains(e.target as Node)) {
        setFormatOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [formatOpen]);

  // Keyboard: Escape + Spacebar shuffle
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (formatOpen) { setFormatOpen(false); return; }
        onClose();
        return;
      }
      if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        const preset = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
        const { h, s, l } = hexToHSL(preset.hex);
        setHue(h); setSaturation(s); setLightness(l);
        setHexInput(preset.hex.toUpperCase());
        onColorPick(preset.hex);
        setFlashSpace(true);
        setTimeout(() => setFlashSpace(false), 160);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, onColorPick, formatOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !focusTrapRef.current) return;
    const el = focusTrapRef.current;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = el.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input, [tabindex='0']"
      );
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    el.addEventListener("keydown", onTab);
    return () => el.removeEventListener("keydown", onTab);
  }, [isOpen]);

  // HSL plane drag
  const handlePlaneDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!planeRef.current) return;
    const update = (cx: number, cy: number) => {
      const rect = planeRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (cy - rect.top) / rect.height));
      setSaturation(Math.round(x * 100));
      setLightness(Math.round((1 - y) * 100));
      setHexInput("");
    };
    update(e.clientX, e.clientY);
    const onMove = (me: PointerEvent) => update(me.clientX, me.clientY);
    const onUp = () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp); };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, []);

  const handlePlaneKey = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowRight") { e.preventDefault(); setSaturation(s => Math.min(100, s + step)); setHexInput(""); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); setSaturation(s => Math.max(0,   s - step)); setHexInput(""); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setLightness(l =>  Math.min(100, l + step)); setHexInput(""); }
    if (e.key === "ArrowDown")  { e.preventDefault(); setLightness(l =>  Math.max(0,   l - step)); setHexInput(""); }
  }, []);

  // Hue strip drag
  const handleHueDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!hueTrackRef.current) return;
    const update = (cx: number) => {
      const rect = hueTrackRef.current!.getBoundingClientRect();
      setHue(Math.round(Math.max(0, Math.min(1, (cx - rect.left) / rect.width)) * 360));
      setHexInput("");
    };
    update(e.clientX);
    const onMove = (me: PointerEvent) => update(me.clientX);
    const onUp = () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerup", onUp); };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, []);

  // Hex input
  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 6);
    setHexInput("#" + val);
    if (val.length === 6) {
      const { h, s, l } = hexToHSL("#" + val);
      setHue(h); setSaturation(s); setLightness(l);
    }
  };

  const handleEyedropper = async () => {
    if (!("EyeDropper" in window)) return;
    try {
      const result = await (new (window as any).EyeDropper()).open();
      if (result?.sRGBHex) {
        const hex = result.sRGBHex.toUpperCase();
        const { h, s, l } = hexToHSL(hex);
        setHue(h); setSaturation(s); setLightness(l);
        setHexInput(hex);
        onColorPick(hex);
      }
    } catch {}
  };

  const handleShuffle = () => {
    const preset = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
    const { h, s, l } = hexToHSL(preset.hex);
    setHue(h); setSaturation(s); setLightness(l);
    setHexInput(preset.hex.toUpperCase());
    onColorPick(preset.hex);
    setFlashSpace(true);
    setTimeout(() => setFlashSpace(false), 160);
  };

  const handleMatch = () => {
    onColorPick(currentHex);
    onMatch(currentHex);
    onClose();
  };

  const supportsEyedropper = mounted && "EyeDropper" in window;

  const sheet = mounted ? createPortal(
    <>
      {/* Backdrop */}
      <div
        className="sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(25,22,19,0.18)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: `opacity ${isOpen ? "240ms" : "160ms"} ease-out`,
        }}
      />

      {/* Sheet */}
      <aside
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="sheet-panel"
        onTransitionEnd={() => setWillChange(false)}
        style={{
          position: "fixed", insetInline: 0, bottom: 0, zIndex: 50,
          background: "#FFFFFF",
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          boxShadow: "0 -1px 0 #E7E3D9, 0 -2px 6px rgba(25,22,19,0.04), 0 -30px 60px -30px rgba(25,22,19,0.18)",
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: `transform ${isOpen ? "320ms cubic-bezier(0.22,1,0.36,1)" : "200ms cubic-bezier(0.22,1,0.36,1)"}`,
          willChange: willChange ? "transform" : "auto",
          overscrollBehavior: "contain",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Grabber */}
        <div style={{ width: 44, height: 4, borderRadius: 4, background: "#D9D4CA", margin: "8px auto 0" }} />

        {/* Inner content */}
        <div className="max-w-330 mx-auto px-4 sm:px-6 lg:px-10 pt-4 pb-6">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-y-2 mb-5">
            <div className="flex items-center gap-3">
              <h3 id="sheet-title" className="text-[20px] font-semibold tracking-tight text-ink">
                {pickedColor ? "Edit color" : "Pick a color"}
              </h3>
              <span className="pill">{pickedColor ? "Editing" : "Empty"}</span>
            </div>
            <div className="flex items-center gap-2">
              {supportsEyedropper && (
                <button
                  type="button"
                  onClick={handleEyedropper}
                  className="btn-secondary btn-icon min-w-11 min-h-11 px-2.5 mono text-[11px] flex items-center justify-center gap-1.5"
                  aria-label="Pick color from screen"
                >
                  <Pipette size={13} aria-hidden="true" />
                  Pick
                </button>
              )}
              <button
                type="button"
                onClick={handleShuffle}
                className="btn-secondary btn-icon min-w-11 min-h-11 px-2.5 mono text-[11px] flex items-center justify-center gap-1.5"
                aria-label="Shuffle to random preset"
              >
                <Shuffle size={13} aria-hidden="true" />
                Shuffle
                <kbd
                  className="mono text-[10px] px-1 py-0.5 ml-0.5 rounded"
                  style={{
                    background: flashSpace ? "#191613" : "#ECE7DA",
                    color: flashSpace ? "#FAF7F2" : "inherit",
                    transition: flashSpace ? "none" : "background 160ms, color 160ms",
                  }}
                >
                  space
                </kbd>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary btn-icon min-w-11 min-h-11 flex items-center justify-center"
                aria-label="Close color picker"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Hex field — label inside */}
          <div className="relative field hex-field-wrapper px-4 py-3 mb-4">
            <div className="label mb-1">Hex</div>
            <div className="flex items-center gap-1.5 pr-14">
              <span className="mono text-[15px]" style={{ color: "#6B6557" }}>#</span>
              <input
                type="text"
                value={hexInput.replace("#", "")}
                onChange={handleHexInput}
                placeholder="A8A39A"
                maxLength={6}
                autoComplete="off"
                translate="no"
                className="flex-1 bg-transparent mono text-[18px] tracking-[0.04em] text-ink outline-none uppercase"
                style={{ caretColor: "#191613" }}
              />
            </div>
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-md ring-dim"
              aria-hidden="true"
              style={{ background: currentHex }}
            />
          </div>

          {/* HSL plane */}
          <div className="mb-3">
            <div
              ref={planeRef}
              onPointerDown={handlePlaneDown}
              onKeyDown={handlePlaneKey}
              role="slider"
              aria-label="Color saturation and lightness"
              aria-valuetext={`Saturation ${saturation}%, Lightness ${lightness}%`}
              tabIndex={0}
              className="relative h-45 rounded-lg overflow-hidden cursor-crosshair outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 68%, 50%))`,
                boxShadow: "inset 0 0 0 1px rgba(25,22,19,0.08)",
              }}
            >
              <div
                className="absolute w-5 h-5 rounded-full border-2 border-white pointer-events-none"
                style={{
                  left: `${saturation}%`,
                  top: `${100 - lightness}%`,
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          </div>

          {/* Hue strip */}
          <div className="mb-5">
            <div
              ref={hueTrackRef}
              onPointerDown={handleHueDown}
              role="slider"
              aria-label="Hue"
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={hue}
              tabIndex={0}
              className="relative h-3 rounded-md cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
              style={{
                background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
                boxShadow: "inset 0 0 0 1px rgba(25,22,19,0.08)",
              }}
            >
              <div
                className="absolute top-1/2 w-5 h-5 rounded-full bg-white pointer-events-none"
                style={{
                  left: `${(hue / 360) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {!pickedColor && (
                  <span className="hue-pulse-ring" key={pulseKey} aria-hidden="true" />
                )}
              </div>
            </div>
          </div>

          {/* Format dropdown */}
          <div className="relative mb-3" ref={formatDropRef}>
            <button
              type="button"
              onClick={() => setFormatOpen(f => !f)}
              className="field w-full flex items-center justify-between px-4 py-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
              aria-haspopup="listbox"
              aria-expanded={formatOpen}
              aria-label={`Color format: ${format}`}
            >
              <div className="text-left">
                <div className="label mb-0.5">Format</div>
                <div className="mono text-[14px] text-ink">{format}</div>
              </div>
              <ChevronDown
                size={14}
                style={{
                  color: "#6B6557",
                  transform: formatOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
                aria-hidden="true"
              />
            </button>

            {formatOpen && (
              <div
                role="listbox"
                aria-label="Color format"
                onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setFormatOpen(false); } }}
                className="absolute left-0 right-0 top-full mt-1 z-10 rounded-[8px] overflow-hidden"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E7E3D9",
                  boxShadow: "0 4px 16px -4px rgba(25,22,19,0.12), 0 1px 3px rgba(25,22,19,0.06)",
                }}
              >
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    role="option"
                    aria-selected={format === f}
                    type="button"
                    onClick={() => { setFormat(f); setFormatOpen(false); }}
                    className="format-option"
                    style={{
                      background: format === f ? "#ECE7DA" : "transparent",
                      color: format === f ? "#191613" : "#4A463F",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Channel display */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {format === "RGB" && (
              <>
                {(["Red", "Green", "Blue"] as const).map((ch, i) => (
                  <div key={ch} className="field px-4 py-3">
                    <div className="label mb-0.5">{ch}</div>
                    <div className="mono text-[15px] text-ink" translate="no">
                      {[rgb.r, rgb.g, rgb.b][i]}
                    </div>
                  </div>
                ))}
              </>
            )}
            {format === "HSL" && (
              <>
                {(["Hue", "Sat", "Light"] as const).map((ch, i) => (
                  <div key={ch} className="field px-4 py-3">
                    <div className="label mb-0.5">{ch}</div>
                    <div className="mono text-[15px] text-ink" translate="no">
                      {`${[hue, saturation, lightness][i]}${i === 0 ? "°" : "%"}`}
                    </div>
                  </div>
                ))}
              </>
            )}
            {format === "HSB" && (
              <>
                {(["Hue", "Sat", "Bright"] as const).map((ch, i) => (
                  <div key={ch} className="field px-4 py-3">
                    <div className="label mb-0.5">{ch}</div>
                    <div className="mono text-[15px] text-ink" translate="no">
                      {`${[hsb.h, hsb.s, hsb.b][i]}${i === 0 ? "°" : "%"}`}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-[15px] font-medium py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMatch}
              className="btn-primary text-[15px] font-medium py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-surface focus-visible:ring-offset-2"
            >
              Match specimens
            </button>
          </div>
          <div className="mt-2 mono text-[11px] text-center" style={{ color: "#6B6557" }}>
            Click Match to find the closest botanical and zoological specimens
          </div>

        </div>
      </aside>
    </>,
    document.body
  ) : null;

  return sheet;
}
