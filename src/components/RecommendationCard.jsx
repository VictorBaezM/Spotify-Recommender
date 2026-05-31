import React from 'react';

export function RecommendationCard({ track }) {
  const matchPercent = Math.round((track._score ?? 0) * 100);
  const artistName = track.artists?.[0]?.name ?? 'Unknown Artist';
  const trackName = track.name ?? 'Unknown Track';

  return (
    <div className="group relative flex flex-col justify-between rounded-xl bg-neutral-900/60 backdrop-blur-md border border-neutral-800 p-4 transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-800/60 hover:-translate-y-1 shadow-lg hover:shadow-2xl">
      {/* Spotify Embed Player */}
      <div className="w-full rounded-lg overflow-hidden bg-neutral-950 border border-neutral-850">
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
            className="text-xs text-neutral-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
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
