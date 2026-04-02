// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — Daily News Refresh Cron
// ─────────────────────────────────────────────────────────────────────────────
// Runs once daily at 5:00 AM UTC (midnight ET) via Vercel Cron.
// This is the ONLY place Serper API is called. It builds the full 15-item
// news feed and writes it to Edge Config, where /api/news reads it for the
// next 24 hours. If Serper returns nothing, the previous cache is preserved.
//
// Required env vars:
//   SERPER_API_KEY     — Your Serper.dev API key
//   EDGE_CONFIG        — Vercel Edge Config connection string (auto-set when linked)
//   EDGE_CONFIG_ID     — Edge Config store ID (ecfg_xxxx), from the Vercel dashboard
//   VERCEL_API_TOKEN   — Vercel personal/team token for writing to Edge Config
//   CRON_SECRET        — Shared secret to authenticate this endpoint
// ─────────────────────────────────────────────────────────────────────────────

import { SEARCH_QUERIES, SLOT_TARGETS, SCORING } from '@/lib/newsConfig';
import type { SerperEndpoint } from '@/lib/newsConfig';
import type { GleanerItem, CacheEntry } from '@/app/api/news/route';

export const runtime = 'nodejs';

const SERPER_API_KEY  = process.env.SERPER_API_KEY;
const EDGE_CONFIG_ID  = process.env.EDGE_CONFIG_ID;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

// ── Scoring ────────────────────────────────────────────────────────────────────

function scoreItem(title: string): number {
  const text = title.toLowerCase();
  let score = 0;
  for (const kw of SCORING.tier1)      if (text.includes(kw)) score += 10;
  for (const kw of SCORING.tier2)      if (text.includes(kw)) score += 5;
  for (const kw of SCORING.tier3)      if (text.includes(kw)) score += 3;
  for (const kw of SCORING.caribbean)  if (text.includes(kw)) score += 5;
  for (const kw of SCORING.deprioritize) if (text.includes(kw)) score -= 8;
  return score;
}

// ── Serper Fetch ───────────────────────────────────────────────────────────────

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
    title:       row.title,
    url:         row.link,
    source:      row.source || row.channel || 'Web',
    publishedAt: row.date   || '',
    type:        row.link.includes('youtube.com') ? 'video' : 'text',
    score:       scoreItem(row.title),
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
      method:  'POST',
      headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ q, num }),
    });
    if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);
    const data = await res.json() as Record<string, unknown>;
    const rows = (data[endpoint] as SerperRawRow[] | undefined)
              || (data.organic   as SerperRawRow[] | undefined)
              || [];
    return rows
      .map(r => normalize(r, 'news'))
      .filter((x): x is GleanerItem => x !== null);
  } catch (e) {
    console.error(`[serperSearch] Error for query "${q}":`, e);
    return [];
  }
}

// ── Feed Builder ───────────────────────────────────────────────────────────────
// Runs all Serper queries in parallel batches and assembles the 15-item feed.
// Slot order:
//   1-2:   StarTalk + PBS Space Time (hard-guaranteed first two slots)
//   3-4:   Science bonus (overflow from above, or adjacent science channels)
//   5-10:  Atlanta/Georgia local + national (scored and ranked)
//   11-13: International deep dives
//   14-15: Letterman / quirky / oddball

