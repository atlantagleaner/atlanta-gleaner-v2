// Atlanta Gleaner - Daily News Refresh Cron
//
// Runs daily via Vercel Cron.
// This route builds the cached feed and writes it to Edge Config.

import { EDITORIAL_QUERIES, FEED_TARGETS } from '@/lib/newsConfig';
import type { EditorialQuery } from '@/lib/newsConfig';
import { createCacheEntry, scoreItem, inferSlot } from '@/lib/news/utils';
import type { CacheEntry, GleanerItem } from '@/lib/news/types';
import { resolveFeedEntry, saveFeedEntry } from '@/lib/newsFeedCache';
import type { CacheReference } from '@/lib/newsFeedCache';
import { ensureReaderDocument } from '@/lib/newsReader';
import { LIVE_CACHE_KEY, PREPARE_DELAY_MS, STAGED_CACHE_KEY, STATUS_CACHE_KEY } from '@/lib/newsRefresh';
import type { RefreshFailure, RefreshStatus } from '@/lib/newsRefresh';
import { get } from '@vercel/edge-config';
import {
  buildFeaturedSeriesItem,
  buildScienceGrabBagItem,
  FEATURED_YOUTUBE_CHANNELS,
} from '@/lib/youtubeFeed';
import { buildAudioDispatchItem } from '@/lib/spotifyFeed';

export const runtime = 'nodejs';

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const MAX_STATUS_FAILURES = 12;

// ── Serper Logic ─────────────────────────────────────────────────────────────

async function serperSearch(query: EditorialQuery): Promise<GleanerItem[]> {
  if (!SERPER_API_KEY) return [];
  try {
    const res = await fetch(`https://google.serper.dev/${query.endpoint}`, {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query.q, num: query.num }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rows = data[query.endpoint] || data.organic || [];
    return rows.map((row: any) => ({
      title: row.title,
      url: row.link,
      source: row.source || row.channel || 'Web',
      publishedAt: row.date || '',
      type: (row.link?.includes('youtube.com') ? 'video' : 'text') as any,
      score: query.boost,
      slot: 'news',
    })).filter((item: any) => item.title && item.url);
  } catch (error) {
    console.error(`[serperSearch] Error for query "${query.q}":`, error);
    return [];
  }
}

// ── Core Engine ───────────────────────────────────────────────────────────────

async function buildNewsFeed(options?: { prewarmReaders?: boolean }) {
  const failures: RefreshFailure[] = [];

  // 1. Featured series (YouTube Data API when YOUTUBE_API_KEY is set; else HTML scrape fallback)
  // 2. Audio Dispatch (Spotify podcasts)
  const [starTalk, pbs, grabBag, audioDispatch] = await Promise.all([
    buildFeaturedSeriesItem(
      FEATURED_YOUTUBE_CHANNELS.starTalk.title,
      FEATURED_YOUTUBE_CHANNELS.starTalk.url,
      FEATURED_YOUTUBE_CHANNELS.starTalk.channelId,
      'science_pin',
    ),
    buildFeaturedSeriesItem(
      FEATURED_YOUTUBE_CHANNELS.pbsSpaceTime.title,
      FEATURED_YOUTUBE_CHANNELS.pbsSpaceTime.url,
      FEATURED_YOUTUBE_CHANNELS.pbsSpaceTime.channelId,
      'science_pin',
    ),
    buildScienceGrabBagItem(),
    buildAudioDispatchItem(),
  ]);

  // 3. Fetch News Pool
  const allQueries: EditorialQuery[] = Object.values(EDITORIAL_QUERIES).flat();
  const searchResults = await Promise.all(allQueries.map(serperSearch));

  const processed = searchResults.flat().map(item => ({
    ...item,
    score: scoreItem(item),
    slot: inferSlot(item)
  })).sort((a, b) => b.score - a.score);

  // 4. Selection with Source Diversity
  // Start with 4 drawer items (StarTalk, PBS, GrabBag, AudioDispatch) + need 16 news articles = 20 total
  const seen = new Set([starTalk.url, pbs.url, grabBag.url]);
  const finalItems: GleanerItem[] = [starTalk, pbs, grabBag, audioDispatch];
  const sourceCounts: Record<string, number> = {};
  const newsTarget = FEED_TARGETS.news; // 16 news articles

  for (const item of processed) {
    if (finalItems.length >= (4 + newsTarget)) break; // 4 drawers + 16 news = 20
    if (seen.has(item.url)) continue;

    const source = item.source || 'Web';
    const currentCount = sourceCounts[source] || 0;
    if (currentCount >= 2) continue;

    // Optional: Prewarm
    if (options?.prewarmReaders && item.type === 'text') {
      try {
        await ensureReaderDocument(item.url, { title: item.title, source: item.source });
        await new Promise(r => setTimeout(r, PREPARE_DELAY_MS));
      } catch (e) {
        failures.push({ title: item.title, url: item.url, source: item.source, error: String(e) });
        continue;
      }
    }

    seen.add(item.url);
    sourceCounts[source] = currentCount + 1;
    finalItems.push(item);
  }

  return { items: finalItems, failures };
}

// ── Infrastructure ────────────────────────────────────────────────────────────

async function writeToEdgeConfigItems(entries: Array<{ key: string; value: unknown }>) {
  if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) throw new Error('Missing Vercel credentials');
  const res = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: entries.map(e => ({ operation: 'upsert', key: e.key, value: e.value })),
    }),
  });
  if (!res.ok) throw new Error(`Edge Config failed: ${await res.text()}`);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const requestUrl = new URL(request.url);
  const mode = requestUrl.searchParams.get('mode') === 'prepare' ? 'prepare' : 'publish';
  const forceRun = requestUrl.searchParams.get('force') === '1';

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    if (mode === 'prepare') {
      const { items, failures } = await buildNewsFeed({ prewarmReaders: true });
      const stagedEntry = createCacheEntry(items);
      const stagedRef = await saveFeedEntry('staged', stagedEntry);
      
      await writeToEdgeConfigItems([
        { key: STAGED_CACHE_KEY, value: stagedRef },
        { key: STATUS_CACHE_KEY, value: { 
            phase: 'prepare', 
            preparedAt: new Date().toISOString(), 
            failures: failures.slice(0, MAX_STATUS_FAILURES),
            counts: { selected: items.length, failures: failures.length }
          }
        }
      ]);

      return Response.json({ ok: true, mode, count: items.length });
    }

    // Publish
    const staged = await get<CacheReference>(STAGED_CACHE_KEY);
    let liveEntry = await resolveFeedEntry(staged);

    if (!liveEntry?.items.length) {
      const built = await buildNewsFeed({ prewarmReaders: false });
      liveEntry = createCacheEntry(built.items);
    }

    const liveRef = await saveFeedEntry('live', liveEntry);
    await writeToEdgeConfigItems([
      { key: LIVE_CACHE_KEY, value: liveRef },
      { key: STATUS_CACHE_KEY, value: { 
          phase: 'publish', 
          publishedAt: new Date().toISOString(), 
          counts: { selected: liveEntry.items.length, failures: 0 } 
        } 
      }
    ]);

    return Response.json({ ok: true, mode, count: liveEntry.items.length });
  } catch (error: any) {
    console.error('[cron/refresh-news] Error:', error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
