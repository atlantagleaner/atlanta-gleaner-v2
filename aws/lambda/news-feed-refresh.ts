/**
 * AWS Lambda function for Atlanta Gleaner news feed backup refresh.
 *
 * Scheduled to run via EventBridge at 5 PM UTC daily (12 hours after Vercel cron).
 * Builds fresh news feed and saves to Vercel Blob with 'backup' prefix.
 *
 * This provides a secondary, independent backup refresh to ensure feed availability
 * even if the primary Vercel cron fails.
 *
 * Environment variables required:
 * - SERPER_API_KEY: Google Serper API key for news search
 * - YOUTUBE_API_KEY: YouTube Data API v3 key (optional, fallback to scrape)
 * - SPOTIFY_CLIENT_ID: Spotify API client ID
 * - SPOTIFY_CLIENT_SECRET: Spotify API client secret
 * - SPOTIFY_SHOW_IDS: Comma-separated Spotify show IDs for Audio Dispatch
 * - BLOB_READ_WRITE_TOKEN: Vercel Blob API token
 * - EDGE_CONFIG_ID: Vercel Edge Config ID
 * - VERCEL_API_TOKEN: Vercel API token
 */

import { Readable } from 'stream';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface GleanerEpisode {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  type: 'video' | 'audio';
  videoId?: string;
  spotifyId?: string;
  thumbnailUrl?: string;
}

interface GleanerItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  type: 'series' | 'text' | 'video';
  score: number;
  slot: string;
  episodes?: GleanerEpisode[];
}

interface CacheEntry {
  items: GleanerItem[];
  cachedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

const FETCH_TIMEOUTS = {
  SERPER: 10_000,
  YOUTUBE: 15_000,
  SPOTIFY: 20_000,
};

// ─────────────────────────────────────────────────────────────────────────────
// Fetch Utilities
// ─────────────────────────────────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string | URL,
  options: RequestInit & { timeoutMs: number; label?: string }
): Promise<Response> {
  const { timeoutMs, label = 'request', ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[fetchWithTimeout] Timeout (${timeoutMs}ms) for ${label}`);
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout (${timeoutMs}ms) for ${label}`);
    }
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API Integrations
// ─────────────────────────────────────────────────────────────────────────────

async function serperSearch(query: string, boost: number): Promise<GleanerItem[]> {
  if (!SERPER_API_KEY) {
    console.warn('[serperSearch] No SERPER_API_KEY provided');
    return [];
  }

  try {
    const res = await fetchWithTimeout(`https://google.serper.dev/news`, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 10 }),
      timeoutMs: FETCH_TIMEOUTS.SERPER,
      label: `SerperSearch:${query.slice(0, 30)}`,
    });

    if (!res.ok) {
      console.error(`[serperSearch] HTTP ${res.status} for "${query}"`);
      return [];
    }

    const data = (await res.json()) as { news?: Array<any> };
    const rows = data.news || [];

    return rows
      .map((row: any) => ({
        title: row.title,
        url: row.link,
        source: row.source || 'Web',
        publishedAt: row.date || new Date().toISOString(),
        type: 'text' as const,
        score: boost,
        slot: 'news',
      }))
      .filter((item: any) => item.title && item.url);
  } catch (error) {
    console.error(`[serperSearch] Error for query "${query}":`, error);
    return [];
  }
}

