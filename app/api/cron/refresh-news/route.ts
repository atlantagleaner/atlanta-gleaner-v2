// Atlanta Gleaner - Daily News Refresh Cron
//
// Runs once daily at 5:00 AM UTC (midnight ET) via Vercel Cron.
// This route builds the cached feed and writes it to Edge Config, where
// /api/news reads it for the next 24 hours.
//
// Slots 1 and 2 are sourced directly from the official StarTalk and
// PBS Space Time YouTube uploads pages. Each slot stores the three most
// recent regular videos, with shorts filtered out.

import { SEARCH_QUERIES, SLOT_TARGETS, SCORING } from '@/lib/newsConfig';
import type { SerperEndpoint } from '@/lib/newsConfig';
import type { CacheEntry, GleanerItem } from '@/app/api/news/route';

export const runtime = 'nodejs';

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

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

interface YoutubeEpisode {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  type: 'video';
  videoId: string;
  thumbnailUrl: string;
}

interface YoutubeRenderer {
  videoId?: string;
  title?: { runs?: Array<{ text?: string }>; simpleText?: string };
  publishedTimeText?: { simpleText?: string };
  thumbnailOverlays?: Array<{
    thumbnailOverlayTimeStatusRenderer?: {
      text?: { simpleText?: string };
    };
  }>;
  navigationEndpoint?: {
    watchEndpoint?: {
      videoId?: string;
    };
  };
}

function extractJsonObject(text: string, marker: string): string | null {
  const start = text.indexOf(marker);
  if (start === -1) return null;

  const braceStart = text.indexOf('{', start);
  if (braceStart === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = braceStart; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(braceStart, i + 1);
      }
    }
  }

  return null;
}

function collectRenderers(value: unknown, output: YoutubeRenderer[] = []): YoutubeRenderer[] {
  if (!value || typeof value !== 'object') return output;

  if (Array.isArray(value)) {
    for (const entry of value) collectRenderers(entry, output);
    return output;
  }

  const record = value as Record<string, unknown>;
  if (record.gridVideoRenderer && typeof record.gridVideoRenderer === 'object') {
    output.push(record.gridVideoRenderer as YoutubeRenderer);
  }
  if (record.videoRenderer && typeof record.videoRenderer === 'object') {
    output.push(record.videoRenderer as YoutubeRenderer);
  }

  for (const child of Object.values(record)) {
    collectRenderers(child, output);
  }

  return output;
}

function parseDurationSeconds(value: string | undefined): number | null {
  if (!value) return null;

  const parts = value.split(':').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return null;

  return parts.reduce((total, part) => total * 60 + part, 0);
}

