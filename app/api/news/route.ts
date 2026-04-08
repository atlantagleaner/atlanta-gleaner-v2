// Atlanta Gleaner - /api/news Route
// This route reads the cached feed from Edge Config with fallback chain:
// live → previous → backup

import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'
import { resolveFeedEntry } from '@/lib/newsFeedCache'
import { LIVE_CACHE_KEY, PREVIOUS_CACHE_KEY, BACKUP_CACHE_KEY } from '@/lib/newsRefresh'
import type { CacheReference } from '@/lib/newsFeedCache'
import type { CacheEntry } from '@/lib/news/types'
import { hydrateCacheItems } from '@/lib/news/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    // Fallback chain: live → previous → backup
    const cacheKeys = [LIVE_CACHE_KEY, PREVIOUS_CACHE_KEY, BACKUP_CACHE_KEY];
    let resolved: CacheEntry | null = null;
    let sourceKey = '';

    for (const key of cacheKeys) {
      try {
        const cached = await get<CacheEntry | CacheReference>(key);
        resolved = await resolveFeedEntry(cached);

        if (resolved && Array.isArray(resolved.items) && resolved.items.length > 0) {
          sourceKey = key;
          console.log(`[/api/news] Using cache from: ${key}`);
          break;
        }
      } catch (e) {
        console.warn(`[/api/news] Failed to resolve ${key}:`, e);
        continue;
      }
    }

    if (resolved && Array.isArray(resolved.items) && resolved.items.length > 0) {
      const items = hydrateCacheItems(resolved.items);
      const cachedAge = new Date().getTime() - new Date(resolved.cachedAt).getTime();
      const isStale = cachedAge > 4 * 60 * 60 * 1000; // 4 hours

      return NextResponse.json(
        {
          items,
          cachedAt: resolved.cachedAt,
          count: items.length,
          isStale,
          source: sourceKey,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          },
        },
      );
    }

    return NextResponse.json({
      items: [],
      cachedAt: null,
      count: 0,
      message: 'Cache not yet populated. The cron job will fill it at midnight.',
    });
  } catch (error) {
    console.error('[/api/news] Error:', error);

    return NextResponse.json(
      {
        items: [],
        error: 'Failed to retrieve cached feed.',
      },
      { status: 503 },
    );
  }
}
