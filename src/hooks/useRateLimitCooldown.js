import { useState, useEffect } from 'react';

export function useRateLimitCooldown() {
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const checkCooldown = () => {
      try {
        const expiryStr = sessionStorage.getItem('spotify_rate_limit_expiry');
        if (expiryStr) {
          const expiry = parseInt(expiryStr, 10);
          const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
          setCooldown(remaining);
        } else {
          setCooldown(0);
        }
      } catch {
        setCooldown(0);
      }
    };

    checkCooldown();

    // Check every second to tick down the active cooldown
    const timer = setInterval(() => {
      try {
        const expiryStr = sessionStorage.getItem('spotify_rate_limit_expiry');
        if (expiryStr) {
          const expiry = parseInt(expiryStr, 10);
          const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
          setCooldown(prev => {
            if (remaining === 0 && prev > 0) {
              sessionStorage.removeItem('spotify_rate_limit_expiry');
            }
            return remaining;
          });
        } else {
          setCooldown(0);
        }
      } catch {
        clearInterval(timer);
      }
    }, 1000);

    const handleUpdate = () => {
      checkCooldown();
    };

    window.addEventListener('spotify_rate_limit_updated', handleUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener('spotify_rate_limit_updated', handleUpdate);
    };
  }, []);

  return cooldown;
}
