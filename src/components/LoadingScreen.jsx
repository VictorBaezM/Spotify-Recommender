import React from 'react';

export function LoadingScreen({ step, progress, steps, logs }) {
  // Calculate percentage of pipeline completion
  const totalPercent = Math.round(((step >= 0 ? step : 0) / steps.length) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-200 px-4 py-8 max-w-lg mx-auto w-full">
      <div className="w-full bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-neutral-800 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            Analyzing Your Music Profile
          </h2>
          <p className="text-sm text-neutral-400">
            Curating personalized unheard gems using co-listening data...
          </p>
        </div>

        {/* Global Progress Circle / Pulse */}
        <div className="flex justify-center py-4">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-neutral-800/80 border border-neutral-700 shadow-inner">
            {/* Pulsing Outer Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-25"></div>
            {/* Spinning Indicator */}
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(63, 63, 70, 0.4)"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#1DB954"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * (step >= 0 ? ((step + 1) / steps.length) : 0))}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute text-sm font-semibold text-white font-mono">
              {totalPercent}%
            </span>
          </div>
        </div>

        {/* Step-by-Step Progress List */}
        <ul className="space-y-3.5 pt-2">
          {steps.map((label, i) => {
            const isDone = i < step;
            const isActive = i === step;

            return (
              <li
                key={i}
                className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                  isActive
                    ? 'text-emerald-400 font-medium scale-[1.02] origin-left'
                    : isDone
                    ? 'text-neutral-400'
                    : 'text-neutral-600'
                }`}
              >
                {/* Indicator Icon */}
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full border text-[11px] transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                      : isActive
                      ? 'border-emerald-400 text-emerald-400 animate-pulse bg-emerald-500/10'
                      : 'border-neutral-700 text-neutral-600'
                  }`}
                >
                  {isDone ? '✓' : isActive ? '→' : '○'}
                </div>

                <div className="flex-1 flex justify-between items-center">
                  <span>{label}</span>
                  {isActive && progress >= 0 && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-emerald-400 border border-emerald-500/20 animate-pulse">
                      {progress}%
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Diagnostic Log Console */}
        {logs && logs.length > 0 && (
          <div className="mt-6 border border-neutral-800 bg-black/40 rounded-xl p-4 space-y-2 text-left">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 mb-2 select-none">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono">
                System Diagnostic Console
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div 
              className="max-h-36 overflow-y-auto text-[11px] font-mono text-neutral-300 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800 select-text"
              ref={(el) => {
                if (el) el.scrollTop = el.scrollHeight;
              }}
            >
              {logs.map((log, index) => {
                let colorClass = "text-neutral-400";
                if (log.includes("Error") || log.includes("failed") || log.includes("Failed")) colorClass = "text-red-400";
                else if (log.includes("Warning") || log.includes("429") || log.includes("limited")) colorClass = "text-amber-400";
                else if (log.includes("Success") || log.includes("Success:") || log.includes("success")) colorClass = "text-emerald-400";
                else if (log.includes("triggered") || log.includes("started") || log.includes("Triggered")) colorClass = "text-sky-400";
                
                return (
                  <div key={index} className={`leading-relaxed break-words ${colorClass}`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
