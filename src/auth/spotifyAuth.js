import { generateCodeVerifier, generateCodeChallenge } from './pkce';
import { SPOTIFY_CLIENT_ID, REDIRECT_URI, SCOPES } from '../config';

export async function redirectToSpotifyLogin() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForToken(code) {
  const verifier = sessionStorage.getItem('pkce_verifier');
  if (!verifier) throw new Error('PKCE verifier missing — restart login');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: SPOTIFY_CLIENT_ID,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const token = await res.json();
  token.expires_at = Date.now() + token.expires_in * 1000;
  sessionStorage.setItem('spotify_token', JSON.stringify(token));
  sessionStorage.removeItem('pkce_verifier');
  return token;
}

export async function refreshToken(token) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
      client_id: SPOTIFY_CLIENT_ID,
    }),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  const refreshed = await res.json();
  refreshed.expires_at = Date.now() + refreshed.expires_in * 1000;
  refreshed.refresh_token = refreshed.refresh_token ?? token.refresh_token;
  sessionStorage.setItem('spotify_token', JSON.stringify(refreshed));
  return refreshed;
}

export function getStoredToken() {
  try {
    return JSON.parse(sessionStorage.getItem('spotify_token'));
  } catch { return null; }
}

export function clearToken() {
  sessionStorage.removeItem('spotify_token');
}
