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

export const runtime = 'nodejs';

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const MAX_STATUS_FAILURES = 12;

const FEATURED_CHANNELS = {
  starTalk: {
    title: 'StarTalk',
    url: 'https://www.youtube.com/@StarTalk/videos',
  },
  pbsSpaceTime: {
    title: 'PBS Space Time',
    url: 'https://www.youtube.com/@pbsspacetime/videos',
  },
} as const;

// ── YouTube Logic (Simplified/Robust) ─────────────────────────────────────────

function extractJsonObject(text: string, marker: string): string | null {
  const start = text.indexOf(marker);
  if (start === -1) return null;
  const braceStart = text.indexOf('{', start);
  if (braceStart === -1) return null;
  let depth = 0; let inString = false; let escaped = false;
  for (let i = braceStart; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; continue; }
    if (char === '{') { depth += 1; continue; }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(braceStart, i + 1);
    }
  }
  return null;
}

function collectRenderers(value: any, output: any[] = []): any[] {
  if (!value || typeof value !== 'object') return output;
  if (Array.isArray(value)) {
    for (const entry of value) collectRenderers(entry, output);
    return output;
  }
  if (value.gridVideoRenderer) output.push(value.gridVideoRenderer);
  if (value.videoRenderer) output.push(value.videoRenderer);
  for (const child of Object.values(value)) collectRenderers(child, output);
  return output;
}

function rendererToEpisode(renderer: any) {
  const videoId = renderer.videoId || renderer.navigationEndpoint?.watchEndpoint?.videoId || null;
  const title = renderer.title?.simpleText || renderer.title?.runs?.map((r: any) => r.text).join('') || '';
  const publishedAt = renderer.publishedTimeText?.simpleText || '';
  if (!videoId || !title) return null;
  return {
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    source: 'YouTube',
    publishedAt,
    type: 'video' as const,
    videoId,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

async function fetchLatestYouTubeEpisodes(channelTitle: string, channelUrl: string) {
  const response = await fetch(channelUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AtlantaGleaner/1.0)' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const jsonText = extractJsonObject(html, 'ytInitialData');
  if (!jsonText) throw new Error(`ytInitialData not found`);
  const data = JSON.parse(jsonText);
  const episodes = collectRenderers(data)
    .map(rendererToEpisode)
    .filter(Boolean)
    .slice(0, 3);
  return episodes;
}

async function buildFeaturedSeries(title: string, channelUrl: string, slot: string): Promise<GleanerItem> {
  const episodes = await fetchLatestYouTubeEpisodes(title, channelUrl);
  return {
    title,
    url: channelUrl,
    source: `Official ${title} uploads`,
    publishedAt: episodes[0]?.publishedAt || '',
    type: 'series',
    score: 1000,
    slot,
    episodes: episodes as any,
  };
}

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
  
  // 1. Fetch Featured
  const [starTalk, pbs] = await Promise.all([
    buildFeaturedSeries(FEATURED_CHANNELS.starTalk.title, FEATURED_CHANNELS.starTalk.url, 'science_pin'),
    buildFeaturedSeries(FEATURED_CHANNELS.pbsSpaceTime.title, FEATURED_CHANNELS.pbsSpaceTime.url, 'science_pin'),
  ]);

  // 2. Fetch News Pool
  const allQueries: EditorialQuery[] = Object.values(EDITORIAL_QUERIES).flat();
  const searchResults = await Promise.all(allQueries.map(serperSearch));
  
  const processed = searchResults.flat().map(item => ({
    ...item,
    score: scoreItem(item),
    slot: inferSlot(item)
  })).sort((a, b) => b.score - a.score);

  // 3. Selection with Source Diversity
  const seen = new Set([starTalk.url, pbs.url]);
  const finalItems: GleanerItem[] = [starTalk, pbs];
  const sourceCounts: Record<string, number> = {};

  for (const item of processed) {
    if (finalItems.length >= FEED_TARGETS.total) break;
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
