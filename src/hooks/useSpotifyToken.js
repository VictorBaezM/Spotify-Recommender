import { useState, useEffect, useRef, useCallback } from 'react';
import { getStoredToken, exchangeCodeForToken, clearToken, redirectToSpotifyLogin, getSpotifyLoginUrl } from '../auth/spotifyAuth';

export function useSpotifyToken() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loginUrl, setLoginUrl] = useState('');
  const tokenRef = useRef(null);

  const precomputeUrl = useCallback(async () => {
    try {
      const url = await getSpotifyLoginUrl();
      setLoginUrl(url);
    } catch (err) {
      console.error('Failed to precompute Spotify login URL:', err);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      precomputeUrl();
    }
  }, [token, precomputeUrl]);

  useEffect(() => {
    async function initToken() {
      try {
        const stored = getStoredToken();
        if (stored) {
          setToken(stored);
          tokenRef.current = stored;
        } else {
          // Check if we have a code in the URL
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (code) {
            setLoading(true);
            const exchanged = await exchangeCodeForToken(code);
            setToken(exchanged);
            tokenRef.current = exchanged;
            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('code');
            url.searchParams.delete('state');
            window.history.replaceState({}, document.title, url.pathname + url.search);
          }
        }
      } catch (err) {
        console.error('Failed to initialize token:', err);
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    }
    initToken();
  }, []);

  const login = () => {
    if (loginUrl) {
      window.location.href = loginUrl;
    } else {
      redirectToSpotifyLogin();
    }
  };

  const logout = () => {
    clearToken();
    setToken(null);
    tokenRef.current = null;
    window.location.href = '/';
  };

  return { token, tokenRef, loading, error, login, logout };
}
