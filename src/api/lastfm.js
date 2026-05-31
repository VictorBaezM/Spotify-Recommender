import { LASTFM_API_KEY } from '../config';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function lastfmFetch(params) {
  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  Object.entries({ ...params, api_key: LASTFM_API_KEY, format: 'json' })
    .forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error) return null; // Last.fm error codes (6 = not found, etc.)
  return data;
}

export async function getSimilarArtists(artistName, limit = 15) {
  const data = await lastfmFetch({ method: 'artist.getSimilar', artist: artistName, limit });
  return data?.similarartists?.artist ?? [];
  // Each: { name: string, match: string (0–1) }
}
