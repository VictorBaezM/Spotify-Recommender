import { refreshToken, getStoredToken } from '../auth/spotifyAuth';

export const delay = ms => new Promise(r => setTimeout(r, ms));

// Intelligent local cache helper with sessionStorage + Map fallback and custom TTL support
const localCache = {
  get(key) {
    try {
      const val = sessionStorage.getItem(`spotify_cache_${key}`);
      if (!val) return null;
      const parsed = JSON.parse(val);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        sessionStorage.removeItem(`spotify_cache_${key}`);
        return null;
      }
      return parsed.data;
    } catch {
      const val = this._memCache.get(key);
      if (!val) return null;
      if (Date.now() - val.timestamp > val.ttl) {
        this._memCache.delete(key);
        return null;
      }
      return val.data;
    }
  },
  set(key, data, ttlMs = 300_000) { // Default TTL is 5 minutes
    const record = { data, timestamp: Date.now(), ttl: ttlMs };
    try {
      sessionStorage.setItem(`spotify_cache_${key}`, JSON.stringify(record));
    } catch {
      this._memCache.set(key, record);
    }
  },
  _memCache: new Map()
};

async function spotifyFetch(path, tokenRef, retryCount = 0) {
  let token = tokenRef.current ?? getStoredToken();
  const log = tokenRef?.onLog || ((msg) => console.log(msg));

  if (!token) return null;

  // Proactively refresh if expiring within 60s
  if (token.expires_at - Date.now() < 60_000) {
    if (retryCount >= 1) {
      log('Proactive token refresh failed repeatedly. Stopping request.');
      return null;
    }
    try {
      log('Session expiring in < 60s. Proactively refreshing token...');
      token = await refreshToken(token);
      tokenRef.current = token;
    } catch (err) {
      log(`Proactive token refresh error: ${err.message || err}`);
      return null;
    }
  }

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  const cleanPath = path.split('?')[0];
  log(`[Spotify API] GET ${cleanPath} - Status: ${res.status} (Attempt ${retryCount + 1})`);

  if (res.status === 401) {
    if (retryCount >= 1) {
      log('Token rejected even after refresh. Stopping request.');
      return null;
    }
    try {
      log('Session expired (401). Reactively refreshing token and retrying...');
      token = await refreshToken(token);
      tokenRef.current = token;
      return spotifyFetch(path, tokenRef, retryCount + 1); // Retry once
    } catch (err) {
      log(`Reactive token refresh error: ${err.message || err}`);
      return null;
    }
  }

  if (res.status === 429) {
    const retryAfterHeader = res.headers.get('Retry-After');
    const parsedRetryAfter = parseInt(retryAfterHeader, 10);
    const isHeaderHidden = isNaN(parsedRetryAfter);
    let retryAfter = isHeaderHidden ? 6 : parsedRetryAfter;

    if (retryCount >= 4) { // Increased retries to tolerate transient spikes
      log('Rate limited repeatedly. Stopping request.');
      try {
        const cooldownSecs = isHeaderHidden ? 120 : retryAfter;
        const expiry = Date.now() + cooldownSecs * 1000;
        sessionStorage.setItem('spotify_rate_limit_expiry', expiry.toString());
        window.dispatchEvent(new Event('spotify_rate_limit_updated'));
      } catch {}
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    try {
      const waitSecs = retryAfter + Math.ceil(Math.pow(3, retryCount));
      const expiry = Date.now() + waitSecs * 1000;
      sessionStorage.setItem('spotify_rate_limit_expiry', expiry.toString());
      window.dispatchEvent(new Event('spotify_rate_limit_updated'));
    } catch {}

    // Exponential backoff base 3 with randomized jitter to disperse concurrent retries
    const jitter = Math.random() * 1000;
    const wait = (retryAfter + Math.pow(3, retryCount)) * 1000 + jitter;
    log(`[429 Rate Limit] Spotify returned 429. Waiting ${Math.round(wait)}ms before retry ${retryCount + 1}...`);
    await delay(wait);
    return spotifyFetch(path, tokenRef, retryCount + 1);
  }

  if (!res.ok) return null;
  return res.json();
}

export async function getTopArtists(tokenRef, limit = 20, timeRange = 'medium_term') {
  const cacheKey = `top_artists_${limit}_${timeRange}`;
  const cached = localCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] getTopArtists: limit=${limit}, range=${timeRange}`);
    return cached;
  }
  const data = await spotifyFetch(`/me/top/artists?limit=${limit}&time_range=${timeRange}`, tokenRef);
  const items = data?.items ?? [];
  if (items.length > 0) {
    localCache.set(cacheKey, items, 120_000); // 2 minutes TTL
  }
  return items;
}

export async function searchArtist(name, tokenRef) {
  const cleanName = name.toLowerCase().trim();
  const cacheKey = `search_artist_${cleanName}`;
  const cached = localCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] searchArtist: "${name}"`);
    return cached;
  }
  const data = await spotifyFetch(`/search?q=${encodeURIComponent(name)}&type=artist&limit=5`, tokenRef);
  const items = data?.artists?.items ?? [];
  if (items.length > 0) {
    localCache.set(cacheKey, items, 300_000); // 5 minutes TTL
  }
  return items;
}

