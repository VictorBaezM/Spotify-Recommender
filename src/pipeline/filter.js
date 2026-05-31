export function buildExclusionSet(topTracks, recentTracks, savedTracks) {
  const heard = new Set();
  [...topTracks, ...recentTracks, ...savedTracks]
    .filter(Boolean)
    .forEach(t => t?.id && heard.add(t.id));
  return heard;
}

export function filterCandidateTracks(tracks, exclusionSet) {
  return tracks.filter(t => t?.id && !exclusionSet.has(t.id));
}
