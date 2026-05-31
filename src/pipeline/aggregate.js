export function aggregateSimilarArtists(topArtistNames, similarResultsMap) {
  // similarResultsMap: Map<topArtistName, LastfmArtist[]>
  const merged = new Map(); // normalizedName → { name, score }
  const topNamesNorm = new Set(topArtistNames.map(n => n.toLowerCase()));

  for (const [, similar] of similarResultsMap) {
    for (const s of similar) {
      const key = s.name.toLowerCase();
      if (topNamesNorm.has(key)) continue; // Skip artists user already knows
      const score = parseFloat(s.match);
      if (!merged.has(key) || merged.get(key).score < score) {
        merged.set(key, { name: s.name, score });
      }
    }
  }

  return [...merged.values()]
    .filter(a => a.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);
}
