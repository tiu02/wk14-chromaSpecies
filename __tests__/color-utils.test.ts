import { describe, it, expect } from 'vitest';
import { hexToHSL, hslToHex, hslToHSB, hexToRgb } from '../app/lib/color-utils';

describe('hexToHSL', () => {
  it('converts pure red', () => {
    expect(hexToHSL('#FF0000')).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts pure green', () => {
    expect(hexToHSL('#00FF00')).toEqual({ h: 120, s: 100, l: 50 });
  });

  it('converts pure blue', () => {
    expect(hexToHSL('#0000FF')).toEqual({ h: 240, s: 100, l: 50 });
  });

  it('converts white (achromatic max)', () => {
    expect(hexToHSL('#FFFFFF')).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converts black (achromatic min)', () => {
    expect(hexToHSL('#000000')).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('converts the default gray #A8A39A', () => {
    expect(hexToHSL('#A8A39A')).toEqual({ h: 39, s: 7, l: 63 });
  });
});

describe('hslToHex', () => {
  it('converts pure red', () => {
    expect(hslToHex(0, 100, 50)).toBe('#FF0000');
  });

  it('converts white', () => {
    expect(hslToHex(0, 0, 100)).toBe('#FFFFFF');
  });

  it('converts black', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000');
  });

  it('round-trips through hexToHSL', () => {
    const original = '#4A8BBE';
    const { h, s, l } = hexToHSL(original);
    // Round-trip may shift by ±1 due to integer rounding
    const result = hslToHex(h, s, l);
    const { h: h2, s: s2, l: l2 } = hexToHSL(result);
    expect(Math.abs(h2 - h)).toBeLessThanOrEqual(1);
    expect(Math.abs(s2 - s)).toBeLessThanOrEqual(1);
    expect(Math.abs(l2 - l)).toBeLessThanOrEqual(1);
  });
});

describe('hslToHSB', () => {
  it('converts pure red (HSL 0,100,50) → HSB 0,100,100', () => {
    expect(hslToHSB(0, 100, 50)).toEqual({ h: 0, s: 100, b: 100 });
  });

  it('converts white (HSL 0,0,100) → HSB 0,0,100', () => {
    expect(hslToHSB(0, 0, 100)).toEqual({ h: 0, s: 0, b: 100 });
  });

  it('converts black (HSL 0,0,0) → HSB 0,0,0', () => {
    expect(hslToHSB(0, 0, 0)).toEqual({ h: 0, s: 0, b: 0 });
  });

  it('preserves hue value unchanged', () => {
    expect(hslToHSB(210, 60, 40).h).toBe(210);
  });
});

describe('hexToRgb', () => {
  it('converts pure red', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('converts pure blue', () => {
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('converts white', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('converts a mid-tone', () => {
    expect(hexToRgb('#A8A39A')).toEqual({ r: 168, g: 163, b: 154 });
  });
});
