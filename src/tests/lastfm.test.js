import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSimilarArtists } from '../api/lastfm';

describe('Last.fm API Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('successfully fetches similar artists from Last.fm', async () => {
    const mockSimilar = [
      { name: 'MGMT', match: '0.85' },
      { name: 'Beach House', match: '0.78' },
    ];
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        similarartists: {
          artist: mockSimilar,
        },
      }),
    });

    const similar = await getSimilarArtists('Tame Impala');
    expect(similar).toEqual(mockSimilar);
    
    // Assert fetch was called with correct URL and search parameters
    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining('artist.getSimilar'),
      })
    );
  });

  it('returns empty array on network failure', async () => {
    fetch.mockResolvedValueOnce({
      status: 500,
      ok: false,
    });

    const similar = await getSimilarArtists('Tame Impala');
    expect(similar).toEqual([]);
  });

  it('returns empty array on Last.fm specific error codes', async () => {
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        error: 6,
        message: 'The artist you supplied could not be found',
      }),
    });

    const similar = await getSimilarArtists('Niche Unknown Artist');
    expect(similar).toEqual([]);
  });
});
