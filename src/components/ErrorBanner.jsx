import React from 'react';

export function ErrorBanner({ error, onRetry, onChangeTimeRange, onLogout }) {
  if (!error) return null;

  const buttonBase = "px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer shadow-md";
  
  const actions = {
    retry: (
      <button
        onClick={onRetry}
        className={`${buttonBase} bg-emerald-500 hover:bg-emerald-400 text-neutral-950 hover:scale-[1.03] active:scale-[0.97]`}
      >
        Try Again
      </button>
    ),
    'change-time-range': (
      <button
        onClick={onChangeTimeRange}
        className={`${buttonBase} bg-emerald-500 hover:bg-emerald-400 text-neutral-950 hover:scale-[1.03] active:scale-[0.97]`}
      >
        Change Time Range
      </button>
    ),
    'spotify-related': (
      <button
        onClick={onRetry}
        className={`${buttonBase} bg-emerald-500 hover:bg-emerald-400 text-neutral-950 hover:scale-[1.03] active:scale-[0.97]`}
      >
        Use Spotify Suggestions
      </button>
    ),
  };

  return (
    <div
      className="w-full max-w-xl mx-auto my-6 p-6 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/40 to-neutral-900/60 backdrop-blur-md text-gray-200 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6"
      role="alert"
    >
      <div className="flex items-start gap-4 flex-1">
        {/* Warning Icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0 font-bold text-lg">
          !
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-bold text-white tracking-wide">Something went wrong</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">{error.message}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 shrink-0">
        {error.fallback && actions[error.fallback]}
        {error.recoverable && !error.fallback && (
          <button
            onClick={onRetry}
            className={`${buttonBase} bg-emerald-500 hover:bg-emerald-400 text-neutral-950 hover:scale-[1.03] active:scale-[0.97]`}
          >
            Try Again
          </button>
        )}
        <button
          onClick={onLogout}
          className={`${buttonBase} bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 hover:scale-[1.03] active:scale-[0.97]`}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
