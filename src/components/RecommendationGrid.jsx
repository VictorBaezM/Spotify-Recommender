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
  exportedPlaylistId,
  isExporting,
  onExportPlaylist,
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

        {/* Export and Sorting Controls */}
        <div className="flex flex-wrap items-center gap-4 justify-center md:justify-end">
          {/* Export / Sync to Spotify Playlist Button */}
          <button
            onClick={onExportPlaylist}
            disabled={isExporting || isPipelineRunning}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-250 flex items-center gap-1.5 shadow ${
              exportedPlaylistId
                ? "bg-neutral-850 text-emerald-400 border border-emerald-500/20 cursor-default select-none"
                : isExporting
                ? "bg-emerald-600/40 border border-emerald-500/30 text-emerald-300 animate-pulse cursor-wait"
                : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            }`}
          >
            {exportedPlaylistId ? (
              <>
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.886 14.417c-.198.324-.622.427-.946.229-2.584-1.58-5.837-1.938-9.667-1.063-.37.085-.73-.153-.815-.523-.085-.369.153-.73.522-.815 4.195-.96 7.785-.556 10.677 1.213.324.198.427.622.229.959zm1.303-2.718c-.249.405-.783.535-1.188.286-2.957-1.817-7.466-2.344-10.957-1.285-.454.137-.929-.118-1.066-.572-.138-.454.118-.93.572-1.067 3.992-1.211 8.956-.622 12.363 1.472.405.25.535.783.286 1.186zM18.3 11.08c-.298.487-.93.649-1.417.352-3.447-2.048-9.13-2.235-12.449-1.229-.543.165-1.114-.143-1.279-.687-.165-.543.143-1.114.687-1.279 3.948-1.198 10.218-.979 14.205 1.388.488.298.65.93.353 1.417z"/>
                </svg>
                ✓ Synced: My Co-Listening Mix
              </>
            ) : isExporting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-emerald-300" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing Playlist...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm5.545 14.422c-.198.324-.622.427-.946.229-2.584-1.58-5.837-1.938-9.667-1.063-.37.085-.73-.153-.815-.523-.085-.369.153-.73.522-.815 4.195-.96 7.785-.556 10.677 1.213.324.198.427.622.229.959zm1.303-2.718c-.249.405-.783.535-1.188.286-2.957-1.817-7.466-2.344-10.957-1.285-.454.137-.929-.118-1.066-.572-.138-.454.118-.93.572-1.067 3.992-1.211 8.956-.622 12.363 1.472.405.25.535.783.286 1.186zm.109-2.839c-.298.487-.93.649-1.417.352-3.447-2.048-9.13-2.235-12.449-1.229-.543.165-1.114-.143-1.279-.687-.165-.543.143-1.114.687-1.279 3.948-1.198 10.218-.979 14.205 1.388.488.298.65.93.353 1.417z"/>
                </svg>
                Sync with My Co-Listening Mix
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Sort:</span>
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

      {/* Single Playlist Embed Player (Visible when exported) */}
      {exportedPlaylistId && (
        <div className="w-full rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-xl p-0.5 animate-fadeIn">
          <iframe
            src={`https://open.spotify.com/embed/playlist/${exportedPlaylistId}?utm_source=generator&theme=0`}
            width="100%"
            height="380"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify Recommendations Playlist Player"
            className="block"
          />
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTracks.map(track => (
          <RecommendationCard 
            key={track.id} 
            track={track} 
            isPlaylistExported={!!exportedPlaylistId}
          />
        ))}
      </div>
    </div>
  );
}
