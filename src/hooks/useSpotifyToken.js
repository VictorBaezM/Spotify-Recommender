import { useState, useEffect, useRef } from 'react';
import { getStoredToken, exchangeCodeForToken, clearToken, redirectToSpotifyLogin } from '../auth/spotifyAuth';

export function useSpotifyToken() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tokenRef = useRef(null);

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
    redirectToSpotifyLogin();
  };

  const logout = () => {
    clearToken();
    setToken(null);
    tokenRef.current = null;
    window.location.href = '/';
  };

  return { token, tokenRef, loading, error, login, logout };
}
