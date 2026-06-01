import React, { useState } from 'react';

export function RecommendationCard({ track }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const matchPercent = Math.round((track._score ?? 0) * 100);
  const artistName = track.artists?.[0]?.name ?? 'Unknown Artist';
  const trackName = track.name ?? 'Unknown Track';
  const albumArt = track.album?.images?.[0]?.url;
  const albumName = track.album?.name ?? '';

  return (
    <div className="group relative flex flex-col justify-between rounded-xl bg-neutral-900/60 backdrop-blur-md border border-neutral-800 p-4 transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-850 hover:-translate-y-1 shadow-lg hover:shadow-2xl">
      
      {/* Visual Header / Player Area */}
      <div className="relative w-full rounded-lg overflow-hidden bg-neutral-950 border border-neutral-850 aspect-video md:h-28 flex items-center justify-center">
        {isPlaying ? (
          /* On-Demand Active Spotify Iframe Embed */
          <iframe
            src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            title={`${trackName} by ${artistName}`}
            className="block h-full w-full"
          />
        ) : (
          /* Beautiful Static Cover Art + Play-on-Demand Centered Button Hover State */
          <div className="relative w-full h-full group/art flex items-center justify-center overflow-hidden bg-neutral-900">
            {albumArt ? (
              <img 
                src={albumArt} 
                alt={albumName} 
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover/art:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">🎵</div>
            )}
            
            {/* Meta Text Layer */}
            <div className="absolute left-4 right-16 text-left min-w-0 pointer-events-none select-none">
              <h4 className="font-bold text-sm text-white truncate leading-snug mb-0.5">{trackName}</h4>
              <p className="text-xs text-neutral-400 truncate font-medium">{artistName}</p>
            </div>

            {/* Centered Play Button (Triggers iframe on demand) */}
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute right-4 w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center shadow-lg hover:scale-[1.08] active:scale-[0.94] transition-all cursor-pointer z-10"
              aria-label={`Play preview for ${trackName}`}
            >
              <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Meta Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Match Score Badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {matchPercent}% match
          </span>
        </div>

        {/* Track stats or external link */}
        {track.external_urls?.spotify && (
          <a
            href={track.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${trackName} on Spotify`}
            className="text-xs text-neutral-400 hover:text-white transition-colors duration-200 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>Open App</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
