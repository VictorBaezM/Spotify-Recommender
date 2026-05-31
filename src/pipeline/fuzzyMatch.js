export function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // Strip accents
    .replace(/\s*\(.*?\)\s*/g, '')                       // Strip parentheticals
    .replace(/\s*(feat|ft|featuring)\.?\s+.*/i, '')      // Strip feat credits
    .replace(/-/g, ' ')                                  // Replace hyphens with spaces
    .replace(/[^a-z0-9 ]/g, '')                          // Strip punctuation
    .replace(/^(the|a|an)\s+/, '')                       // Strip leading articles
    .trim().replace(/\s+/g, ' ');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

export function artistMatchScore(lastfmName, spotifyName) {
  const a = normalize(lastfmName);
  const b = normalize(spotifyName);
  if (!a || !b) return 0;
  if (a === b) return 1.0;
  
  if (a.includes(b) || b.includes(a)) {
    const minLen = Math.min(a.length, b.length);
    const maxLen = Math.max(a.length, b.length);
    if (minLen / maxLen >= 0.75) {
      return 0.9;
    }
  }

  if (a.length <= 12 && b.length <= 12) {
    const dist = levenshtein(a, b);
    const sim = 1 - dist / Math.max(a.length, b.length);
    if (sim >= 0.8) return sim;
  }

  const tokensA = new Set(a.split(' ').filter(Boolean));
  const tokensB = new Set(b.split(' ').filter(Boolean));
  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

// Returns true if a Last.fm artist name matches a Spotify artist result
export function isAcceptableMatch(lastfmName, spotifyArtist) {
  const score = artistMatchScore(lastfmName, spotifyArtist.name);
  if (score < 0.60) return false;
  if (score < 0.75 && spotifyArtist.popularity < 10) return false;
  return true;
}
