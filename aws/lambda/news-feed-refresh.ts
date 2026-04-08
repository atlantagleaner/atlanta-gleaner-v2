/**
 * AWS Lambda function for Atlanta Gleaner news feed PRIMARY refresh.
 *
 * Scheduled to run via EventBridge at 6 AM & 7 AM UTC daily.
 * Builds complete 20-item news feed with featured series (YouTube + Spotify) + news articles.
 *
 * This is the PRIMARY refresh mechanism, providing independent reliability.
 * Vercel Cron (4-5 AM UTC) serves as automatic backup.
 *
 * Environment variables required:
 * - SERPER_API_KEY: Google Serper API key for news search
 * - YOUTUBE_API_KEY: YouTube Data API v3 key
 * - SPOTIFY_CLIENT_ID: Spotify API client ID
 * - SPOTIFY_CLIENT_SECRET: Spotify API client secret
 * - SPOTIFY_SHOW_IDS: Comma-separated Spotify show IDs for Audio Dispatch
 * - BLOB_READ_WRITE_TOKEN: Vercel Blob API token
 * - EDGE_CONFIG_ID: Vercel Edge Config ID
 * - VERCEL_API_TOKEN: Vercel API token
 */

import { Readable } from 'stream';
import retry from 'async-retry';

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

// All 30 Spotify shows (editorial source pool)
// Audio Dispatch curates 8 episodes from these 30 based on editorial voice
const ALL_SPOTIFY_SHOW_IDS = [
  // Bill Simmons Universe (5)
  '07SjDmKb9iliEzpNcN2xGD',  // The Bill Simmons Podcast
  '1lUPomulZRPquVAOOd56EW',  // The Rewatchables
  '6mTel3azvnK8isLs4VujvF',  // The Big Picture
  '3IcA76e8ZV0NNSJ81XHQUg',  // The Watch
  '4hI3rQ4C0e15rP3YKLKPut',  // Higher Learning
  // History (8)
  '7Cvsbcjhtur7nplC148TWy',  // The Rest is History
  '4Zkj8TTa7XAZYI6aFetlec',  // Stuff You Missed in History Class
  '3Lk9LufHHM9AzVoyYvcI7R',  // Our Fake History
  '2ejvdShhn5D9tlVbb5vj9B',  // Behind the Bastards
  '05lvdf9T77KE6y4gyMGEsD',  // Revolutions
  '3iCqE2fH3ETuXx67BWqFPV',  // Stuff You Didn't Know About
  '34RuD4w8IVNm49Ge9qzjwT',  // Cabinet of Curiosities
  '6Z0jGDQp46d69cja0EUFQe',  // The Bugle
  // Science (8)
  '1mNsuXfG95Lf76YQeVMuo1',  // StarTalk Radio
  '5nvRkVMH58SelKZYZFZx1S',  // Ologies
  '2hmkzUtix0qTqvtpPcMzEL',  // Radiolab
  '2rTT1klKUoQNuaW2Ah19Pa',  // Short Wave
  '6Ijz5uEUxN6FvJI49ZGJAJ',  // The Infinite Monkey Cage
  '0QCiNINmwgA6X4Z4nlnh5G',  // Sawbones
  '5lY4b5PGOvMuOYOjOVEcb9',  // Science Vs
  '0ofXAdFIQQRsCYj9754UFx',  // Stuff You Should Know
  // Culture & Analysis (7)
  '2VRS1IJCTn2Nlkg33ZVfkM',  // 99% Invisible
  '4ZTHlQzCm7ipnRn1ypnl1Z',  // The New Yorker Radio Hour
  '08F60fHBihlcqWZTr7Thzc',  // On Being
  '1vfOw64nKjQ8LzZDPCfRaO',  // TED Radio Hour
  '1sgWaKtQxwfjUpZnnK8r7J',  // Switched On Pop
  '6XKe8xy5P16OLrkBW9oz0k',  // Articles of Interest
  '08F60fHBihlcqWZTr7Thzc',  // The Ezra Klein Show
  // International & Depth (2)
  '6Mwp0XM22DGXDva9SE3J8x',  // Kerning Cultures
  '269rqhbJIyaCbIzEI4BzCz',  // Unexplained
];

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

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  retries: number = 3
): Promise<T> {
  return retry(async (bail) => {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`[retry] ${label} failed: ${error.message}`);
      }
      throw error;
    }
  }, {
    retries,
    minTimeout: 500,
    maxTimeout: 2000,
    onRetry: (err, attempt) => {
      console.log(`[retry] ${label} attempt ${attempt} after: ${err.message}`);
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// API Integrations
// ─────────────────────────────────────────────────────────────────────────────

async function serperSearch(query: string, boost: number): Promise<GleanerItem[]> {
  if (!SERPER_API_KEY) {
    console.warn('[serperSearch] No SERPER_API_KEY provided');
    return [];
  }

  return withRetry(async () => {
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
      throw new Error(`HTTP ${res.status} for "${query}"`);
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
  }, `SerperSearch:${query.slice(0, 30)}`).catch((error) => {
    console.error(`[serperSearch] Failed after retries for query "${query}":`, error);
    return [];
  });
}

async function fetchSpotifyEpisodes(): Promise<GleanerItem | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret || ALL_SPOTIFY_SHOW_IDS.length === 0) {
    console.warn('[fetchSpotifyEpisodes] Missing Spotify credentials or show IDs');
    return null;
  }

  return withRetry(async () => {
    // Get access token
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

    // Fetch episodes from all shows in parallel with rate limiting
    console.log(`[fetchSpotifyEpisodes] Fetching from ${ALL_SPOTIFY_SHOW_IDS.length} shows...`);
    const episodeResults = await Promise.allSettled(
      ALL_SPOTIFY_SHOW_IDS.map((showId) =>
        (async () => {
          const episodeRes = await fetchWithTimeout(
            `https://api.spotify.com/v1/shows/${showId}/episodes?limit=1`,
            {
              headers: { 'Authorization': `Bearer ${access_token}` },
              timeoutMs: FETCH_TIMEOUTS.SPOTIFY,
              label: `SpotifyEpisodes:${showId}`,
            }
          );

          if (!episodeRes.ok) {
            throw new Error(`HTTP ${episodeRes.status} for show ${showId}`);
          }

          const data = (await episodeRes.json()) as { items?: Array<any> };
          return data.items?.[0] ? { showId, episode: data.items[0] } : null;
        })()
      )
    );

    // Extract successful episodes
    const allEpisodes: Array<GleanerEpisode & { publishDate: Date }> = [];
    let failureCount = 0;

    for (const result of episodeResults) {
      if (result.status === 'fulfilled' && result.value) {
        const { episode } = result.value;
        const publishDate = new Date(episode.release_date || new Date().toISOString());

        allEpisodes.push({
          title: episode.name,
          url: episode.external_urls?.spotify || '',
          source: episode.show?.name || 'Spotify',
          publishedAt: publishDate.toISOString(),
          type: 'audio',
          spotifyId: episode.id,
          thumbnailUrl: episode.images?.[0]?.url || '',
          publishDate,
        });
      } else if (result.status === 'rejected') {
        failureCount++;
      }
    }

    if (failureCount > 0) {
      console.warn(`[fetchSpotifyEpisodes] ${failureCount}/${ALL_SPOTIFY_SHOW_IDS.length} shows failed`);
    }

    if (allEpisodes.length === 0) {
      throw new Error('No Spotify episodes found');
    }

    // Score episodes by freshness and pick top 8
    const now = new Date();
    const scored = allEpisodes.map((ep) => {
      const ageMs = now.getTime() - ep.publishDate.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const freshnessScore = ageDays < 7 ? 100 : Math.max(0, 100 - ageDays * 2);

      return { ...ep, freshnessScore };
    });

    const curated = scored
      .sort((a, b) => b.freshnessScore - a.freshnessScore)
      .slice(0, 8)
      .map(({ publishDate, freshnessScore, ...ep }) => ep);

    console.log(`[fetchSpotifyEpisodes] ✓ Curated 8 from ${allEpisodes.length} episodes`);

    return {
      title: 'Audio Dispatch',
      url: 'https://open.spotify.com',
      source: 'Spotify',
      publishedAt: curated[0]?.publishedAt || new Date().toISOString(),
      type: 'series',
      score: 1000,
      slot: 'audio_dispatch',
      episodes: curated,
    };
  }, 'SpotifyEpisodes', 2).catch((error) => {
    console.error('[fetchSpotifyEpisodes] Failed after retries:', error);
    return null;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Feed Building
// ─────────────────────────────────────────────────────────────────────────────

// Fetch YouTube videos for a channel
async function fetchYoutubeVideos(channelId: string, limit: number = 3): Promise<GleanerEpisode[]> {
  if (!process.env.YOUTUBE_API_KEY) return [];

  return withRetry(async () => {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=${limit}&key=${process.env.YOUTUBE_API_KEY}&type=video`;
    const response = await fetchWithTimeout(url, {
      timeoutMs: FETCH_TIMEOUTS.YOUTUBE,
      label: `YouTubeChannel:${channelId}`,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for channel ${channelId}`);
    }

    const data = (await response.json()) as any;
    return (data.items || [])
      .map((item: any) => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        source: 'YouTube',
        publishedAt: item.snippet.publishedAt,
        type: 'video' as const,
        videoId: item.id.videoId,
        thumbnailUrl: item.snippet.thumbnails.high?.url || '',
      }))
      .slice(0, limit);
  }, `YouTubeChannel:${channelId}`, 2).catch((error) => {
    console.warn(`[fetchYoutubeVideos] Failed after retries for channel ${channelId}:`, error);
    return [];
  });
}

