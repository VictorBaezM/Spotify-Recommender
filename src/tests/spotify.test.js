import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTopArtists, searchArtist, getArtistTracksViaSearch, clearCache, getArtistTopTracks, getUserPlaylists, replacePlaylistTracks } from '../api/spotify';
import * as spotifyAuth from '../auth/spotifyAuth';

vi.mock('../auth/spotifyAuth', () => ({
  refreshToken: vi.fn(),
  getStoredToken: vi.fn(),
}));

describe('Spotify API Layer', () => {
  let tokenRef;

  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
    tokenRef = {
      current: {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_at: Date.now() + 3600000,
      },
    };
    spotifyAuth.getStoredToken.mockReturnValue(tokenRef.current);
    global.fetch = vi.fn();
  });

  it('successfully fetches top artists', async () => {
    const mockItems = [{ id: '1', name: 'Tame Impala' }];
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ items: mockItems }),
    });

    const artists = await getTopArtists(tokenRef);
    expect(artists).toEqual(mockItems);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term',
      expect.any(Object)
    );
  });

  it('proactively refreshes token when close to expiry', async () => {
    // Set token to expire in 30 seconds
    tokenRef.current.expires_at = Date.now() + 30000;
    const refreshedToken = {
      access_token: 'new-token',
      refresh_token: 'mock-refresh',
      expires_at: Date.now() + 3600000,
    };
    spotifyAuth.refreshToken.mockResolvedValueOnce(refreshedToken);

    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ items: [] }),
    });

    await getTopArtists(tokenRef);
    expect(spotifyAuth.refreshToken).toHaveBeenCalled();
    expect(tokenRef.current.access_token).toBe('new-token');
  });

  it('retries request once on 401 Unauthorized response', async () => {
    const refreshedToken = {
      access_token: 'refreshed-token',
      refresh_token: 'mock-refresh',
      expires_at: Date.now() + 3600000,
    };
    spotifyAuth.refreshToken.mockResolvedValueOnce(refreshedToken);

    // First fetch fails with 401, second succeeds
    fetch
      .mockResolvedValueOnce({
        status: 401,
        ok: false,
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ items: [{ id: '1', name: 'Tame Impala' }] }),
      });

    const artists = await getTopArtists(tokenRef);
    expect(artists).toHaveLength(1);
    expect(spotifyAuth.refreshToken).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('handles 429 rate limit backoff and retries', async () => {
    vi.useFakeTimers();

    fetch
      .mockResolvedValueOnce({
        status: 429,
        ok: false,
        headers: {
          get: (key) => (key.toLowerCase() === 'retry-after' ? '1' : null),
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ items: [{ id: '1', name: 'Tame Impala' }] }),
      });

    const artistPromise = getTopArtists(tokenRef);

    // Fast-forward timers to run the retried fetch
    await vi.runAllTimersAsync();
    const artists = await artistPromise;

    expect(artists).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('successfully fetches tracks via search', async () => {
    const mockTracks = [{ id: 't1', name: 'Electric Feel' }];
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        tracks: {
          items: mockTracks
        }
      }),
    });

    const tracks = await getArtistTracksViaSearch('MGMT', tokenRef);
    expect(tracks).toEqual(mockTracks);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=artist:%22MGMT%22'),
      expect.any(Object)
    );
  });

  it('successfully fetches artist top tracks directly', async () => {
    const mockTracks = [{ id: 't1', name: 'Electric Feel' }];
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        tracks: mockTracks
      }),
    });

    const tracks = await getArtistTopTracks('b1', tokenRef);
    expect(tracks).toEqual(mockTracks);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/artists/b1/top-tracks?market=US',
      expect.any(Object)
    );
  });

  it('successfully fetches user playlists', async () => {
    const mockPlaylists = [{ id: 'p1', name: 'My Co-Listening Mix' }];
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        items: mockPlaylists
      }),
    });

    const playlists = await getUserPlaylists(tokenRef);
    expect(playlists).toEqual(mockPlaylists);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/playlists?limit=50',
      expect.any(Object)
    );
  });

  it('successfully replaces playlist tracks', async () => {
    fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ snapshot_id: 'snap1' }),
    });

    const res = await replacePlaylistTracks('p1', ['spotify:track:t1'], tokenRef);
    expect(res).toEqual({ snapshot_id: 'snap1' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/playlists/p1/tracks',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ uris: ['spotify:track:t1'] })
      })
    );
  });
});

