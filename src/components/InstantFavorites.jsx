import React, { useState } from 'react';

export function InstantFavorites({ tracks, loading }) {
  const [activeTrackId, setActiveTrackId] = useState(null);

  if (loading) {
    return (
      <div className="rounded-2xl bg-neutral-900/40 backdrop-blur-md border border-neutral-800 p-6 shadow-xl space-y-4 animate-pulse">
        <div className="h-5 bg-neutral-850 rounded w-1/2"></div>
        <div className="h-3 bg-neutral-850 rounded w-5/6"></div>
        <div className="space-y-3 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-850 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-neutral-850 rounded w-3/4"></div>
                <div className="h-2.5 bg-neutral-850 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tracks || tracks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-neutral-900/40 backdrop-blur-md border border-neutral-800 p-6 shadow-xl space-y-5">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-emerald-500 animate-pulse">⚡</span> Instant Favorites Mix
        </h3>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Your heavy rotation tracks on Spotify. Listen immediately while the recommendation engine runs!
        </p>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {tracks.map((track, i) => {
          const isActive = activeTrackId === track.id;
          const artistName = track.artists?.[0]?.name ?? 'Unknown Artist';
          const trackName = track.name ?? 'Unknown Track';
          const albumImg = track.album?.images?.[2]?.url ?? track.album?.images?.[0]?.url;

          return (
            <div
              key={track.id}
              className={`group flex flex-col rounded-xl border p-3 transition-all duration-300 ${
                isActive
                  ? 'bg-neutral-850/80 border-emerald-500/45 shadow-lg'
                  : 'bg-neutral-950/40 border-neutral-850 hover:border-neutral-750 hover:bg-neutral-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Album Art / Play Overlay */}
                <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-neutral-900">
                  {albumImg ? (
                    <img src={albumImg} alt={trackName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600 font-bold bg-neutral-850">
                      ♪
                    </div>
                  )}
                  <button
                    onClick={() => setActiveTrackId(isActive ? null : track.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white cursor-pointer"
                    aria-label={isActive ? 'Close preview' : 'Play preview'}
                  >
                    <span className="text-xs">{isActive ? '✕' : '▶'}</span>
                  </button>
                </div>

                {/* Meta details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {trackName}
                  </h4>
                  <p className="text-[10px] text-neutral-400 truncate">{artistName}</p>
                </div>

                {/* External App Link */}
                {track.external_urls?.spotify && (
                  <a
                    href={track.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-white transition-colors p-1"
                    aria-label={`Open ${trackName} on Spotify`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Dynamic Embed Player (Loaded strictly on-demand!) */}
              {isActive && (
                <div className="mt-3 w-full rounded overflow-hidden border border-neutral-800 bg-neutral-950 animate-fadeIn">
                  <iframe
                    src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={`${trackName} by ${artistName}`}
                    className="block"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