async function buildNewsFeed(): Promise<GleanerItem[]> {
  const usedUrls = new Set<string>();
  const result: GleanerItem[] = [];

  // ── Batch 1: Science videos ──────────────────────────────────────────────────
  const [starTalkRaw, pbsSTRaw, scienceBonusRaw] = await Promise.all([
    serperSearch(SEARCH_QUERIES.starTalk.q,      SEARCH_QUERIES.starTalk.num,      'videos'),
    serperSearch(SEARCH_QUERIES.pbsSpaceTime.q,  SEARCH_QUERIES.pbsSpaceTime.num,  'videos'),
    serperSearch(SEARCH_QUERIES.scienceBonus.q,  SEARCH_QUERIES.scienceBonus.num,  'videos'),
  ]);

  // Slot 1 — StarTalk
  const starTalk = starTalkRaw[0];
  if (starTalk) {
    result.push({ ...starTalk, slot: 'science_pin' });
    usedUrls.add(starTalk.url);
  }

  // Slot 2 — PBS Space Time
  const pbsST = pbsSTRaw[0];
  if (pbsST) {
    result.push({ ...pbsST, slot: 'science_pin' });
    usedUrls.add(pbsST.url);
  }

  // Slots 3-4 — Science bonus (overflow from above first, then scienceBonus pool)
  const sciencePool = [
    ...starTalkRaw.slice(1),
    ...pbsSTRaw.slice(1),
    ...scienceBonusRaw,
  ].filter(x => !usedUrls.has(x.url));

  for (const item of sciencePool.slice(0, SLOT_TARGETS.scienceBonus)) {
    result.push({ ...item, slot: 'science_nova' });
    usedUrls.add(item.url);
  }

  // ── Batch 2: Local + National ────────────────────────────────────────────────
  const [tvRaw, deepRaw, nationalRaw] = await Promise.all([
    serperSearch(SEARCH_QUERIES.atlantaTV.q,   SEARCH_QUERIES.atlantaTV.num,   'news'),
    serperSearch(SEARCH_QUERIES.atlantaDeep.q, SEARCH_QUERIES.atlantaDeep.num, 'news'),
    serperSearch(SEARCH_QUERIES.national.q,    SEARCH_QUERIES.national.num,    'news'),
  ]);

  // Merge, score, deduplicate, sort by relevance score
  const localPool = [...tvRaw, ...deepRaw, ...nationalRaw]
    .filter(x => !usedUrls.has(x.url))
    .map(x => ({ ...x, slot: 'news', score: scoreItem(x.title) }))
    .sort((a, b) => b.score - a.score);

  for (const item of localPool) {
    const localCount = result.filter(r => r.slot === 'news').length;
    if (localCount >= SLOT_TARGETS.local) break;
    result.push(item);
    usedUrls.add(item.url);
  }

  // ── Batch 3: International + Letterman ──────────────────────────────────────
  const [intlRaw, lettermanRaw] = await Promise.all([
    serperSearch(SEARCH_QUERIES.international.q, SEARCH_QUERIES.international.num, 'search'),
    serperSearch(SEARCH_QUERIES.letterman.q,     SEARCH_QUERIES.letterman.num,     'news'),
  ]);

  // Slots 11-13 — International / deep dives
  for (const item of intlRaw.filter(x => !usedUrls.has(x.url)).slice(0, SLOT_TARGETS.international)) {
    result.push({ ...item, slot: 'news-international' });
    usedUrls.add(item.url);
  }

  // Slots 14-15 — Letterman
  for (const item of lettermanRaw.filter(x => !usedUrls.has(x.url)).slice(0, SLOT_TARGETS.letterman)) {
    result.push({ ...item, slot: 'letterman' });
    usedUrls.add(item.url);
  }

  return result.slice(0, SLOT_TARGETS.total);
}

// ── Edge Config Writer ─────────────────────────────────────────────────────────

async function writeToEdgeConfig(items: GleanerItem[]): Promise<void> {
  if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) {
    throw new Error('Missing EDGE_CONFIG_ID or VERCEL_API_TOKEN environment variables.');
  }

  const entry: CacheEntry = {
    items,
    cachedAt: new Date().toISOString(),
  };

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
    {
      method:  'PATCH',
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ operation: 'upsert', key: 'news_cache', value: entry }],
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Edge Config write failed: HTTP ${res.status} — ${body}`);
  }
}

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Authenticate via CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron/refresh-news] Unauthorized request');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[cron/refresh-news] Starting daily Serper fetch...');

  try {
    const items = await buildNewsFeed();

    if (items.length === 0) {
      // Serper returned nothing — leave previous cache intact
      console.warn('[cron/refresh-news] Serper returned 0 items. Previous cache preserved.');
      return Response.json({
        ok: false,
        message: 'Serper returned no items. Previous cache was preserved.',
      });
    }

    await writeToEdgeConfig(items);

    console.log(`[cron/refresh-news] ✓ Cache updated — ${items.length} items at ${new Date().toISOString()}`);

    return Response.json({
      ok:        true,
      message:   `News refreshed — ${items.length} items`,
      cachedAt:  new Date().toISOString(),
      breakdown: {
        sciencePin:    items.filter(i => i.slot === 'science_pin').length,
        scienceNova:   items.filter(i => i.slot === 'science_nova').length,
        local:         items.filter(i => i.slot === 'news').length,
        international: items.filter(i => i.slot === 'news-international').length,
        letterman:     items.filter(i => i.slot === 'letterman').length,
      }