function rendererToEpisode(renderer: YoutubeRenderer): YoutubeEpisode | null {
  const videoId =
    renderer.videoId ||
    renderer.navigationEndpoint?.watchEndpoint?.videoId ||
    null;

  const title =
    renderer.title?.simpleText ||
    renderer.title?.runs?.map((run) => run.text ?? '').join('').trim() ||
    '';

  const publishedAt = renderer.publishedTimeText?.simpleText || '';
  const durationText =
    renderer.thumbnailOverlays?.find(
      (overlay) => overlay.thumbnailOverlayTimeStatusRenderer?.text?.simpleText,
    )?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText;

  const durationSeconds = parseDurationSeconds(durationText);
  if (!videoId || !title) return null;
  if (durationSeconds !== null && durationSeconds < 60) return null;

  return {
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    source: 'YouTube',
    publishedAt,
    type: 'video',
    videoId,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

async function fetchLatestYouTubeEpisodes(channelTitle: string, channelUrl: string): Promise<YoutubeEpisode[]> {
  const response = await fetch(channelUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AtlantaGleaner/1.0)',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${channelTitle} uploads page: HTTP ${response.status}`);
  }

  const html = await response.text();
  const jsonText = extractJsonObject(html, 'ytInitialData');
  if (!jsonText) {
    throw new Error(`Could not locate ytInitialData for ${channelTitle}`);
  }

  const data = JSON.parse(jsonText) as unknown;
  const renderers = collectRenderers(data)
    .map((renderer) => rendererToEpisode(renderer))
    .filter((episode): episode is YoutubeEpisode => episode !== null);

  const seen = new Set<string>();
  const episodes: YoutubeEpisode[] = [];

  for (const episode of renderers) {
    if (seen.has(episode.videoId)) continue;
    seen.add(episode.videoId);
    episodes.push(episode);
    if (episodes.length === 3) break;
  }

  if (episodes.length < 3) {
    throw new Error(`Only found ${episodes.length} regular videos for ${channelTitle}`);
  }

  return episodes;
}

async function buildFeaturedSeries(
  title: string,
  channelUrl: string,
  slot: 'science_pin',
): Promise<GleanerItem> {
  const episodes = await fetchLatestYouTubeEpisodes(title, channelUrl);

  return {
    title,
    url: channelUrl,
    source: `Official ${title} uploads`,
    publishedAt: episodes[0]?.publishedAt || '',
    type: 'series',
    score: 1000,
    slot,
    episodes,
  };
}

function scoreItem(title: string): number {
  const text = title.toLowerCase();
  let score = 0;
  for (const kw of SCORING.tier1) if (text.includes(kw)) score += 10;
  for (const kw of SCORING.tier2) if (text.includes(kw)) score += 5;
  for (const kw of SCORING.tier3) if (text.includes(kw)) score += 3;
  for (const kw of SCORING.caribbean) if (text.includes(kw)) score += 5;
  for (const kw of SCORING.deprioritize) if (text.includes(kw)) score -= 8;
  return score;
}

type SerperRawRow = {
  title?: string;
  link?: string;
  source?: string;
  channel?: string;
  date?: string;
};

function normalize(row: SerperRawRow, slot: string): GleanerItem | null {
  if (!row.title || !row.link) return null;
  return {
    title: row.title,
    url: row.link,
    source: row.source || row.channel || 'Web',
    publishedAt: row.date || '',
    type: row.link.includes('youtube.com') ? 'video' : 'text',
    score: scoreItem(row.title),
    slot,
  };
}

async function serperSearch(q: string, num: number, endpoint: SerperEndpoint): Promise<GleanerItem[]> {
  if (!SERPER_API_KEY) {
    console.error('[serperSearch] SERPER_API_KEY not set');
    return [];
  }

  try {
    const res = await fetch(`https://google.serper.dev/${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q, num }),
    });

    if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);

    const data = await res.json() as Record<string, unknown>;
    const rows =
      (data[endpoint] as SerperRawRow[] | undefined) ||
      (data.organic as SerperRawRow[] | undefined) ||
      [];

    return rows
      .map((row) => normalize(row, 'news'))
      .filter((item): item is GleanerItem => item !== null);
  } catch (error) {
    console.error(`[serperSearch] Error for query "${q}":`, error);
    return [];
  }
}

async function buildNewsFeed(): Promise<GleanerItem[]> {
  const usedUrls = new Set<string>();
  const result: GleanerItem[] = [];

  // Batch 1: featured official YouTube channels
  const [starTalk, pbsSpaceTime, scienceBonusRaw] = await Promise.all([
    buildFeaturedSeries(FEATURED_CHANNELS.starTalk.title, FEATURED_CHANNELS.starTalk.url, 'science_pin'),
    buildFeaturedSeries(FEATURED_CHANNELS.pbsSpaceTime.title, FEATURED_CHANNELS.pbsSpaceTime.url, 'science_pin'),
    serperSearch(SEARCH_QUERIES.scienceBonus.q, SEARCH_QUERIES.scienceBonus.num, 'videos'),
  ]);

  result.push(starTalk, pbsSpaceTime);
  usedUrls.add(starTalk.url);
  usedUrls.add(pbsSpaceTime.url);

  // Slots 3-4: science bonus
  for (const item of scienceBonusRaw.filter((item) => !usedUrls.has(item.url)).slice(0, SLOT_TARGETS.scienceBonus)) {
    result.push({ ...item, slot: 'science_nova' });
    usedUrls.add(item.url);
  }

  // Batch 2: local + national
  const [tvRaw, deepRaw, nationalRaw] = await Promise.all([
    serperSearch(SEARCH_QUERIES.atlantaTV.q, SEARCH_QUERIES.atlantaTV.num, 'news'),
    serperSearch(SEARCH_QUERIES.atlantaDeep.q, SEARCH_QUERIES.atlantaDeep.num, 'news'),
    serperSearch(SEARCH_QUERIES.national.q, SEARCH_QUERIES.national.num, 'news'),
  ]);

  const localPool = [...tvRaw, ...deepRaw, ...nationalRaw]
    .filter((item) => !usedUrls.has(item.url))
    .map((item) => ({ ...item, slot: 'news', score: scoreItem(item.title) }))
    .sort((a, b) => b.score - a.score);

  for (const item of localPool) {
    const localCount = result.filter((entry) => entry.slot === 'news').length;
    if (localCount >= SLOT_TARGETS.local) break;
    result.push(item);
    usedUrls.add(item.url);
  }

  // Batch 3: international + Letterman
  const [intlRaw, lettermanRaw] = await Promise.all([
    serperSearch(SEARCH_QUERIES.international.q, SEARCH_QUERIES.international.num, 'search'),
    serperSearch(SEARCH_QUERIES.letterman.q, SEARCH_QUERIES.letterman.num, 'news'),
  ]);

  for (const item of intlRaw.filter((entry) => !usedUrls.has(entry.url)).slice(0, SLOT_TARGETS.international)) {
    result.push({ ...item, slot: 'news-international' });
    usedUrls.add(item.url);
  }

  for (const item of lettermanRaw.filter((entry) => !usedUrls.has(entry.url)).slice(0, SLOT_TARGETS.letterman)) {
    result.push({ ...item, slot: 'letterman' });
    usedUrls.add(item.url);
  }

  return result.slice(0, SLOT_TARGETS.total);
}

async function writeToEdgeConfig(items: GleanerItem[]): Promise<void> {
  if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) {
    throw new Error('Missing EDGE_CONFIG_ID or VERCEL_API_TOKEN environment variables.');
  }

  const entry: CacheEntry = {
    items,
    cachedAt: new Date().toISOString(),
  };

  const res = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ operation: 'upsert', key: 'news_cache', value: entry }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Edge Config write failed: HTTP ${res.status} - ${body}`);
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron/refresh-news] Unauthorized request');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[cron/refresh-news] Starting daily news refresh...');

  try {
    const items = await buildNewsFeed();

    if (items.length === 0) {
      console.warn('[cron/refresh-news] No items returned. Previous cache preserved.');
      return Response.json({
        ok: false,
        message: 'No items returned. Previous cache was preserved.',
      });
    }

    await writeToEdgeConfig(items);

    console.log(`[cron/refresh-news] Cache updated - ${items.length} items at ${new Date().toISOString()}`);

    return Response.json({
      ok: true,
      message: `News refreshed - ${items.length} items`,
      cachedAt: new Date().toISOString(),
      breakdown: {
        sciencePin: items.filter((item) => item.slot === 'science_pin').length,
        scienceNova: items.filter((item) => item.slot === 'science_nova').length,
        local: items.filter((item) => item.slot === 'news').length,
        international: items.filter((item) => item.slot === 'news-international').length,
        letterman: items.filter((item) => item.slot === 'letterman').length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[cron/refresh-news] Error:', message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
