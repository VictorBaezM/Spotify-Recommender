import { describe, it, expect } from 'vitest';
import { aggregateSimilarArtists } from '../pipeline/aggregate';

describe('aggregateSimilarArtists', () => {
  it('removes user top artists from candidates', () => {
    const map = new Map([
      ['Artist A', [{ name: 'Artist A', match: '0.9' }, { name: 'New Artist', match: '0.8' }]]
    ]);
    const result = aggregateSimilarArtists(['Artist A'], map);
    expect(result.find(a => a.name === 'Artist A')).toBeUndefined();
    expect(result.find(a => a.name === 'New Artist')).toBeDefined();
  });

  it('keeps highest score when same artist appears from multiple seeds', () => {
    const map = new Map([
      ['Seed 1', [{ name: 'Overlap Artist', match: '0.6' }]],
      ['Seed 2', [{ name: 'Overlap Artist', match: '0.9' }]],
    ]);
    const result = aggregateSimilarArtists(['Seed 1', 'Seed 2'], map);
    expect(result[0].score).toBe(0.9);
  });

  it('filters artists below 0.5 similarity threshold', () => {
    const map = new Map([
      ['Seed', [{ name: 'Weak Match', match: '0.3' }]]
    ]);
    const result = aggregateSimilarArtists(['Seed'], map);
    expect(result).toHaveLength(0);
  });

  it('returns max 40 candidates', () => {
    const similar = Array.from({ length: 60 }, (_, i) => ({ name: `Artist ${i}`, match: '0.8' }));
    const map = new Map([['Seed', similar]]);
    const result = aggregateSimilarArtists(['Seed'], map);
    expect(result.length).toBeLessThanOrEqual(40);
  });
});
