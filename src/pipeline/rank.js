export function scoreTrack(track, artistSimilarity) {
  const pop = (track.popularity ?? 50) / 100;
  return (artistSimilarity * 0.7) + (pop * 0.3);
}

export function rankTracks(candidateTracks, limit = 25) {
  return [...candidateTracks]
    .sort((a, b) => (b._score ?? 0) - (a._score ?? 0))
    .slice(0, limit);
}
