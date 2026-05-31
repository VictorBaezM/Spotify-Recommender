import React, { useEffect, useState } from 'react';
import { useSpotifyToken } from './hooks/useSpotifyToken';
import { usePipeline } from './hooks/usePipeline';
import { LoginScreen } from './components/LoginScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { RecommendationGrid } from './components/RecommendationGrid';
import { ErrorBanner } from './components/ErrorBanner';
import { InstantFavorites } from './components/InstantFavorites';
import { getTopTracks, getRecentlyPlayed } from './api/spotify';

function App() {
  const { token, tokenRef, loading: tokenLoading, error: tokenError, login, logout } = useSpotifyToken();
  const { run, abort, step, progress, recommendations, error: pipelineError, warnings, PIPELINE_STEPS } = usePipeline(tokenRef);
  const [timeRange, setTimeRange] = useState('medium_term');
  const [localWarnings, setLocalWarnings] = useState([]);
  const [instantTracks, setInstantTracks] = useState([]);
  const [instantLoading, setInstantLoading] = useState(false);

  // Auto-run pipeline when token is obtained or when timeRange changes
  useEffect(() => {
    if (token) {
      run(timeRange);
    }
    return () => {
      abort();
    };
  }, [token, timeRange, run, abort]);

  // Load instant heavy rotation favorites (staggered by 1000ms to prevent startup API spikes)
  useEffect(() => {
    if (!token) return;

    setInstantLoading(true);
    const timer = setTimeout(() => {
      Promise.allSettled([
        getTopTracks(tokenRef, 15),
        getRecentlyPlayed(tokenRef, 15)
      ]).then(([topRes, recentRes]) => {
        const tops = topRes.status === 'fulfilled' ? topRes.value : [];
        const recents = recentRes.status === 'fulfilled' ? recentRes.value : [];
        
        // Merge and deduplicate by track ID
        const merged = new Map();
        tops.forEach(t => t?.id && merged.set(t.id, t));
        recents.forEach(t => t?.id && !merged.has(t.id) && merged.set(t.id, t));
        
        setInstantTracks([...merged.values()].slice(0, 10));
        setInstantLoading(false);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [token, tokenRef]);

  // Sync warnings state
  useEffect(() => {
    setLocalWarnings(warnings);
  }, [warnings]);

  const handleDismissWarning = (warnToDismiss) => {
    setLocalWarnings(prev => prev.filter(w => w !== warnToDismiss));
  };

  const handleRetry = () => {
    run(timeRange);
  };

  const handleChangeTimeRange = (newRange) => {
    setTimeRange(newRange);
  };

  const handleOpenTimeRangeSelect = () => {
    setTimeRange(prev => {
      const nextMap = {
        'medium_term': 'long_term',
        'long_term': 'short_term',
        'short_term': 'medium_term'
      };
      return nextMap[prev] ?? 'medium_term';
    });
  };

  if (tokenLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212] text-gray-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-semibold font-mono animate-pulse">
            Establishing Secure Link...
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#121212] text-gray-200 py-12">
        <LoginScreen onLogin={login} error={tokenError} />
      </div>
    );
  }

  const isPipelineRunning = step >= 0;

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-[#121212]/80 backdrop-blur-md border-b border-neutral-900 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
            <span className="text-emerald-500">♫</span> Spotify Recommender
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={logout}
            className="px-4 py-2 text-xs font-semibold rounded-full border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white transition-all cursor-pointer"
            aria-label="Log out of Spotify"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex flex-col justify-start">
        
        {/* Error Banner */}
        {pipelineError && (
          <ErrorBanner
            error={pipelineError}
            onRetry={handleRetry}
            onChangeTimeRange={handleOpenTimeRangeSelect}
            onLogout={logout}
          />
        )}

        {/* Dashboard Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* Main Content (Left: 8 columns) */}
          <div className="lg:col-span-8 space-y-6 w-full">
            {isPipelineRunning ? (
              <div className="bg-neutral-950/20 border border-neutral-900/80 rounded-2xl p-6 shadow-xl space-y-4">
                <LoadingScreen step={step} progress={progress} steps={PIPELINE_STEPS} />
                <div className="flex justify-center mt-2">
                  <button
                    onClick={abort}
                    className="px-4 py-2 text-xs font-semibold rounded-full border border-red-900/30 hover:border-red-900 bg-red-950/20 hover:bg-red-950/40 text-red-400 transition-all cursor-pointer"
                    aria-label="Cancel recommendation engine"
                  >
                    Cancel Analysis
                  </button>
                </div>
              </div>
            ) : recommendations && recommendations.length > 0 ? (
              <div className="space-y-6 animate-fadeIn w-full">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Your Custom Playlist</h2>
                  <p className="text-sm text-neutral-400">
                    Fresh, unheard co-listening recommendations based on your unique profile.
                  </p>
                </div>
                
                <RecommendationGrid
                  recommendations={recommendations}
                  warnings={localWarnings}
                  onDismissWarning={handleDismissWarning}
                  timeRange={timeRange}
                  onChangeTimeRange={handleChangeTimeRange}
                  isPipelineRunning={isPipelineRunning}
                  onRefresh={handleRetry}
                />
              </div>
            ) : (
              !pipelineError && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-5 bg-neutral-950/20 border border-neutral-900/80 rounded-2xl shadow-xl">
                  <div className="text-5xl">📭</div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white">No Recommendations Generated</h3>
                    <p className="text-sm text-neutral-400">Ready to analyze your music profile? Press below to start curating.</p>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Start Analysis
                  </button>
                </div>
              )
            )}
          </div>

          {/* Sidebar Area: Instant Favorites (Right: 4 columns) */}
          <div className="lg:col-span-4 space-y-6 w-full">
            <InstantFavorites tracks={instantTracks} loading={instantLoading} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-neutral-900 text-center text-[10px] text-neutral-500 font-semibold tracking-wider uppercase">
        © 2026 fully client-side Spotify similarity engine • powered by Last.fm
      </footer>
    </div>
  );
}

export default App;