export async function getTopTracks(tokenRef, limit = 50) {
  const cacheKey = `top_tracks_${limit}`;
  const cached = localCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] getTopTracks: limit=${limit}`);
    return cached;
  }
  const data = await spotifyFetch(`/me/top/tracks?limit=${limit}`, tokenRef);
  const items = data?.items ?? [];
  if (items.length > 0) {
    localCache.set(cacheKey, items, 120_000); // 2 minutes TTL
  }
  return items;
}

export async function getRecentlyPlayed(tokenRef, limit = 50) {
  const cacheKey = `recently_played_${limit}`;
  const cached = localCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] getRecentlyPlayed: limit=${limit}`);
    return cached;
  }
  const data = await spotifyFetch(`/me/player/recently-played?limit=${limit}`, tokenRef);
  const items = (data?.items ?? []).map(i => i.track);
  if (items.length > 0) {
    localCache.set(cacheKey, items, 60_000); // 1 minute TTL for dynamic recently played
  }
  return items;
}

export async function getSavedTracks(tokenRef, maxPages = 4) {
  const cacheKey = `saved_tracks_${maxPages}`;
  const cached = localCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] getSavedTracks: maxPages=${maxPages}`);
    return cached;
  }
  const tracks = [];
  for (let offset = 0; offset < maxPages * 50; offset += 50) {
    const data = await spotifyFetch(`/me/tracks?limit=50&offset=${offset}`, tokenRef);
    if (!data?.items?.length) break;
    data.items.forEach(i => tracks.push(i.track));
    if (offset + 50 < maxPages * 50) {
      await delay(100); // Small delay between pages to avoid burst
    }
  }
  if (tracks.length > 0) {
    localCache.set(cacheKey, tracks, 120_000); // 2 minutes TTL
  }
  return tracks;
}

export async function getArtistTracksViaSearch(artistName, tokenRef, limit = 10) {
  const cleanName = artistName.toLowerCase().trim();
  const cacheKey = `artist_tracks_${cleanName}_${limit}`;
  const cached = localCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] getArtistTracksViaSearch: "${artistName}"`);
    return cached;
  }
  const data = await spotifyFetch(`/search?q=artist:${encodeURIComponent(`"${artistName}"`)}&type=track&limit=${limit}`, tokenRef);
  const items = data?.tracks?.items ?? [];
  if (items.length > 0) {
    localCache.set(cacheKey, items, 300_000); // 5 minutes TTL
  }
  return items;
}

export function clearCache() {
  localCache._memCache.clear();
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('spotify_cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
    console.log('[Cache] Spotify API cache cleared.');
  } catch {
    // SessionStorage might not be available in environments like test
  }
}

export async function getCurrentUserId(tokenRef) {
  const cacheKey = 'current_user_id';
  const cached = localCache.get(cacheKey);
  if (cached) {
    console.log('[Cache Hit] getCurrentUserId');
    return cached;
  }
  const data = await spotifyFetch('/me', tokenRef);
  const userId = data?.id;
  if (userId) {
    localCache.set(cacheKey, userId, 86400000); // 24 hours TTL
  }
  return userId;
}

export async function createPlaylist(userId, name, description, tokenRef) {
  const log = tokenRef?.onLog || ((msg) => console.log(msg));
  log(`[Spotify API] Creating playlist: "${name}"...`);

  // Ensure fresh token if expiring
  let token = tokenRef.current;
  if (!token) return null;

  const res = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      description,
      public: false
    })
  });

  log(`[Spotify API] POST /users/${userId}/playlists - Status: ${res.status}`);
  if (!res.ok) return null;
  return res.json();
}

export async function addTracksToPlaylist(playlistId, trackUris, tokenRef) {
  const log = tokenRef?.onLog || ((msg) => console.log(msg));
  log(`[Spotify API] Adding ${trackUris.length} tracks to playlist...`);

  let token = tokenRef.current;
  if (!token) return null;

  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uris: trackUris
    })
  });

  log(`[Spotify API] POST /playlists/${playlistId}/tracks - Status: ${res.status}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getUserPlaylists(tokenRef) {
  const cacheKey = 'user_playlists';
  const cached = localCache.get(cacheKey);
  if (cached) {
    console.log('[Cache Hit] getUserPlaylists');
    return cached;
  }
  const data = await spotifyFetch('/me/playlists?limit=50', tokenRef);
  const items = data?.items ?? [];
  if (items.length > 0) {
    localCache.set(cacheKey, items, 30000); // 30 seconds cache
  }
  return items;
}

export async function replacePlaylistTracks(playlistId, trackUris, tokenRef) {
  const log = tokenRef?.onLog || ((msg) => console.log(msg));
  log(`[Spotify API] Replacing tracks in playlist: ${playlistId}...`);

  let token = tokenRef.current;
  if (!token) return null;

  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uris: trackUris
    })
  });

  log(`[Spotify API] PUT /playlists/${playlistId}/tracks - Status: ${res.status}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getArtistTopTracks(artistId, tokenRef, market = 'US') {
  const cacheKey = `artist_top_tracks_${artistId}_${market}`;
  const cached = localCache.get(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] getArtistTopTracks: ${artistId}`);
    return cached;
  }
  const data = await spotifyFetch(`/artists/${artistId}/top-tracks?market=${market}`, tokenRef);
  const items = data?.tracks ?? [];
  if (items.length > 0) {
    localCache.set(cacheKey, items, 300000); // 5 minutes TTL
  }
  return items;
}

