import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SpecimenCard, { type SpecimenData } from '../app/components/SpecimenCard';

const baseData: SpecimenData = {
  commonName: 'Vermilion Flycatcher',
  scientificName: 'Pyrocephalus rubinus',
  family: 'Tyrannidae',
  description: 'A small passerine of open scrublands.',
  funFact: 'The coloration is carotenoid-based.',
  dominantHex: '#C94038',
  deltaE: 2.1,
  wikiTitle: 'Vermilion flycatcher',
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/test.jpg',
};

describe('SpecimenCard', () => {
  it('renders the common name', () => {
    render(<SpecimenCard type="zoological" data={baseData} index={0} />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Vermilion Flycatcher');
  });

  it('displays the ΔE pill with the correct value', () => {
    render(<SpecimenCard type="zoological" data={baseData} index={0} />);
    expect(screen.getByText(/ΔE 2\.1/)).toBeDefined();
  });

  it('shows "within tolerance" pill when deltaE ≤ 10', () => {
    render(<SpecimenCard type="zoological" data={{ ...baseData, deltaE: 9.9 }} index={0} />);
    expect(screen.getByText('within tolerance')).toBeDefined();
  });

  it('shows "outside tolerance" pill when deltaE > 10', () => {
    render(<SpecimenCard type="zoological" data={{ ...baseData, deltaE: 14.3 }} index={0} />);
    expect(screen.getByText('outside tolerance')).toBeDefined();
  });

  it('shows specimen image when imageUrl is provided', () => {
    render(<SpecimenCard type="botanical" data={baseData} index={1} />);
    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect((img as HTMLImageElement).src).toContain('wikimedia');
  });

  it('shows fallback when imageUrl is null', () => {
    render(<SpecimenCard type="botanical" data={{ ...baseData, imageUrl: null }} index={0} />);
    expect(screen.getByText('No image available')).toBeDefined();
  });

  it('labels as Botanical for type="botanical"', () => {
    render(<SpecimenCard type="botanical" data={baseData} index={0} />);
    expect(screen.getByText(/Botanical/)).toBeDefined();
  });

  it('labels as Zoological for type="zoological"', () => {
    render(<SpecimenCard type="zoological" data={baseData} index={1} />);
    expect(screen.getByText(/Zoological/)).toBeDefined();
  });

  it('shows "within tolerance" pill at the exact boundary (deltaE = 10)', () => {
    render(<SpecimenCard type="zoological" data={{ ...baseData, deltaE: 10 }} index={0} />);
    expect(screen.getByText('within tolerance')).toBeDefined();
    expect(screen.queryByText('outside tolerance')).toBeNull();
  });

  it('generates fallback card ID for index >= 2', () => {
    render(<SpecimenCard type="botanical" data={baseData} index={2} />);
    expect(screen.getByText(/0247\.C/)).toBeDefined();
  });
});
