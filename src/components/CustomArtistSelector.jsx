import React, { useState, useEffect, useRef } from 'react';
import { searchArtist } from '../api/spotify';

export function CustomArtistSelector({ tokenRef, selectedArtists, onAddArtist, onRemoveArtist }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const items = await searchArtist(query, tokenRef);
        // Exclude already selected artists from search results
        const filtered = (items ?? []).filter(
          item => !selectedArtists.some(selected => selected.id === item.id)
        );
        setResults(filtered);
      } catch (err) {
        console.error('Failed to search custom artists:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce to protect rate limits

    return () => clearTimeout(delayDebounce);
  }, [query, selectedArtists, tokenRef]);

  const handleSelectArtist = (artist) => {
    if (selectedArtists.length >= 5) return;
    onAddArtist({
      id: artist.id,
      name: artist.name,
      images: artist.images
    });
    setQuery('');
    setResults([]);
  };

  const isRosterFull = selectedArtists.length >= 5;

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Header Info */}
      <div className="space-y-1 text-left">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Custom Seed Artists</h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Search and build a co-listening seed list of up to 5 artists. We will discover new recommendations matching this exact combination.
        </p>
      </div>

      {/* Selected Artists Grid/List */}
      <div className="flex flex-wrap gap-3">
        {selectedArtists.map(artist => {
          const thumbnail = artist.images?.[2]?.url ?? artist.images?.[0]?.url;
          return (
            <div
              key={artist.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-sm font-medium text-white shadow-lg animate-scaleIn hover:border-neutral-700 transition-colors"
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={artist.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">♫</span>
              )}
              <span className="max-w-[120px] truncate text-xs font-semibold">{artist.name}</span>
              <button
                onClick={() => onRemoveArtist(artist.id)}
                className="w-4 h-4 rounded-full bg-neutral-800 hover:bg-red-500/20 hover:text-red-400 text-neutral-400 flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer shrink-0"
                aria-label={`Remove ${artist.name}`}
              >
                ✕
              </button>
            </div>
          );
        })}

        {selectedArtists.length === 0 && (
          <div className="w-full py-4 text-center border border-dashed border-neutral-800/80 rounded-2xl bg-neutral-950/20">
            <span className="text-xs text-neutral-500 font-medium">No seed artists selected yet. Use the search bar below.</span>
          </div>
        )}
      </div>

      {/* Search Input Container */}
      <div className="relative w-full" ref={dropdownRef}>
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isRosterFull}
            placeholder={isRosterFull ? "Your roster is full (5/5) — remove an artist to swap" : "Search Spotify catalog for artists... (e.g. MGMT)"}
            className={`w-full py-3 px-4 pl-11 rounded-2xl text-sm font-medium bg-neutral-950 border focus:outline-none transition-all duration-300 ${
              isRosterFull
                ? "border-neutral-900 text-neutral-600 placeholder-neutral-700 cursor-not-allowed"
                : "border-neutral-850 focus:border-emerald-500 text-white placeholder-neutral-500"
            }`}
          />
          {/* Search Icon */}
          <div className="absolute left-4 pointer-events-none select-none">
            <svg className={`w-4.5 h-4.5 ${isRosterFull ? 'text-neutral-700' : 'text-neutral-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Roster counter or Loading spinner */}
          <div className="absolute right-4 select-none pointer-events-none">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            ) : (
              <span className={`text-[10px] font-bold tracking-widest font-mono uppercase ${selectedArtists.length === 5 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                {selectedArtists.length}/5
              </span>
            )}
          </div>
        </div>

        {/* Suggestion Dropdown suggestions */}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl bg-neutral-950/95 border border-neutral-800 shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto overflow-x-hidden p-1.5 animate-fadeIn">
            {results.map(artist => {
              const image = artist.images?.[2]?.url ?? artist.images?.[0]?.url;
              return (
                <button
                  key={artist.id}
                  onClick={() => handleSelectArtist(artist)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-900 text-left transition-all duration-150 cursor-pointer"
                >
                  {image ? (
                    <img
                      src={image}
                      alt={artist.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-neutral-850"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-850 flex items-center justify-center shrink-0 font-bold text-xs text-neutral-400">
                      ♫
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate leading-snug">{artist.name}</p>
                    <p className="text-[10px] text-neutral-500 truncate leading-snug">Spotify Artist</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full shrink-0">
                    + Add
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
