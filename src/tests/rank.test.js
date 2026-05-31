import { describe, it, expect } from 'vitest';
import { scoreTrack, rankTracks } from '../pipeline/rank';

describe('scoreTrack', () => {
  it('weights similarity at 70%', () => {
    expect(scoreTrack({ popularity: 0 }, 1.0)).toBeCloseTo(0.7);
  });
  it('weights popularity at 30%', () => {
    expect(scoreTrack({ popularity: 100 }, 0)).toBeCloseTo(0.3);
  });
  it('handles missing popularity gracefully', () => {
    expect(() => scoreTrack({}, 0.8)).not.toThrow();
  });
});

describe('rankTracks', () => {
  it('sorts by score descending', () => {
    const tracks = [
      { id: '1', _score: 0.4 },
      { id: '2', _score: 0.9 },
      { id: '3', _score: 0.6 },
    ];
    const ranked = rankTracks(tracks, 3);
    expect(ranked[0].id).toBe('2');
    expect(ranked[1].id).toBe('3');
  });

  it('respects limit', () => {
    const tracks = Array.from({ length: 50 }, (_, i) => ({ id: String(i), _score: Math.random() }));
    expect(rankTracks(tracks, 25)).toHaveLength(25);
  });
});
