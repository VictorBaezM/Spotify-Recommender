import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePipeline } from '../hooks/usePipeline';
import * as spotifyApi from '../api/spotify';
import * as lastfmApi from '../api/lastfm';

// Mock the config module
vi.mock('../config', () => ({
  SPOTIFY_CLIENT_ID: 'mock-client-id',
  REDIRECT_URI: 'http://localhost:5173/callback',
  LASTFM_API_KEY: 'mock-lastfm-key',
  SCOPES: 'user-top-read user-library-read user-read-recently-played',
}));

// Mock the API modules
vi.mock('../api/spotify');
vi.mock('../api/lastfm');

describe('Full pipeline integration', () => {
  let tokenRef;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenRef = { current: { access_token: 'mock-token', refresh_token: 'mock-refresh', expires_at: Date.now() + 3600000 } };

    spotifyApi.getTopArtists.mockResolvedValue([
      { id: 'a1', name: 'Tame Impala', popularity: 80 }
    ]);
    lastfmApi.getSimilarArtists.mockImplementation(async (artistName) => {
      if (artistName === 'MGMT') {
        return [{ name: 'Tame Impala', match: '0.85' }];
      }
      if (artistName === 'Beach House') {
        return [{ name: 'Tame Impala', match: '0.78' }];
      }
      return [
        { name: 'MGMT', match: '0.85' },
        { name: 'Beach House', match: '0.78' },
      ];
    });
    spotifyApi.searchArtist.mockImplementation(async (name) => {
      const clean = name.toLowerCase().trim();
      if (clean === 'mgmt') {
        return [{ id: 'b1', name: 'MGMT', popularity: 70 }];
      }
      if (clean === 'beach house') {
        return [{ id: 'b2', name: 'Beach House', popularity: 65 }];
      }
      if (clean === 'tame impala') {
        return [{ id: 'a1', name: 'Tame Impala', popularity: 80 }];
      }
      return [];
    });
    spotifyApi.getArtistTracksViaSearch.mockImplementation(async (name) => {
      if (name === 'MGMT') {
        return [{ id: 't1', name: 'Electric Feel', popularity: 85, artists: [{ name: 'MGMT' }] }];
      }
      if (name === 'Beach House') {
        return [{ id: 't2', name: 'Space Song', popularity: 80, artists: [{ name: 'Beach House' }] }];
      }
      if (name === 'Tame Impala') {
        return [{ id: 't3', name: 'The Less I Know The Better', popularity: 90, artists: [{ name: 'Tame Impala' }] }];
      }
      return [];
    });
    spotifyApi.getTracksDetails.mockImplementation(async (ids) => {
      return ids.map(id => {
        if (id === 't1') return { id: 't1', name: 'Electric Feel', popularity: 85, artists: [{ name: 'MGMT' }] };
        if (id === 't2') return { id: 't2', name: 'Space Song', popularity: 80, artists: [{ name: 'Beach House' }] };
        if (id === 't3') return { id: 't3', name: 'The Less I Know The Better', popularity: 90, artists: [{ name: 'Tame Impala' }] };
        return null;
      });
    });
    spotifyApi.getTopTracks.mockResolvedValue([]);
    spotifyApi.getRecentlyPlayed.mockResolvedValue([]);
    spotifyApi.getSavedTracks.mockResolvedValue([]);
  });

  it('produces recommendations from mocked data', async () => {
    const { result } = renderHook(() => usePipeline(tokenRef));

    // Run the pipeline
    await act(async () => {
      await result.current.run('medium_term');
    });

    // Check outputs
    expect(result.current.error).toBeNull();
    expect(result.current.recommendations).toHaveLength(2);
    expect(result.current.recommendations[0].id).toBe('t1'); // MGMT co-listening matches 0.85, higher than Beach House 0.78
    expect(result.current.recommendations[1].id).toBe('t2');
  });

  it('filters out heard tracks from recommendations', async () => {
    // Mock that we have already heard MGMT's 'Electric Feel' (t1)
    spotifyApi.getTopTracks.mockResolvedValue([
      { id: 't1', name: 'Electric Feel', popularity: 85, artists: [{ name: 'MGMT' }] }
    ]);

    const { result } = renderHook(() => usePipeline(tokenRef));

    // Run the pipeline
    await act(async () => {
      await result.current.run('medium_term');
    });

    // Verify MGMT track (t1) was filtered, only Beach House (t2) remains
    expect(result.current.error).toBeNull();
    expect(result.current.recommendations).toHaveLength(1);
    expect(result.current.recommendations[0].id).toBe('t2');
  });

  it('automatically cycles to next time range when current range returns no candidates', async () => {
    // Top artists returns nothing for medium_term (first call), but returns MGMT for long_term (second call)
    spotifyApi.getTopArtists
      .mockResolvedValueOnce([]) // medium_term
      .mockResolvedValueOnce([{ id: 'a1', name: 'Tame Impala', popularity: 80 }]); // long_term fallback

    const { result } = renderHook(() => usePipeline(tokenRef));

    await act(async () => {
      await result.current.run('medium_term');
    });

    // Verify it automatically cycled to long_term, succeeded, and added a warning notice!
    expect(result.current.error).toBeNull();
    expect(result.current.warnings.some(w => w.includes('No listening history in Medium Term'))).toBe(true);
    expect(result.current.recommendations).toHaveLength(2);
  });

  it('runs recommendation pipeline based on custom seed artists', async () => {
    const { result } = renderHook(() => usePipeline(tokenRef));
    const customSeeds = [{ id: 'b1', name: 'MGMT' }, { id: 'b2', name: 'Beach House' }];

    await act(async () => {
      await result.current.run('medium_term', customSeeds);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.seedArtists).toHaveLength(2);
    expect(result.current.seedArtists[0].name).toBe('MGMT');
    expect(result.current.seedArtists[1].name).toBe('Beach House');
    expect(result.current.recommendations).toHaveLength(1);
    expect(spotifyApi.getTopArtists).not.toHaveBeenCalled();
  });
});
