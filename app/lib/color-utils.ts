import chroma from 'chroma-js';

const DELTA_E_THRESHOLD = 10;

export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1; if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToHex(h: number, s: number, l: number): string {
  const hN = h / 360, sN = s / 100, lN = l / 100;
  let r, g, b;
  if (sN === 0) { r = g = b = lN; } else {
    const q = lN < 0.5 ? lN * (1 + sN) : lN + sN - lN * sN;
    const p = 2 * lN - q;
    r = hue2rgb(p, q, hN + 1 / 3);
    g = hue2rgb(p, q, hN);
    b = hue2rgb(p, q, hN - 1 / 3);
  }
  const toH = (x: number) => { const h = Math.round(x * 255).toString(16); return h.length === 1 ? '0' + h : h; };
  return `#${toH(r)}${toH(g)}${toH(b)}`.toUpperCase();
}

export function hslToHSB(h: number, s: number, l: number): { h: number; s: number; b: number } {
  const lN = l / 100;
  const sN = s / 100;
  const v = lN + sN * Math.min(lN, 1 - lN);
  const sv = v === 0 ? 0 : 2 * (1 - lN / v);
  return { h, s: Math.round(sv * 100), b: Math.round(v * 100) };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export interface SpecimenData {
  commonName: string;
  scientificName: string;
  family: string;
  description: string;
  funFact: string;
  dominantHex: string;
  deltaE: number;
  wikiTitle: string;
}

export function validateDeltaE(
  targetHex: string,
  botanical: SpecimenData,
  zoological: SpecimenData,
): { valid: boolean; bDE: number; zDE: number } {
  const bDE = chroma.deltaE(targetHex, botanical.dominantHex);
  const zDE = chroma.deltaE(targetHex, zoological.dominantHex);
  return { valid: bDE <= DELTA_E_THRESHOLD && zDE <= DELTA_E_THRESHOLD, bDE, zDE };
}