async function buildNewsFeed(): Promise<GleanerItem[]> {
  const finalItems: GleanerItem[] = [];

  console.log('[buildNewsFeed] Fetching featured series...');

  // 1. FEATURED SERIES (Drawers)
  // StarTalk
  const starTalkVideos = await fetchYoutubeVideos('UCfV36TX5AejfAGIBtwTc8Zw', 3);
  if (starTalkVideos.length > 0) {
    finalItems.push({
      title: 'StarTalk',
      url: 'https://www.youtube.com/@StarTalk/videos',
      source: 'YouTube',
      publishedAt: new Date().toISOString(),
      type: 'series',
      score: 1000,
      slot: 'science_pin',
      episodes: starTalkVideos,
    });
  }

  // PBS Space Time
  const pbsVideos = await fetchYoutubeVideos('UCxmkLd4JfSQNEtQ05ngeB3A', 3);
  if (pbsVideos.length > 0) {
    finalItems.push({
      title: 'PBS Space Time',
      url: 'https://www.youtube.com/@pbsspacetime/videos',
      source: 'YouTube',
      publishedAt: new Date().toISOString(),
      type: 'series',
      score: 1000,
      slot: 'science_pin',
      episodes: pbsVideos,
    });
  }

  // Grab Bag (science variety)
  const grabBagChannels = [
    { id: 'UCJic7bfKsKA-IYM_zXC-7vQ', name: 'Kurzgesagt' },
    { id: 'UCO0jGfsQ35gPCYAspkEKDOA', name: 'NOVA PBS Official' },
  ];
  const grabBagVideos: GleanerEpisode[] = [];
  for (const channel of grabBagChannels) {
    const videos = await fetchYoutubeVideos(channel.id, 4);
    grabBagVideos.push(...videos);
  }
  if (grabBagVideos.length > 0) {
    finalItems.push({
      title: 'Grab Bag',
      url: 'https://www.youtube.com/',
      source: 'YouTube',
      publishedAt: new Date().toISOString(),
      type: 'series',
      score: 1000,
      slot: 'grab_bag',
      episodes: grabBagVideos.slice(0, 8),
    });
  }

  // Audio Dispatch (Spotify)
  console.log('[buildNewsFeed] Fetching Spotify episodes...');
  const spotify = await fetchSpotifyEpisodes();
  if (spotify) {
    finalItems.push(spotify);
  }

  // 2. NEWS ARTICLES
  console.log('[buildNewsFeed] Fetching news articles...');
  const newsPool: GleanerItem[] = [];

  const queries = [
    { query: 'Atlanta news WSB', boost: 80 },
    { query: 'Georgia local news', boost: 75 },
    { query: 'CNN breaking news', boost: 65 },
    { query: 'Atlanta business', boost: 60 },
    { query: 'Georgia politics', boost: 58 },
    { query: 'Atlanta legal news', boost: 55 },
  ];

  for (const { query, boost } of queries) {
    const results = await serperSearch(query, boost);
    newsPool.push(...results);
  }

  // Deduplicate news
  const seen = new Set<string>();
  seen.add('https://www.youtube.com');
  seen.add('https://open.spotify.com');

  for (const item of finalItems) {
    seen.add(item.url);
  }

  // Add news articles up to 20 total items (4 drawers + 16 news)
  for (const item of newsPool.sort((a, b) => b.score - a.score)) {
    if (finalItems.length >= 20) break;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    finalItems.push(item);
  }

  console.log(`[buildNewsFeed] Built feed: ${finalItems.length} items`);
  return finalItems;
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

  return withRetry(async () => {
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
  }, 'BlobUpload', 3);
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

  return withRetry(async () => {
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
  }, 'EdgeConfigUpdate', 3);
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

    // Update Edge Config with backup reference (PRIMARY - Lambda provides the source of truth via Blob)
    console.log('[news-feed-refresh] Updating Edge Config...');
    await updateEdgeConfig('news_cache_backup', {
      blobUrl,
      cachedAt: cacheEntry.cachedAt,
      count: cacheEntry.items.length,
      source: 'lambda-primary',
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
