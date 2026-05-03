import { describe, it, expect } from 'vitest';
import { validateDeltaE, type SpecimenData } from '../app/lib/color-utils';

const makeSpecimen = (dominantHex: string): SpecimenData => ({
  commonName: 'Test',
  scientificName: 'Test species',
  family: 'Testaceae',
  description: 'A test specimen.',
  funFact: 'It is used in tests.',
  dominantHex,
  deltaE: 0,
  wikiTitle: 'Test',
});

describe('validateDeltaE', () => {
  it('returns valid when both specimens are within threshold (ΔE ≤ 10)', () => {
    // #C34039 and #C94038 are close to #C04040 — well within ΔE 10
    const result = validateDeltaE(
      '#C04040',
      makeSpecimen('#C34039'),
      makeSpecimen('#C94038'),
    );
    expect(result.valid).toBe(true);
    expect(result.bDE).toBeLessThanOrEqual(10);
    expect(result.zDE).toBeLessThanOrEqual(10);
  });

  it('returns invalid when botanical exceeds threshold', () => {
    // #0000FF (blue) vs #C04040 (red) — very far apart
    const result = validateDeltaE(
      '#C04040',
      makeSpecimen('#0000FF'),
      makeSpecimen('#C94038'),
    );
    expect(result.valid).toBe(false);
    expect(result.bDE).toBeGreaterThan(10);
    expect(result.zDE).toBeLessThanOrEqual(10);
  });

  it('returns invalid when zoological exceeds threshold', () => {
    const result = validateDeltaE(
      '#C04040',
      makeSpecimen('#C34039'),
      makeSpecimen('#00FF00'),
    );
    expect(result.valid).toBe(false);
    expect(result.bDE).toBeLessThanOrEqual(10);
    expect(result.zDE).toBeGreaterThan(10);
  });

  it('returns invalid when both specimens exceed threshold', () => {
    const result = validateDeltaE(
      '#C04040',
      makeSpecimen('#0000FF'),
      makeSpecimen('#00FF00'),
    );
    expect(result.valid).toBe(false);
    expect(result.bDE).toBeGreaterThan(10);
    expect(result.zDE).toBeGreaterThan(10);
  });

  it('returns valid for an exact match (ΔE = 0)', () => {
    const result = validateDeltaE(
      '#A8A39A',
      makeSpecimen('#A8A39A'),
      makeSpecimen('#A8A39A'),
    );
    expect(result.valid).toBe(true);
    expect(result.bDE).toBe(0);
    expect(result.zDE).toBe(0);
  });
});
