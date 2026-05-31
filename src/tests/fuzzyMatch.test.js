import { describe, it, expect } from 'vitest';
import { normalize, artistMatchScore, isAcceptableMatch } from '../pipeline/fuzzyMatch';

describe('normalize', () => {
  it('strips accents', () => expect(normalize('Björk')).toBe('bjork'));
  it('strips leading articles', () => expect(normalize('The Beatles')).toBe('beatles'));
  it('strips punctuation', () => expect(normalize('Jay-Z')).toBe('jay z'));
  it('strips parentheticals', () => expect(normalize('Pink (singer)')).toBe('pink'));
  it('strips feat credits', () => expect(normalize('Drake feat. Rihanna')).toBe('drake'));
  it('handles empty string', () => expect(normalize('')).toBe(''));
});

describe('artistMatchScore', () => {
  it('exact match returns 1.0', () => expect(artistMatchScore('Tame Impala', 'Tame Impala')).toBe(1.0));
  it('accent difference resolves correctly', () => expect(artistMatchScore('Björk', 'Bjork')).toBeGreaterThan(0.9));
  it('article difference resolves correctly', () => expect(artistMatchScore('The Weeknd', 'The Weeknd')).toBe(1.0));
  it('unrelated artists score low', () => expect(artistMatchScore('Radiohead', 'Madonna')).toBeLessThan(0.3));
  it('partial name match scores above 0.6', () => expect(artistMatchScore('Tyler the Creator', 'Tyler, the Creator')).toBeGreaterThan(0.6));
});

describe('isAcceptableMatch', () => {
  it('rejects score below 0.6', () => {
    expect(isAcceptableMatch('Radiohead', { name: 'Madonna', popularity: 80 })).toBe(false);
  });
  it('rejects borderline score with low popularity', () => {
    expect(isAcceptableMatch('Bjork', { name: 'Bjork clone', popularity: 3 })).toBe(false);
  });
  it('accepts clear match', () => {
    expect(isAcceptableMatch('Tame Impala', { name: 'Tame Impala', popularity: 75 })).toBe(true);
  });
});
