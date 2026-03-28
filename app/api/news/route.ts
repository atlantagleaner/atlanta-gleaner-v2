// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — News Engine API Route
// GET  /api/news  → returns the 12-slot news array (cached)
// POST /api/news  → forces a refresh (called by cron)
// ─────────────────────────────────────────────────────────────────────────────

import { unstable_cache, revalidateTag } from 'next/cache';
import { fetchFeed } from '@/lib/rssParser';
import { SOURCES, SCORING, SLOT_CONFIG } from '@/lib/newsConfig';

export const runtime = 'nodejs';
export const maxDuration = 45;

const getCachedNews = unstable_cache(
  computeNews,
  ['gleaner-news'],
  { revalidate: 90000, tags: ['gleaner-news'] }
);

export async function GET() {
  try {
    const news = await getCachedNews();
    return Response.json(news, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err) {
    console.error('[news/route] GET error:', err);
    return Response.json({ items: [], error: 'Feed unavailable', generatedAt: new Date().toISOString() }, { status: 200 });
  }
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    revalidateTag('gleaner-news');
    const news = await computeNews();
    return Response.json({
      ok: true,
      count: news.items.length,
      generatedAt: news.generatedAt,
    });
  } catch (err: any) {
    console.error('[news/route] POST (cron) error:', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core engine
// ─────────────────────────────────────────────────────────────────────────────

interface NewsSlotItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  score: number;
  isLetterman: boolean;
  slot: string | null;
}

async function computeNews() {
  const now = new Date();
  const slots: NewsSlotItem[] = [];

  slots.push(...await fetchSciencePin(SOURCES.starTalk, 2));
  slots.push(...await fetchSciencePin(SOURCES.pbsSpaceTime, 2));

  const novaItems = await fetchSciencePin(SOURCES.pbsNova, 1, 7);
  const novaIncluded = novaItems.length > 0;
  slots.push(...novaItems);

  const newsSources = Object.entries(SOURCES).filter(([, s]: [string, any]) => s.type === 'news');

  const allRawItems = await Promise.all(
    newsSources.map(async ([key, source]: [string, any]) => {
      try {
        const items = await fetchFeed(source.url);
        return items.slice(0, 25).map((item: any) => ({
          title: item.title,
          url: item.link,
          source: source.label,
          publishedAt: safeIso(item.pubDate),
          score: scoreItem(item, source, now),
          isLetterman: isLettermanStory(item),
          slot: null,
        }));
      } catch (err: any) {
        console.warn(`[news] Feed error [${key}]: ${err.message}`);
        return [];
      }
    })
  );

  const seen = new Set<string>();
  const allItems = allRawItems.flat().filter((item: NewsSlotItem) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  allItems.sort((a: NewsSlotItem, b: NewsSlotItem) => b.score - a.score);

  const lettermanPool = allItems.filter((i: NewsSlotItem) => i.isLetterman);
  const regularPool = allItems.filter((i: NewsSlotItem) => !i.isLetterman);

  const lettermanPicks = lettermanPool.slice(0, SLOT_CONFIG.letterman).map((i: NewsSlotItem) => ({
    ...i, slot: 'letterman',
  }));

  // FIX 1: Seed usedUrls with BOTH science pin URLs and letterman URLs so
  // news picks can never duplicate an already-claimed slot.
  const usedUrls = new Set<string>([
    ...slots.map((i: NewsSlotItem) => i.url),
    ...lettermanPicks.map((i: NewsSlotItem) => i.url),
  ]);

  const remainingSlots = SLOT_CONFIG.total - slots.length - lettermanPicks.length;

  // FIX 2: Apply per-source caps AFTER slicing to the needed count, not before.
  // Collect candidates that pass the URL-dedup check first, then enforce caps
  // only on the items we actually intend to keep.
  const sourceConfig: Record<string, any> = SOURCES;
  const sourceCountMap: Record<string, number> = {};
  const newsPicks: NewsSlotItem[] = [];

  for (const i of regularPool) {
    if (newsPicks.length >= remainingSlots) break;
    if (usedUrls.has(i.url)) continue;

    const sourceCfg = Object.values(sourceConfig).find((s: any) => s.label === i.source) as any;
    const cap = sourceCfg?.maxPerSource ?? 3;
    const count = sourceCountMap[i.source] ?? 0;
    if (count >= cap) continue;

    sourceCountMap[i.source] = count + 1;
    usedUrls.add(i.url); // FIX 3: Keep usedUrls current as we pick items
    newsPicks.push({ ...i, slot: 'news' });
  }

  // FIX 4: Gap-fill uses the now-current usedUrls set, so no duplicates sneak in.
  const totalLetterman = lettermanPicks.length;
  if (totalLetterman < SLOT_CONFIG.letterman) {
    const gap = SLOT_CONFIG.letterman - totalLetterman;
    let filled = 0;
    for (const i of regularPool) {
      if (filled >= gap) break;
      if (usedUrls.has(i.url)) continue;
      usedUrls.add(i.url);
      newsPicks.push({ ...i, slot: 'news' });
      filled++;
    }
  }

  return {
    items: [...slots, ...lettermanPicks, ...newsPicks].slice(0, SLOT_CONFIG.total),
    generatedAt: now.toISOString(),
    novaIncluded,
    totalFetched: allItems.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchSciencePin(source: any, count: number, maxAgeDays: number | null = null) {
  try {
    const items = await fetchFeed(source.url);
    let filtered = items;

    if (maxAgeDays !== null) {
      const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
      filtered = items.filter((i: any) => i.pubDate > cutoff);
    }

    return filtered.slice(0, count).map((item: any) => ({
      title: item.title,
      url: item.link,
      source: source.label,
      publishedAt: safeIso(item.pubDate),
      score: 999,
      isLetterman: false,
      slot: source.type,
    }));
  } catch (err: any) {
    console.warn(`[news] Science pin error [${source.label}]: ${err.message}`);
    return [];
  }
}

function scoreItem(item: any, source: any, now: Date): number {
  let score = source.sourceBonus || 0;
  const text = `${item.title} ${item.snippet}`.toLowerCase();

  const tiers = [
    { keywords: SCORING.tier1, points: 25 },
    { keywords: SCORING.tier2, points: 20 },
    { keywords: SCORING.tier3, points: 15 },
    { keywords: SCORING.caribbean, points: 15 },
    { keywords: SCORING.science, points: 12 },
  ];

  for (const { keywords, points } of tiers) {
    if (keywords.some((kw: string) => text.includes(kw))) {
      score += points;
    }
  }

  if (SCORING.deprioritize.some((kw: string) => text.includes(kw))) {
    score -= 10;
  }

  const ageHours = (now.getTime() - item.pubDate.getTime()) / (1000 * 60 * 60);
  if (ageHours < 12) score += SCORING.recencyBonus.within12Hours;
  else if (ageHours < 24) score += SCORING.recencyBonus.within24Hours;

  return score;
}

function isLettermanStory(item: any): boolean {
  const text = `${item.title} ${item.snippet}`.toLowerCase();
  const matches = SCORING.letterman.filter((kw: string) => text.includes(kw)).length;
  const topTier = ['waffle house', 'alligator', 'feral hog', 'feral pig', 'teleport'];
  const hasTopTier = topTier.some((kw: string) => text.includes(kw));
  return matches >= 2 || hasTopTier;
}

function safeIso(date: any): string {
  try {
    return date instanceof Date && !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}