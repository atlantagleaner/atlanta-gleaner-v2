// ─────────────────────────────────────────────────────────────────────────────
// Spotify Feed Integration
// ─────────────────────────────────────────────────────────────────────────────

import type { GleanerItem } from '@/lib/news/types'
import { fetchWithTimeout, FETCH_TIMEOUTS } from '@/lib/fetchWithTimeout';

export interface SpotifyShow {
  id: string;
  name: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyEpisode {
  id: string;
  name: string;
  uri: string;
  release_date: string;
  show: SpotifyShow;
  images?: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
}

// Authenticate with Spotify Client Credentials flow
async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  console.log('[getSpotifyAccessToken] Checking env vars...');
  console.log('[getSpotifyAccessToken] clientId exists:', !!clientId);
  console.log('[getSpotifyAccessToken] clientSecret exists:', !!clientSecret);

  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  console.log('[getSpotifyAccessToken] Making auth request to Spotify...');
  const response = await fetchWithTimeout('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    timeoutMs: FETCH_TIMEOUTS.SPOTIFY,
    label: 'SpotifyAuth',
  });

  console.log('[getSpotifyAccessToken] Auth response status:', response.status);

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string };
  console.log('[getSpotifyAccessToken] Got access token');
  return data.access_token;
}

// Search for a podcast show by name
export async function searchSpotifyShow(query: string): Promise<SpotifyShow | null> {
  const token = await getSpotifyAccessToken();

  const response = await fetchWithTimeout(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=show&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      timeoutMs: FETCH_TIMEOUTS.SPOTIFY,
      label: `SpotifySearch:${query}`,
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify search failed: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    shows: {
      items: SpotifyShow[];
    };
  };

  return data.shows.items[0] || null;
}

// Get latest episodes from a show (with exponential backoff for rate limiting)
async function getShowEpisodesWithToken(showId: string, token: string, limit: number = 10, retries: number = 3): Promise<SpotifyEpisode[]> {
  console.log(`[getShowEpisodes] Fetching ${limit} episodes for show ${showId}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetchWithTimeout(
      `https://api.spotify.com/v1/shows/${showId}/episodes?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeoutMs: FETCH_TIMEOUTS.SPOTIFY,
        label: `SpotifyEpisodes:${showId}`,
      }
    );

    console.log(`[getShowEpisodes] Response status: ${response.status} (attempt ${attempt}/${retries})`);

    // Handle rate limiting with exponential backoff
    if (response.status === 429) {
      if (attempt < retries) {
        const delayMs = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
        console.log(`[getShowEpisodes] Rate limited (429), retrying after ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      } else {
        throw new Error(`Failed to fetch episodes after ${retries} attempts: Rate limited (429)`);
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch episodes: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      items: SpotifyEpisode[];
    };

    console.log(`[getShowEpisodes] Got ${data.items.length} episodes`);
    return data.items;
  }

  throw new Error('Failed to fetch episodes: max retries exceeded');
}

// Get latest episodes from a show (public API, gets its own token)
export async function getShowEpisodes(showId: string, limit: number = 10): Promise<SpotifyEpisode[]> {
  const token = await getSpotifyAccessToken();
  return getShowEpisodesWithToken(showId, token, limit);
}

// Helper: Execute promises with limited concurrency
async function executeWithLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 5,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  const executing: Promise<void>[] = [];

  for (const [index, task] of tasks.entries()) {
    const promise = Promise.resolve().then(task).then(
      (value) => {
        results[index] = { status: 'fulfilled', value };
      },
      (reason) => {
        results[index] = { status: 'rejected', reason };
      },
    );

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex((p) => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

// Get latest episodes from multiple shows (with limited concurrency to avoid rate limiting)
export async function getLatestEpisodes(showIds: string[]): Promise<SpotifyEpisode[]> {
  console.log(`[getLatestEpisodes] Fetching latest from ${showIds.length} shows`);

  // Get token once to avoid making 30+ auth requests
  const token = await getSpotifyAccessToken();

  // Create tasks with limited concurrency (5 at a time) to avoid Spotify rate limits
  const tasks = showIds.map((id) => () => getShowEpisodesWithToken(id, token, 1));
  const results = await executeWithLimit(tasks, 5);

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failureCount = results.filter(r => r.status === 'rejected').length;

  if (failureCount > 0) {
    console.log(`[getLatestEpisodes] WARNING: ${failureCount} shows failed to fetch`);
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.log(`  - Show ${idx}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
      }
    });
  }

  // Filter for successful results and flatten
  const flattened = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.status === 'fulfilled' ? result.value : [])
    .flat()
    .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());

  console.log(`[getLatestEpisodes] Got ${flattened.length} episodes from ${successCount}/${showIds.length} successful shows`);
  return flattened;
}

// Helper: Search for all podcasts and return their IDs
export async function searchAllPodcasts(podcastNames: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const name of podcastNames) {
    try {
      const show = await searchSpotifyShow(name);
      if (show) {
        results[name] = show.id;
        console.log(`✓ Found: ${name} → ${show.id}`);
      } else {
        console.log(`✗ Not found: ${name}`);
      }
    } catch (error) {
      console.error(`Error searching for ${name}:`, error);
    }
  }

  return results;
}

// Build audio dispatch drawer with latest podcast episodes
export async function buildAudioDispatchItem(): Promise<GleanerItem> {
  try {
    console.log('[buildAudioDispatchItem] Starting Spotify fetch...');
    const { SPOTIFY_SHOW_IDS_ARRAY } = await import('@/lib/newsConfig');
    console.log(`[buildAudioDispatchItem] Loaded ${SPOTIFY_SHOW_IDS_ARRAY.length} show IDs`);

    // Fetch latest episode from each show
    console.log('[buildAudioDispatchItem] Calling getLatestEpisodes...');
    const spotifyEpisodes = await getLatestEpisodes(SPOTIFY_SHOW_IDS_ARRAY);
    console.log(`[buildAudioDispatchItem] Got ${spotifyEpisodes.length} episodes`);

    // Transform to SeriesViewer-compatible format
    const episodes = spotifyEpisodes.slice(0, 8).map((ep) => ({
      title: ep.name,
      url: ep.external_urls.spotify,
      source: ep.show.name,
      publishedAt: ep.release_date,
      type: 'audio' as const,
      spotifyId: ep.id,
      thumbnailUrl: ep.images?.[0]?.url || '',
    }));

    console.log(`[buildAudioDispatchItem] Transformed ${episodes.length} episodes for display`);

    // Return GleanerItem-compatible structure
    return {
      title: 'Audio Dispatch',
      url: 'https://open.spotify.com',
      source: 'Spotify',
      publishedAt: episodes[0]?.publishedAt || new Date().toISOString(),
      type: 'series' as const,
      score: 1000,
      slot: 'audio_dispatch',
      episodes,
    };
  } catch (error) {
    console.error('[buildAudioDispatchItem] Spotify fetch failed:', {
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      title: 'Audio Dispatch',
      url: 'https://open.spotify.com',
      source: 'Spotify',
      publishedAt: new Date().toISOString(),
      type: 'series' as const,
      score: 1000,
      slot: 'audio_dispatch',
      episodes: [],
    };
  }
}
