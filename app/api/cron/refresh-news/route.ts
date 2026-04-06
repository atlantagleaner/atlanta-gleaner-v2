// Atlanta Gleaner - Daily News Refresh Cron
//
// Runs once daily at 5:00 AM UTC (midnight ET) via Vercel Cron.
// This route builds the cached feed and writes it to Edge Config, where
// /api/news reads it for the next 24 hours.
//
// Slots 1 and 2 are sourced directly from the official StarTalk and
// PBS Space Time YouTube uploads pages. Each slot stores the three most
// recent regular videos, with shorts filtered out.

import { EDITORIAL_QUERIES, FEED_TARGETS, SCORING, SOURCE_WEIGHTS } from '@/lib/newsConfig';
import type { EditorialQuery, SerperEndpoint } from '@/lib/newsConfig';
import { createCacheEntry } from '@/app/api/news/route';
import type { CacheEntry, GleanerItem } from '@/app/api/news/route';
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

function toLowerText(value: string | undefined): string {
  return (value || '').toLowerCase();
}

type SerperRawRow = {
  title?: string;
  link?: string;
  source?: string;
  channel?: string;
  date?: string;
};

function getHostname(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function isVideoUrl(value: string): boolean {
  const host = getHostname(value)
  if (!host.includes('youtube.com')) return false

  return (
    value.includes('/watch?') ||
    value.includes('/watch/') ||
    value.includes('/embed/')
  )
}

function countKeywordHits(text: string, keywords: readonly string[], pointsPerHit: number): number {
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) score += pointsPerHit;
  }
  return score;
}

