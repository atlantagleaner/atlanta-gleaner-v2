// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — /api/news Route
// ─────────────────────────────────────────────────────────────────────────────
// This route ONLY reads from Edge Config cache. It never calls Serper directly.
// Serper is called exclusively by the cron job at /api/cron/refresh-news,
// which runs once per day at midnight ET. This guarantees Serper credits are
// never wasted on individual user requests.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GleanerItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  type: 'video' | 'text';
  score: number;
  slot: string;
}

export interface CacheEntry {
  items: GleanerItem[];
  cachedAt: string;
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const cached = await get<CacheEntry>('news_cache');

    if (cached && Array.isArray(cached.items) && cached.items.length > 0) {
      return NextResponse.json(
        {
          items: cached.items,
          cachedAt: cached.cachedAt,
          count: cached.items.length,
        },
        {
          headers: {
            // Allow CDN to serve this for up to 5 minutes before revalidating.
            // The underlying data only changes once/day via cron, so this is safe.
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          },
        }
      );
    }

    // Cache exists but is empty — cron hasn't run yet
    return NextResponse.json({
      items: [],
      cachedAt: null,
      count: 0,
      message: 'Cache not yet populated. The cron job will fill it at midnight.',
    });

  } catch (error) {
    console.error('[/api/news] Edge Config read error:', error);

    // EDGE_CONFIG env var likely not set — return helpful message in dev
    return NextResponse.json(
      {
        items: [],
        error: 'Edge Config unavailable. Check EDGE_CONFI