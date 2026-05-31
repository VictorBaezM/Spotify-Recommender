import React, { useState } from 'react';
import { RecommendationCard } from './RecommendationCard';

export function RecommendationGrid({
  recommendations,
  warnings,
  onDismissWarning,
  timeRange,
  onChangeTimeRange,
  isPipelineRunning,
  onRefresh,
}) {
  const [sortBy, setSortBy] = useState('match'); // 'match' or 'popularity'

  const sortedTracks = [...recommendations].sort((a, b) => {
    if (sortBy === 'popularity') {
      return (b.popularity ?? 0) - (a.popularity ?? 0);
    }
    // Default sort by _score descending
    return (b._score ?? 0) - (a._score ?? 0);
  });

  return (
    <div className="w-full space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 backdrop-blur-md">
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Profile Scope:</span>
          <div className="inline-flex rounded-lg p-0.5 bg-neutral-950 border border-neutral-800" role="group">
            {[
              { id: 'short_term', label: 'Short Term' },
              { id: 'medium_term', label: 'Medium Term' },
              { id: 'long_term', label: 'Long Term' },
            ].map(range => (
              <button
                key={range.id}
                onClick={() => onChangeTimeRange(range.id)}
                disabled={isPipelineRunning}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  timeRange === range.id
                    ? 'bg-emerald-500 text-neutral-950 shadow font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
                aria-label={`Set scope to ${range.label}`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sorting and Refresh Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-950 text-neutral-200 border border-neutral-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              aria-label="Sort recommendations by"
            >
              <option value="match">Match Score</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            disabled={isPipelineRunning}
            className="p-2 rounded-lg bg-neutral-850 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-750 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Re-run recommendation engine"
          >
            <svg className={`w-4 h-4 ${isPipelineRunning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3m0 0l3 3m-3-3v12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Warnings Banner Area (Non-blocking and dismissible) */}
      {warnings && warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warn, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border border-yellow-500/20 bg-gradient-to-r from-yellow-950/20 to-neutral-900/40 backdrop-blur-md text-yellow-200/90 text-sm shadow-md animate-fadeIn"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/20 font-bold text-xs">i</span>
                <p className="flex-1 leading-relaxed text-xs md:text-sm">{warn}</p>
              </div>
              <button
                onClick={() => onDismissWarning(warn)}
                className="text-neutral-500 hover:text-white transition-colors duration-200 font-semibold cursor-pointer shrink-0"
                aria-label="Dismiss warning"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTracks.map(track => (
          <RecommendationCard key={track.id} track={track} />
        ))}
      </div>
    </div>
  );
}