function recencyBonus(publishedAt: string): number {
  if (!publishedAt) return 0;

  const parsed = new Date(publishedAt);
  if (Number.isNaN(parsed.getTime())) return 0;

  const ageDays = Math.max(0, (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
  if (ageDays <= 1) return 12;
  if (ageDays <= 3) return 9;
  if (ageDays <= 7) return 6;
  if (ageDays <= 14) return 3;
  return 0;
}

function ageDays(publishedAt: string): number | null {
  if (!publishedAt) return null;

  const parsed = new Date(publishedAt);
  if (Number.isNaN(parsed.getTime())) return null;

  return Math.max(0, (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
}

function isFreshEnough(publishedAt: string, maxAgeDays: number): boolean {
  const age = ageDays(publishedAt);
  if (age === null) return true;
  return age <= maxAgeDays;
}

function scoreEditorialItem(item: GleanerItem): number {
  const text = toLowerText(item.title) + ' ' + toLowerText(item.source);
  const host = getHostname(item.url);
  let score = item.score ?? 0;

  if (host && host in SOURCE_WEIGHTS) {
    score += SOURCE_WEIGHTS[host as keyof typeof SOURCE_WEIGHTS];
  }

  score += countKeywordHits(text, SCORING.localGeorgia, 3);
  score += countKeywordHits(text, SCORING.cnn, 18);
  score += countKeywordHits(text, SCORING.legalGeorgia, 8);
  score += countKeywordHits(text, SCORING.absurd, 10);
  score += countKeywordHits(text, SCORING.macabre, 12);
  score += countKeywordHits(text, SCORING.documentary, 6);
  score += countKeywordHits(text, SCORING.international, 4);
  score += recencyBonus(item.publishedAt);

  for (const kw of SCORING.deprioritize) {
    if (text.includes(kw)) score -= 10;
  }

  return score;
}

function inferEditorialSlot(item: GleanerItem): GleanerItem['slot'] {
  const text = toLowerText(item.title) + ' ' + toLowerText(item.source);
  if (
    SCORING.absurd.some((kw) => text.includes(kw)) ||
    SCORING.macabre.some((kw) => text.includes(kw))
  ) {
    return 'letterman';
  }
  if (SCORING.international.some((kw) => text.includes(kw))) {
    return 'news-international';
  }
  if (SCORING.documentary.some((kw) => text.includes(kw))) {
    return 'science_nova';
  }
  return item.slot || 'news';
}

function normalizeSourceFamily(item: GleanerItem): string {
  const host = getHostname(item.url)
  const source = toLowerText(item.source)

  if (host.includes('wsbtv.com') || host.includes('wsb-tv.com') || host.includes('wsb.com') || source.includes('wsb')) {
    return 'wsb'
  }
  if (host.includes('atlantanewsfirst.com') || source.includes('atlanta news first')) {
    return 'atlantanewsfirst'
  }
  if (host.includes('wabe.org') || source.includes('wabe')) {
    return 'wabe'
  }
  if (host.includes('gpb.org') || source.includes('gpb')) {
    return 'gpb'
  }
  if (host.includes('cnn.com') || source.includes('cnn')) {
    return 'cnn'
  }
  if (host.includes('11alive.com') || source.includes('11alive')) {
    return '11alive'
  }
  if (host.includes('fox5atlanta.com') || source.includes('fox 5 atlanta')) {
    return 'fox5atlanta'
  }
  if (host.includes('ajc.com') || source.includes('ajc') || source.includes('atlanta journal-constitution')) {
    return 'ajc'
  }

  return host || source || 'unknown'
}

function isPreferredLocalFamily(family: string): boolean {
  return ['wsb', 'atlantanewsfirst', 'wabe', 'gpb', '11alive', 'fox5atlanta', 'ajc'].includes(family)
}

function selectDiverseEditorialItems(items: EditorialCandidate[], total: number): EditorialCandidate[] {
  const remaining = [...items]
  const selected: EditorialCandidate[] = []
  const familyCounts = new Map<string, number>()
  const sourceCounts = new Map<string, number>()

  while (selected.length < total && remaining.length > 0) {
    let bestIndex = -1
    let bestScore = Number.NEGATIVE_INFINITY

    for (let index = 0; index < remaining.length; index += 1) {
      const item = remaining[index]
      const family = normalizeSourceFamily(item)
      const familyCount = familyCounts.get(family) ?? 0
      const sourceKey = toLowerText(item.source) || family
      const sourceCount = sourceCounts.get(sourceKey) ?? 0

      let adjustedScore = item.score ?? 0
      adjustedScore -= familyCount * 18
      adjustedScore -= sourceCount * 8

      if (familyCount === 0 && isPreferredLocalFamily(family)) {
        adjustedScore += 14
      } else if (familyCount === 1) {
        adjustedScore += 2
      } else if (familyCount >= 2) {
        adjustedScore -= 12 * (familyCount - 1)
      }

      if (family === 'cnn' && selected.filter((entry) => normalizeSourceFamily(entry) === 'cnn').length >= 2) {
        adjustedScore -= 10
      }

      if (adjustedScore > bestScore) {
        bestScore = adjustedScore
        bestIndex = index
      }
    }

    if (bestIndex < 0) break

    const [chosen] = remaining.splice(bestIndex, 1)
    selected.push(chosen)

    const chosenFamily = normalizeSourceFamily(chosen)
    const chosenSourceKey = toLowerText(chosen.source) || chosenFamily
    familyCounts.set(chosenFamily, (familyCounts.get(chosenFamily) ?? 0) + 1)
    sourceCounts.set(chosenSourceKey, (sourceCounts.get(chosenSourceKey) ?? 0) + 1)
  }

  return selected
}

function ensurePreferredFamilies(
  selected: EditorialCandidate[],
  pool: EditorialCandidate[],
  preferredFamilies: string[],
): EditorialCandidate[] {
  const next = [...selected]

  for (const family of preferredFamilies) {
    if (next.some((item) => normalizeSourceFamily(item) === family)) continue

    const candidate = pool.find(
      (item) => normalizeSourceFamily(item) === family && !next.some((selectedItem) => selectedItem.url === item.url),
    )
    if (!candidate) continue

    const replaceIndex = next
      .map((item, index) => ({
        item,
        index,
        family: normalizeSourceFamily(item),
      }))
      .filter(({ family: currentFamily }) => currentFamily !== family)
      .sort((a, b) => (a.item.score ?? 0) - (b.item.score ?? 0))[0]?.index

    if (replaceIndex === undefined) continue

    next[replaceIndex] = candidate
  }

  return next
}

interface EditorialCandidate extends GleanerItem {
  lane: keyof typeof EDITORIAL_QUERIES;
  queryLabel: string;
}

function stripEditorialMeta(candidate: EditorialCandidate): GleanerItem {
  const { lane: _lane, queryLabel: _queryLabel, ...item } = candidate;
  return item;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function summarizeFailures(failures: RefreshFailure[]): Pick<RefreshStatus, 'failures' | 'omittedFailures'> {
  const limited = failures.slice(0, MAX_STATUS_FAILURES);
  return {
    failures: limited,
    omittedFailures: Math.max(0, failures.length - limited.length),
  };
}

function getNewYorkTimeParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function isExpectedRun(mode: 'prepare' | 'publish'): boolean {
  const current = getNewYorkTimeParts();
  if (mode === 'prepare') {
    return current.hour === 22 && current.minute === 30;
  }
  return current.hour === 0 && current.minute === 0;
}

function normalize(row: SerperRawRow, slot: string, baseBoost = 0): GleanerItem | null {
  if (!row.title || !row.link) return null;
  return {
    title: row.title,
    url: row.link,
    source: row.source || row.channel || 'Web',
    publishedAt: row.date || '',
    type: isVideoUrl(row.link) ? 'video' : 'text',
    score: baseBoost,
    slot,
  };
}

async function serperSearch(query: EditorialQuery, lane: keyof typeof EDITORIAL_QUERIES): Promise<EditorialCandidate[]> {
  if (!SERPER_API_KEY) {
    console.error('[serperSearch] SERPER_API_KEY not set');
    return [];
  }

  try {
    const res = await fetch(`https://google.serper.dev/${query.endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query.q, num: query.num }),
    });

    if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);

    const data = await res.json() as Record<string, unknown>;
    const rows =
      (data[query.endpoint] as SerperRawRow[] | undefined) ||
      (data.organic as SerperRawRow[] | undefined) ||
      [];

    return rows
      .map((row) => normalize(row, inferEditorialSlot({
        title: row.title || '',
        url: row.link || '',
        source: row.source || row.channel || 'Web',
        publishedAt: row.date || '',
        type: row.link?.includes('youtube.com') ? 'video' : 'text',
        score: 0,
        slot: 'news',
      }), query.boost))
      .filter((item): item is GleanerItem => item !== null)
      .filter((item) => isFreshEnough(item.publishedAt, query.maxAgeDays ?? 21))
      .map((item) => ({
        ...item,
        score: scoreEditorialItem(item),
        lane,
        queryLabel: query.label,
      }));
  } catch (error) {
    console.error(`[serperSearch] Error for query "${query.q}":`, error);
    return [];
  }
}

async function buildNewsFeed(options?: {
  prewarmReaders?: boolean;
}): Promise<{ items: GleanerItem[]; failures: RefreshFailure[] }> {
  const usedUrls = new Set<string>();
  const featured: GleanerItem[] = [];
  const failures: RefreshFailure[] = [];

  const [starTalk, pbsSpaceTime] = await Promise.all([
    buildFeaturedSeries(FEATURED_CHANNELS.starTalk.title, FEATURED_CHANNELS.starTalk.url, 'science_pin'),
    buildFeaturedSeries(FEATURED_CHANNELS.pbsSpaceTime.title, FEATURED_CHANNELS.pbsSpaceTime.url, 'science_pin'),
  ]);

  featured.push(starTalk, pbsSpaceTime);
  usedUrls.add(starTalk.url);
  usedUrls.add(pbsSpaceTime.url);

  const queries = [
    ...EDITORIAL_QUERIES.local.map((query) => ({ lane: 'local' as const, query })),
    ...EDITORIAL_QUERIES.cnn.map((query) => ({ lane: 'cnn' as const, query })),
    ...EDITORIAL_QUERIES.legal.map((query) => ({ lane: 'legal' as const, query })),
    ...EDITORIAL_QUERIES.absurd.map((query) => ({ lane: 'absurd' as const, query })),
    ...EDITORIAL_QUERIES.macabre.map((query) => ({ lane: 'macabre' as const, query })),
    ...EDITORIAL_QUERIES.international.map((query) => ({ lane: 'international' as const, query })),
    ...EDITORIAL_QUERIES.docs.map((query) => ({ lane: 'docs' as const, query })),
    ...EDITORIAL_QUERIES.scienceBonus.map((query) => ({ lane: 'scienceBonus' as const, query })),
  ];

  const fetched = await Promise.all(
    queries.map(async ({ lane, query }) => serperSearch(query, lane)),
  );

  const editorialPool = fetched
    .flat()
    .map((item) => ({
      ...item,
      score: scoreEditorialItem(item),
      slot: inferEditorialSlot(item),
    }))
    .sort((a, b) => b.score - a.score);

  let selected = selectDiverseEditorialItems(
    editorialPool.filter((item) => !usedUrls.has(item.url)),
    FEED_TARGETS.total - FEED_TARGETS.featured,
  )
  selected = ensurePreferredFamilies(
    selected,
    editorialPool.filter((item) => !usedUrls.has(item.url)),
    ['wsb', 'atlantanewsfirst', 'wabe', 'gpb'],
  )
  selected = selected.slice(0, FEED_TARGETS.total - FEED_TARGETS.featured)

  for (const item of selected) {
    usedUrls.add(item.url)
  }

  const hasCNN = selected.some((item) => toLowerText(item.source).includes('cnn') || getHostname(item.url).includes('cnn.com'));
  if (!hasCNN) {
    const cnnCandidate = editorialPool.find(
      (item) => toLowerText(item.source).includes('cnn') || getHostname(item.url).includes('cnn.com'),
    );
    if (cnnCandidate) {
      const replacementIndex = selected
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !toLowerText(item.source).includes('cnn') && !getHostname(item.url).includes('cnn.com'))
        .sort((a, b) => (a.item.score ?? 0) - (b.item.score ?? 0))[0]?.index;
      if (replacementIndex !== undefined) {
        usedUrls.delete(selected[replacementIndex].url);
        selected[replacementIndex] = cnnCandidate;
        usedUrls.add(cnnCandidate.url);
      }
    }
  }

  const selectedItems: GleanerItem[] = [];
  for (const item of selected) {
    const plainItem = stripEditorialMeta(item);

    if (options?.prewarmReaders && plainItem.type === 'text') {
      try {
        await ensureReaderDocument(plainItem.url, {
          title: plainItem.title,
          source: plainItem.source,
        });
      } catch (error: unknown) {
        failures.push({
          title: plainItem.title,
          url: plainItem.url,
          source: plainItem.source,
          error: error instanceof Error ? error.message : String(error),
        });
        await delay(PREPARE_DELAY_MS);
        continue;
      }

      await delay(PREPARE_DELAY_MS);
    }

    selectedItems.push(plainItem);
  }

  if (options?.prewarmReaders && selectedItems.length < FEED_TARGETS.total - FEED_TARGETS.featured) {
    for (const item of editorialPool) {
      if (selectedItems.length >= FEED_TARGETS.total - FEED_TARGETS.featured) break;
      if (usedUrls.has(item.url)) continue;

      const plainItem = stripEditorialMeta(item);
      if (plainItem.type === 'text') {
        try {
          await ensureReaderDocument(plainItem.url, {
            title: plainItem.title,
            source: plainItem.source,
          });
        } catch (error: unknown) {
          failures.push({
            title: plainItem.title,
            url: plainItem.url,
            source: plainItem.source,
            error: error instanceof Error ? error.message : String(error),
          });
          await delay(PREPARE_DELAY_MS);
          continue;
        }

        await delay(PREPARE_DELAY_MS);
      }

      usedUrls.add(plainItem.url);
      selectedItems.push(plainItem);
    }
  }

  return {
    items: [...featured, ...selectedItems].slice(0, FEED_TARGETS.total),
    failures,
  };
}

async function writeToEdgeConfigItems(
  entries: Array<{ key: string; value: unknown }>,
): Promise<void> {
  if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) {
    throw new Error('Missing EDGE_CONFIG_ID or VERCEL_API_TOKEN environment variables.');
  }

  const res = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: entries.map((entry) => ({
        operation: 'upsert',
        key: entry.key,
        value: entry.value,
      })),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Edge Config write failed: HTTP ${res.status} - ${body}`);
  }
}

async function writeRefreshStatus(status: RefreshStatus): Promise<void> {
  try {
    await writeToEdgeConfigItems([{ key: STATUS_CACHE_KEY, value: status }]);
  } catch (error) {
    console.error('[cron/refresh-news] Failed to write detailed refresh status:', error);

    const minimalStatus: RefreshStatus = {
      phase: status.phase,
      preparedAt: status.preparedAt,
      publishedAt: status.publishedAt,
      failures: [],
      omittedFailures: status.counts.failures,
      counts: status.counts,
    };

    await writeToEdgeConfigItems([{ key: STATUS_CACHE_KEY, value: minimalStatus }]);
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const requestUrl = new URL(request.url);
  const mode = requestUrl.searchParams.get('mode') === 'prepare' ? 'prepare' : 'publish';
  const forceRun = requestUrl.searchParams.get('force') === '1';

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron/refresh-news] Unauthorized request');
    return new Response('Unauthorized', { status: 401 });
  }

  if (!forceRun && !isExpectedRun(mode)) {
    return Response.json({
      ok: true,
      skipped: true,
      mode,
      message: `Ignoring ${mode} run outside the expected America/New_York window.`,
    });
  }

  console.log(`[cron/refresh-news] Starting ${mode} run${forceRun ? ' (forced)' : ''}...`);

  try {
    if (mode === 'prepare') {
      const { items, failures } = await buildNewsFeed({ prewarmReaders: true });

      if (items.length === 0) {
        console.warn('[cron/refresh-news] No staged items returned. Previous live cache preserved.');
        return Response.json({
          ok: false,
          mode,
          message: 'No staged items returned. Previous live cache was preserved.',
        });
      }

      const stagedEntry: CacheEntry = createCacheEntry(items);

      const status: RefreshStatus = {
        phase: 'prepare',
        preparedAt: new Date().toISOString(),
        ...summarizeFailures(failures),
        counts: {
          selected: items.length,
          failures: failures.length,
        },
      };

      const stagedRef = await saveFeedEntry('staged', stagedEntry);
      await writeToEdgeConfigItems([{ key: STAGED_CACHE_KEY, value: stagedRef }]);
      await writeRefreshStatus(status);

      return Response.json({
        ok: true,
        mode,
        message: `Staged news prepared - ${items.length} items`,
        cachedAt: stagedEntry.cachedAt,
        forced: forceRun,
        failures,
      });
    }

    const [staged, previousStatus] = await Promise.all([
      get<CacheEntry | CacheReference>(STAGED_CACHE_KEY),
      get<RefreshStatus>(STATUS_CACHE_KEY),
    ]);
    let liveEntry: CacheEntry | null = await resolveFeedEntry(staged);
    let failures: RefreshFailure[] = [];
    let omittedFailures = 0;

    if (!liveEntry || !Array.isArray(liveEntry.items) || liveEntry.items.length === 0) {
      const built = await buildNewsFeed({ prewarmReaders: false });
      liveEntry = createCacheEntry(built.items);
      failures = built.failures;
    } else if (previousStatus?.phase === 'prepare') {
      failures = previousStatus.failures;
      omittedFailures = previousStatus.omittedFailures ?? 0;
    }

    if (!liveEntry.items.length) {
      console.warn('[cron/refresh-news] No items returned. Previous cache preserved.');
      return Response.json({
        ok: false,
        mode,
        message: 'No items returned. Previous cache was preserved.',
      });
    }

    const status: RefreshStatus = {
      phase: 'publish',
      preparedAt: staged?.cachedAt,
      publishedAt: new Date().toISOString(),
      ...(omittedFailures
        ? { failures, omittedFailures }
        : summarizeFailures(failures)),
      counts: {
        selected: liveEntry.items.length,
        failures: failures.length + omittedFailures,
      },
    };

    const liveRef = await saveFeedEntry('live', liveEntry);
    await writeToEdgeConfigItems([{ key: LIVE_CACHE_KEY, value: liveRef }]);
    await writeRefreshStatus(status);

    console.log(`[cron/refresh-news] Live cache updated - ${liveEntry.items.length} items at ${new Date().toISOString()}`);

    return Response.json({
      ok: true,
      mode,
      message: `News refreshed - ${liveEntry.items.length} items`,
      cachedAt: new Date().toISOString(),
      forced: forceRun,
      failures,
      breakdown: {
        featured: liveEntry.items.filter((item) => item.slot === 'science_pin').length,
        localOrNational: liveEntry.items.filter((item) => item.slot === 'news').length,
        international: liveEntry.items.filter((item) => item.slot === 'news-international').length,
        editorialOddities: liveEntry.items.filter((item) => item.slot === 'letterman').length,
        documentaryAndScience: liveEntry.items.filter((item) => item.slot === 'science_nova').length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[cron/refresh-news] Error:', message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
