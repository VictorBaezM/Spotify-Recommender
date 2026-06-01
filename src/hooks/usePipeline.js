import { useRef, useState, useCallback } from 'react';
import { getTopArtists, searchArtist, getArtistTopTracks, getTopTracks, getRecentlyPlayed, getSavedTracks } from '../api/spotify';
import { getSimilarArtists } from '../api/lastfm';
import { aggregateSimilarArtists } from '../pipeline/aggregate';
import { isAcceptableMatch, artistMatchScore } from '../pipeline/fuzzyMatch';
import { buildExclusionSet, filterCandidateTracks } from '../pipeline/filter';
import { scoreTrack, rankTracks } from '../pipeline/rank';
import { LASTFM_API_KEY } from '../config';

const delay = ms => new Promise(r => setTimeout(r, ms));

export const PIPELINE_STEPS = [
  'Fetching your top artists',
  'Finding similar artists via Last.fm',
  'Resolving artists on Spotify',
  'Fetching candidate tracks',
  'Building your listening history',
  'Filtering heard tracks',
  'Ranking recommendations',
];

export function usePipeline(tokenRef) {
  const [step, setStep] = useState(-1);        // Current pipeline step index
  const [progress, setProgress] = useState(0); // 0–100 within current step
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);    // { message, recoverable, fallback }
  const [warnings, setWarnings] = useState([]); // Non-fatal degradation notices
  const [logs, setLogs] = useState([]);        // Real-time scrolling diagnostics
  const abortRef = useRef(false);
  const runIdRef = useRef(0);

  const addWarning = (msg) => setWarnings(w => {
    if (w.includes(msg)) return w;
    return [...w, msg];
  });

  const addLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
    console.log(`[${time}] ${msg}`);
  }, []);

  const run = useCallback(async (initialTimeRange = 'medium_term') => {
    runIdRef.current += 1;
    const currentRunId = runIdRef.current;

    abortRef.current = false;
    setError(null);
    setWarnings([]);
    setRecommendations([]);
    setLogs([]);
    setStep(0);
    setProgress(0);

    // Share log callback with independent api layer via tokenRef
    tokenRef.onLog = addLog;

    let currentTimeRange = initialTimeRange;
    const triedRanges = new Set([currentTimeRange]);
    let cachedExclusionSet = null;

    addLog(`Pipeline triggered on time-range: ${formatRangeName(currentTimeRange)}.`);

    while (true) {
      if (currentRunId !== runIdRef.current || abortRef.current) return;
      try {
        // STEP 0: Top Artists
        setStep(0);
        setProgress(0);
        addLog(`Step 0: Scanning your top artists for ${formatRangeName(currentTimeRange)}...`);
        let topArtists = await getTopArtists(tokenRef, 20, currentTimeRange);
        if (currentRunId !== runIdRef.current || abortRef.current) return;
        
        // RECOVERY: If top artists is empty, extract artists from their top/recent/saved tracks!
        if (!topArtists || !topArtists.length) {
          addLog('Step 0: Spotify top artists list returned empty. Attempting to recover by extracting unique artists from your tracks history...');
          try {
            const [tracks1, tracks2, tracks3] = await Promise.allSettled([
              getTopTracks(tokenRef, 30),
              getRecentlyPlayed(tokenRef, 30),
              getSavedTracks(tokenRef, 1)
            ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));

            const uniqueArtists = new Map();
            const processTrack = (t) => {
              if (t && t.artists && t.artists.length > 0) {
                t.artists.forEach(art => {
                  if (art.name && !uniqueArtists.has(art.name)) {
                    uniqueArtists.set(art.name, {
                      name: art.name,
                      id: art.id || ''
                    });
                  }
                });
              }
            };
            
            tracks1.forEach(processTrack);
            tracks2.forEach(processTrack);
            tracks3.forEach(processTrack);

            const extractedArtists = Array.from(uniqueArtists.values());
            if (extractedArtists.length > 0) {
              topArtists = extractedArtists;
              addLog(`Step 0 Success: Successfully extracted ${topArtists.length} unique artists from your listening history tracks.`);
            }
          } catch (err) {
            console.error('Failed to extract artists from tracks:', err);
            addLog(`Step 0 Error: Failed to extract artists from tracks: ${err.message || err}`);
          }
        }

        // CYCLE TIME RANGES: If still empty, cycle ranges
        if (!topArtists || !topArtists.length) {
          const nextRange = getNextTimeRange(currentTimeRange, triedRanges);
          if (nextRange) {
            const prevRange = currentTimeRange;
            currentTimeRange = nextRange;
            triedRanges.add(currentTimeRange);
            addWarning(`No listening history in ${formatRangeName(prevRange)}. Automatically scanning ${formatRangeName(nextRange)}...`);
            addLog(`Step 0: No listening history in ${formatRangeName(prevRange)}. Cycling to ${formatRangeName(nextRange)}...`);
            continue;
          }

          // No listening history found on account
          setError({
            message: 'No listening history found on your Spotify account. Please listen to some music on Spotify and try again!',
            recoverable: false
          });
          setStep(-1);
          return;
        }

        addLog(`Step 0 Success: Retrieved ${topArtists.length} top artists.`);

        if (topArtists.length > 5) {
          addLog(`Step 0 Optimization: Selecting 5 random artists from your top roster to optimize API budget and maximize recommendation variety.`);
          const shuffled = [...topArtists].sort(() => 0.5 - Math.random());
          topArtists = shuffled.slice(0, 5);
          addLog(`Step 0 Selected: ${topArtists.map(a => `"${a.name}"`).join(', ')}`);
        }

        // STEP 1: Last.fm similar artists
        setStep(1);
        setProgress(0);
        addLog('Step 1: Finding similar artists via Last.fm co-listening similarity...');
        const similarResultsMap = new Map();
        let lastfmFailed = false;

        const isLastfmPlaceholder = !LASTFM_API_KEY || LASTFM_API_KEY === 'your_lastfm_key_here';

        if (!isLastfmPlaceholder) {
          for (let i = 0; i < topArtists.length; i++) {
            if (currentRunId !== runIdRef.current || abortRef.current) return;
            const progressPercent = Math.round((i / topArtists.length) * 100);
            setProgress(progressPercent);
            addLog(`Step 1: Querying similarities for "${topArtists[i].name}" (${progressPercent}%)`);
            try {
              const similar = await getSimilarArtists(topArtists[i].name);
              if (currentRunId !== runIdRef.current || abortRef.current) return;
              if (similar && similar.length > 0) {
                similarResultsMap.set(topArtists[i].name, similar);
              }
            } catch (err) {
              addLog(`Step 1: Last.fm query failed for artist "${topArtists[i].name}": ${err.message || err}`);
            }
            await delay(150);
          }
        } else {
          lastfmFailed = true;
          addWarning('Last.fm API Key is a placeholder. Skipping Last.fm queries.');
          addLog('Step 1: Last.fm API Key is a placeholder. Skipping Last.fm co-listening checks.');
        }

        let candidates = [];
        if (similarResultsMap.size > 0) {
          candidates = aggregateSimilarArtists(
            topArtists.map(a => a.name),
            similarResultsMap
          );
        }

        if (candidates.length === 0) {
          const nextRange = getNextTimeRange(currentTimeRange, triedRanges);
          if (nextRange) {
            const prevRange = currentTimeRange;
            currentTimeRange = nextRange;
            triedRanges.add(currentTimeRange);
            addWarning(`Last.fm returned no similar artists in ${formatRangeName(prevRange)}. Automatically scanning ${formatRangeName(nextRange)}...`);
            addLog(`Step 1: No similarities found in ${formatRangeName(prevRange)}. Cycling to ${formatRangeName(nextRange)}...`);
            continue;
          }

          // No similarities returned by Last.fm
          setError({
            message: 'Could not find similar artists for your listening profile on Last.fm. Please try a different time range!',
            recoverable: true
          });
          setStep(-1);
          return;
        }

        addLog(`Step 1 Success: Aggregated ${candidates.length} unique similar artist candidates.`);

        // STEP 2: Resolve Last.fm/Related artists → Spotify IDs
        setStep(2);
        setProgress(0);
        const resolved = [];
        const maxToResolve = Math.min(candidates.length, 6);
        addLog(`Step 2: Resolving top ${maxToResolve} candidate artists to Spotify catalog IDs...`);
        for (let i = 0; i < maxToResolve; i++) {
          if (currentRunId !== runIdRef.current || abortRef.current) return;
          const progressPercent = Math.round((i / maxToResolve) * 100);
          setProgress(progressPercent);
          addLog(`Step 2: Resolving similar artist ${i + 1}/${maxToResolve}: "${candidates[i].name}" (${progressPercent}%)`);
          try {
            const results = await searchArtist(candidates[i].name, tokenRef);
            if (currentRunId !== runIdRef.current || abortRef.current) return;
            await delay(600);

            if (results && results.length > 0) {
              const best = results
                .map(a => ({ ...a, _matchScore: artistMatchScore(candidates[i].name, a.name) }))
                .sort((a, b) => b._matchScore - a._matchScore)[0];

              if (best && isAcceptableMatch(candidates[i].name, best)) {
                addLog(`Step 2 Match: "${candidates[i].name}" -> "${best.name}" (Confidence: ${Math.round(best._matchScore * 100)}%)`);
                resolved.push({ ...best, _lastfmScore: candidates[i].score });
              } else {
                addLog(`Step 2 Match Rejected: "${candidates[i].name}". Best match "${best?.name}" has low fuzzy confidence.`);
              }
            } else {
              addLog(`Step 2 Match Failed: No search results returned for artist "${candidates[i].name}".`);
            }
          } catch (err) {
            addLog(`Step 2 Error resolving "${candidates[i].name}": ${err.message || err}`);
            if (err.message === 'RATE_LIMIT_EXCEEDED') {
              throw err;
            }
          }
        }

        if (resolved.length < 5 && resolved.length > 0) {
          addWarning(`Only ${resolved.length} artists could be matched to Spotify. Recommendations may be limited.`);
        }
        if (resolved.length === 0) {
          const nextRange = getNextTimeRange(currentTimeRange, triedRanges);
          if (nextRange) {
            const prevRange = currentTimeRange;
            currentTimeRange = nextRange;
            triedRanges.add(currentTimeRange);
            addWarning(`No similar artists matched on Spotify for ${formatRangeName(prevRange)}. Automatically scanning ${formatRangeName(nextRange)}...`);
            addLog(`Step 2: No catalog matches on Spotify for ${formatRangeName(prevRange)}. Cycling to ${formatRangeName(nextRange)}...`);
            continue;
          }
          
          // Zero resolved similarity candidates matched on Spotify
          setError({
            message: 'Could not match any similar artists to the Spotify catalog. Please try a different time range!',
            recoverable: true
          });
          setStep(-1);
          return;
        }

        addLog(`Step 2 Success: Resolved ${resolved.length}/${maxToResolve} artists.`);

        // STEP 3: Fetch candidate tracks
        setStep(3);
        setProgress(0);
        const candidateTracks = [];
        const maxToFetch = Math.min(resolved.length, 4);
        addLog(`Step 3: Querying tracks for ${maxToFetch} resolved Spotify artists...`);
        for (let i = 0; i < maxToFetch; i++) {
          if (currentRunId !== runIdRef.current || abortRef.current) return;
          const progressPercent = Math.round((i / maxToFetch) * 100);
          setProgress(progressPercent);
          addLog(`Step 3: Fetching tracks for "${resolved[i].name}" ${i + 1}/${maxToFetch} (${progressPercent}%)`);
          try {
            const tracks = await getArtistTopTracks(resolved[i].id, tokenRef, 'from_token');
            if (currentRunId !== runIdRef.current || abortRef.current) return;
            if (tracks) {
              addLog(`Step 3 Match: Fetched ${tracks.length} tracks for "${resolved[i].name}".`);
              tracks.slice(0, 10).forEach(t => candidateTracks.push({ ...t, _artistSimilarity: resolved[i]._lastfmScore }));
            } else {
              addLog(`Step 3 Match Failed: No tracks returned for artist "${resolved[i].name}".`);
            }
          } catch (err) {
            addLog(`Step 3 Error fetching tracks for "${resolved[i].name}": ${err.message || err}`);
            if (err.message === 'RATE_LIMIT_EXCEEDED') {
              throw err;
            }
          }
          await delay(600);
        }

        // No track candidates retrieved for any matched artists on Spotify
        if (candidateTracks.length === 0) {
          setError({
            message: 'Could not fetch any tracks for the matched artists on Spotify. Please try again!',
            recoverable: true
          });
          setStep(-1);
          return;
        }

        addLog(`Step 3 Success: Fetched ${candidateTracks.length} total tracks.`);

        // STEP 4: Build exclusion set (Cached!)
        setStep(4);
        setProgress(0);
        if (currentRunId !== runIdRef.current || abortRef.current) return;
        addLog('Step 4: Compiling listening history exclusion set to prevent duplicates...');
        if (!cachedExclusionSet) {
          const [topTracks, recentTracks, savedTracks] = await Promise.allSettled([
            getTopTracks(tokenRef),
            getRecentlyPlayed(tokenRef),
            getSavedTracks(tokenRef),
          ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));

          if (currentRunId !== runIdRef.current || abortRef.current) return;
          if (!topTracks.length && !recentTracks.length) {
            addWarning('Could not fetch your listening history fully. Some heard tracks may appear in recommendations.');
            addLog('Step 4 Warning: User listening history profiles returned empty.');
          }
          cachedExclusionSet = buildExclusionSet(topTracks, recentTracks, savedTracks);
        } else {
          addLog('Step 4: Using cached listening history exclusion set.');
        }

        addLog(`Step 4 Success: Excluded ${cachedExclusionSet.size} already heard tracks.`);

        // STEP 5: Filter
        setStep(5);
        setProgress(0);
        if (currentRunId !== runIdRef.current || abortRef.current) return;
        addLog('Step 5: Filtering listening history exclusion set from candidates...');
        const fresh = filterCandidateTracks(candidateTracks, cachedExclusionSet);
        addLog(`Step 5 Success: Retained ${fresh.length}/${candidateTracks.length} unheard tracks.`);

        if (fresh.length === 0) {
          const nextRange = getNextTimeRange(currentTimeRange, triedRanges);
          if (nextRange) {
            const prevRange = currentTimeRange;
            currentTimeRange = nextRange;
            triedRanges.add(currentTimeRange);
            addWarning(`Heard everything in ${formatRangeName(prevRange)}! Automatically scanning ${formatRangeName(nextRange)}...`);
            addLog(`Step 5: Already heard everything in ${formatRangeName(prevRange)}. Scanning ${formatRangeName(nextRange)}...`);
            continue;
          }
          
          // RESILIENT RECOVERY: If all ranges are exhausted and user has heard EVERYTHING we compiled:
          // Instead of failing or popping up an error card, show all candidates unfiltered and add a warning!
          addWarning("You've already heard all generated candidates! Showing them anyway.");
          addLog("Step 5 Warning: User has heard all compiled candidates. Disabling filter to prevent empty recommendations.");
          
          setStep(6);
          setProgress(0);
          const scored = candidateTracks.map(t => ({ ...t, _score: scoreTrack(t, t._artistSimilarity) }));
          const ranked = rankTracks(scored, 25);
          setRecommendations(ranked);
          setStep(-1);
          return;
        }

        // STEP 6: Score + rank
        setStep(6);
        setProgress(0);
        if (currentRunId !== runIdRef.current || abortRef.current) return;
        addLog('Step 6: Ranking and scoring recommendations...');
        const scored = fresh.map(t => ({ ...t, _score: scoreTrack(t, t._artistSimilarity) }));
        const ranked = rankTracks(scored, 25);

        setRecommendations(ranked);
        setStep(-1); // Done
        addLog(`Pipeline finished successfully! Generated ${ranked.length} custom recommendations.`);
        return;

      } catch (err) {
        console.error('Pipeline error:', err);
        addLog(`Pipeline failed with exception: ${err.message || err}`);
        if (err.message === 'RATE_LIMIT_EXCEEDED') {
          setError({
            message: 'Spotify API rate limits were exceeded due to high traffic. Please wait a minute and click retry.',
            recoverable: true,
            fallback: 'retry',
          });
        } else {
          setError({
            message: 'Something went wrong while building your recommendations. Please try again.',
            recoverable: true,
            fallback: 'retry',
          });
        }
        setStep(-1);
        return;
      }
    }
  }, [tokenRef, addLog]);

  // Helper functions for automatic recovery cycling
  function getNextTimeRange(current, tried) {
    const order = ['medium_term', 'long_term', 'short_term'];
    for (const range of order) {
      if (!tried.has(range)) {
        return range;
      }
    }
    return null;
  }

  function formatRangeName(range) {
    const names = {
      'medium_term': 'Medium Term',
      'long_term': 'Long Term',
      'short_term': 'Short Term'
    };
    return names[range] ?? range;
  }

  const abort = useCallback(() => { runIdRef.current += 1; abortRef.current = true; setStep(-1); }, []);

  return { run, abort, step, progress, recommendations, error, warnings, logs, PIPELINE_STEPS };
}
