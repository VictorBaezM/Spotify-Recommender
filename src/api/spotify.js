import { refreshToken, getStoredToken } from '../auth/spotifyAuth';

export const delay = ms => new Promise(r => setTimeout(r, ms));

async function spotifyFetch(path, tokenRef, retryCount = 0) {
  let token = tokenRef.current ?? getStoredToken();

  if (!token) return null;

  // Proactively refresh if expiring within 60s
  if (token.expires_at - Date.now() < 60_000) {
    if (retryCount >= 1) {
      console.error('Proactive refresh failed repeatedly. Stopping request.');
      return null;
    }
    try {
      token = await refreshToken(token);
      tokenRef.current = token;
    } catch (err) {
      console.error('Proactive token refresh error:', err);
      return null;
    }
  }

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  if (res.status === 401) {
    if (retryCount >= 1) {
      console.error('Token rejected even after refresh. Stopping request.');
      return null;
    }
    try {
      token = await refreshToken(token);
      tokenRef.current = token;
      return spotifyFetch(path, tokenRef, retryCount + 1); // Retry once
    } catch (err) {
      console.error('Reactive token refresh error:', err);
      return null;
    }
  }

  if (res.status === 429) {
    if (retryCount >= 2) {
      console.error('Rate limited repeatedly. Stopping request.');
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    const retryAfterHeader = res.headers.get('Retry-After');
    let retryAfter = parseInt(retryAfterHeader, 10);
    if (isNaN(retryAfter)) {
      retryAfter = 3; // Fallback to 3 seconds if header is hidden by CORS
    }
    const wait = (retryAfter + Math.pow(2, retryCount)) * 1000; // Exponential backoff
    await delay(wait);
    return spotifyFetch(path, tokenRef, retryCount + 1); // Retry after backoff
  }

  if (!res.ok) return null;
  return res.json();
}

export async function getTopArtists(tokenRef, limit = 20, timeRange = 'medium_term') {
  const data = await spotifyFetch(`/me/top/artists?limit=${limit}&time_range=${timeRange}`, tokenRef);
  return data?.items ?? [];
}

export async function searchArtist(name, tokenRef) {
  const data = await spotifyFetch(`/search?q=${encodeURIComponent(name)}&type=artist&limit=5`, tokenRef);
  return data?.artists?.items ?? [];
}

export async function getTopTracks(tokenRef, limit = 50) {
  const data = await spotifyFetch(`/me/top/tracks?limit=${limit}`, tokenRef);
  return data?.items ?? [];
}

export async function getRecentlyPlayed(tokenRef, limit = 50) {
  const data = await spotifyFetch(`/me/player/recently-played?limit=${limit}`, tokenRef);
  return (data?.items ?? []).map(i => i.track);
}

export async function getSavedTracks(tokenRef, maxPages = 4) {
  const tracks = [];
  for (let offset = 0; offset < maxPages * 50; offset += 50) {
    const data = await spotifyFetch(`/me/tracks?limit=50&offset=${offset}`, tokenRef);
    if (!data?.items?.length) break;
    data.items.forEach(i => tracks.push(i.track));
  }
  return tracks;
}

export async function getArtistTracksViaSearch(artistName, tokenRef, limit = 10) {
  const data = await spotifyFetch(`/search?q=artist:${encodeURIComponent(`"${artistName}"`)}&type=track&limit=${limit}`, tokenRef);
  return data?.tracks?.items ?? [];
}
