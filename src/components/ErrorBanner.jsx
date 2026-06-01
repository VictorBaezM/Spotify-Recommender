import React from 'react';

export function ErrorBanner({ error, onRetry, onChangeTimeRange, onLogout, cooldown }) {
  if (!error) return null;

  const buttonBase = "px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 shadow-md flex items-center gap-1.5";
  
  const formatCooldown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLocked = cooldown > 0;

  const actions = {
    retry: (
      <button
        onClick={onRetry}
        disabled={isLocked}
        className={`${buttonBase} ${
          isLocked
            ? "bg-neutral-800 border border-neutral-700 text-neutral-500 cursor-not-allowed select-none"
            : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
        }`}
      >
        {isLocked ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Cooldown: {formatCooldown(cooldown)}
          </>
        ) : (
          "Try Again"
        )}
      </button>
    ),
    'change-time-range': (
      <button
        onClick={onChangeTimeRange}
        className={`${buttonBase} bg-emerald-500 hover:bg-emerald-400 text-neutral-950 hover:scale-[1.03] active:scale-[0.97] cursor-pointer`}
      >
        Change Time Range
      </button>
    ),
    'spotify-related': (
      <button
        onClick={onRetry}
        className={`${buttonBase} bg-emerald-500 hover:bg-emerald-400 text-neutral-950 hover:scale-[1.03] active:scale-[0.97] cursor-pointer`}
      >
        Use Spotify Suggestions
      </button>
    ),
  };

  return (
    <div
      className={`w-full max-w-xl mx-auto my-6 p-6 rounded-2xl border bg-gradient-to-br backdrop-blur-md text-gray-200 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 ${
        isLocked
          ? "border-amber-500/20 from-amber-950/40 to-neutral-900/60"
          : "border-red-500/20 from-red-950/40 to-neutral-900/60"
      }`}
      role="alert"
    >
      <div className="flex items-start gap-4 flex-1">
        {/* Status Indicator Badge */}
        <div className={`flex items-center justify-center w-10 h-10 rounded-full border shrink-0 font-mono font-bold text-lg select-none transition-all duration-300 ${
          isLocked
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
            : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {isLocked ? "⏳" : "!"}
        </div>
        <div className="space-y-1 text-center md:text-left flex-1">
          <h3 className="font-bold text-white tracking-wide">
            {isLocked ? "API Rate Cooldown Active" : "Something went wrong"}
          </h3>
          {isLocked ? (
            <p className="text-sm text-amber-400/90 leading-relaxed font-medium">
              ⚠️ Spotify rate limits exceeded. To protect your API budget, retry attempts are temporarily locked. Remaining: <span className="font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{formatCooldown(cooldown)}</span>
            </p>
          ) : (
            <p className="text-sm text-neutral-400 leading-relaxed">{error.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 shrink-0">
        {error.fallback && actions[error.fallback]}
        {error.recoverable && !error.fallback && (
          <button
            onClick={onRetry}
            disabled={isLocked}
            className={`${buttonBase} ${
              isLocked
                ? "bg-neutral-800 border border-neutral-700 text-neutral-500 cursor-not-allowed select-none"
                : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            }`}
          >
            {isLocked ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Cooldown: {formatCooldown(cooldown)}
              </>
            ) : (
              "Try Again"
            )}
          </button>
        )}
        <button
          onClick={onLogout}
          className={`${buttonBase} bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 hover:scale-[1.03] active:scale-[0.97] cursor-pointer`}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