async function fetchSpotifyEpisodes(): Promise<GleanerItem | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const showIds = (process.env.SPOTIFY_SHOW_IDS || '').split(',').filter(Boolean);

  if (!clientId || !clientSecret || showIds.length === 0) {
    console.warn('[fetchSpotifyEpisodes] Missing Spotify credentials or show IDs');
    return null;
  }

  try {
    // Authenticate
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const authRes = await fetchWithTimeout('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      timeoutMs: FETCH_TIMEOUTS.SPOTIFY,
      label: 'SpotifyAuth',
    });

    if (!authRes.ok) {
      throw new Error(`Spotify auth failed: ${authRes.statusText}`);
    }

    const { access_token } = (await authRes.json()) as { access_token: string };

    // Fetch episodes with limited concurrency
    const episodes: GleanerEpisode[] = [];
    for (const showId of showIds.slice(0, 8)) {
      try {
        const episodeRes = await fetchWithTimeout(
          `https://api.spotify.com/v1/shows/${showId}/episodes?limit=1`,
          {
            headers: { 'Authorization': `Bearer ${access_token}` },
            timeoutMs: FETCH_TIMEOUTS.SPOTIFY,
            label: `SpotifyEpisodes:${showId}`,
          }
        );

        if (!episodeRes.ok) continue;

        const data = (await episodeRes.json()) as { items?: Array<any> };
        if (data.items?.[0]) {
          const ep = data.items[0];
          episodes.push({
            title: ep.name,
            url: ep.external_urls?.spotify || '',
            source: ep.show?.name || 'Spotify',
            publishedAt: ep.release_date || new Date().toISOString(),
            type: 'audio',
            spotifyId: ep.id,
            thumbnailUrl: ep.images?.[0]?.url || '',
          });
        }
      } catch (err) {
        console.warn(`[fetchSpotifyEpisodes] Failed for show ${showId}:`, err);
        continue;
      }
    }

    if (episodes.length === 0) {
      return null;
    }

    return {
      title: 'Audio Dispatch',
      url: 'https://open.spotify.com',
      source: 'Spotify',
      publishedAt: episodes[0]?.publishedAt || new Date().toISOString(),
      type: 'series',
      score: 1000,
      slot: 'audio_dispatch',
      episodes,
    };
  } catch (error) {
    console.error('[fetchSpotifyEpisodes] Error:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Feed Building
// ─────────────────────────────────────────────────────────────────────────────

async function buildNewsFeed(): Promise<GleanerItem[]> {
  const items: GleanerItem[] = [];

  // Fetch from key editorial queries
  const queries = [
    { query: 'Atlanta news WSB', boost: 70 },
    { query: 'Georgia local news', boost: 72 },
    { query: 'CNN news today', boost: 18 },
    { query: 'Atlanta business news', boost: 65 },
    { query: 'Georgia tech news', boost: 40 },
    { query: 'Atlanta real estate', boost: 50 },
  ];

  for (const { query, boost } of queries) {
    const results = await serperSearch(query, boost);
    items.push(...results);
  }

  // Add Spotify
  const spotify = await fetchSpotifyEpisodes();
  if (spotify) {
    items.push(spotify);
  }

  // Simple scoring and deduplication
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort by score and limit to 20
  return unique.sort((a, b) => b.score - a.score).slice(0, 20);
}

// ─────────────────────────────────────────────────────────────────────────────
// Blob Storage
// ─────────────────────────────────────────────────────────────────────────────

async function saveToBlob(
  path: string,
  data: CacheEntry
): Promise<string> {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN');
  }

  const response = await fetchWithTimeout(`https://blob.vercel-storage.com/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${BLOB_READ_WRITE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    timeoutMs: 30_000,
    label: 'BlobUpload',
  });

  if (!response.ok) {
    throw new Error(`Blob upload failed: ${response.statusText}`);
  }

  const result = (await response.json()) as { url: string };
  return result.url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge Config
// ─────────────────────────────────────────────────────────────────────────────

async function updateEdgeConfig(
  key: string,
  value: any
): Promise<void> {
  if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) {
    throw new Error('Missing Edge Config credentials');
  }

  const response = await fetchWithTimeout(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ operation: 'upsert', key, value }],
      }),
      timeoutMs: 30_000,
      label: 'EdgeConfigUpdate',
    }
  );

  if (!response.ok) {
    throw new Error(`Edge Config update failed: ${await response.text()}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lambda Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function handler(event: any) {
  console.log('[news-feed-refresh] Starting AWS Lambda refresh...');
  const startTime = Date.now();

  try {
    // Build fresh news feed
    console.log('[news-feed-refresh] Building news feed...');
    const items = await buildNewsFeed();
    console.log(`[news-feed-refresh] Built feed with ${items.length} items`);

    if (items.length === 0) {
      throw new Error('Failed to build feed: no items returned');
    }

    // Create cache entry
    const cacheEntry: CacheEntry = {
      items,
      cachedAt: new Date().toISOString(),
    };

    // Save to Blob
    console.log('[news-feed-refresh] Saving to Vercel Blob...');
    const blobUrl = await saveToBlob('news-feed/backup.json', cacheEntry);
    console.log('[news-feed-refresh] Blob saved:', blobUrl);

    // Update Edge Config with backup reference
    console.log('[news-feed-refresh] Updating Edge Config...');
    await updateEdgeConfig('news_cache_backup', {
      blobUrl,
      cachedAt: cacheEntry.cachedAt,
    });

    const duration = Date.now() - startTime;
    console.log(`[news-feed-refresh] ✓ Completed successfully in ${duration}ms`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message: 'News feed refresh successful',
        items: items.length,
        duration: `${duration}ms`,
        cachedAt: cacheEntry.cachedAt,
        blobUrl,
      }),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[news-feed-refresh] ✗ Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: error.message,
        duration: `${duration}ms`,
      }),
    };
  }
}
