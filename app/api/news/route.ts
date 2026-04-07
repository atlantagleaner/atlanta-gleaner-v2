// Atlanta Gleaner - /api/news Route
// This route only reads the cached feed from Edge Config.

import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'
import { resolveFeedEntry } from '@/lib/newsFeedCache'
import { LIVE_CACHE_KEY } from '@/lib/newsRefresh'
import type { CacheReference, CacheEntry } from '@/lib/news/types'
import { hydrateCacheItems } from '@/lib/news/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  // Check for local development override
  const isDev = process.env.NODE_ENV === 'development' || !!process.env.SERPER_API_KEY;
  if (isDev) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const localPath = path.join(process.cwd(), 'public', 'news-local.json');
      if (fs.existsSync(localPath)) {
        const localData = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
        return NextResponse.json({
          ...localData,
          items: hydrateCacheItems(localData.items),
          source: 'local_file'
        });
      }
    } catch (e) {
      console.warn('[news] Local file check failed, falling back to Edge Config');
    }
  }

  try {
    const cached = await get<CacheEntry | CacheReference>(LIVE_CACHE_KEY)
    const resolved = await resolveFeedEntry(cached)

    if (resolved && Array.isArray(resolved.items) && resolved.items.length > 0) {
      const items = hydrateCacheItems(resolved.items)

      return NextResponse.json(
        {
          items,
          cachedAt: resolved.cachedAt,
          count: items.length,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          },
        },
      )
    }

    return NextResponse.json({
      items: [],
      cachedAt: null,
      count: 0,
      message: 'Cache not yet populated. The cron job will fill it at midnight.',
    })
  } catch (error) {
    console.error('[/api/news] Edge Config read error:', error)

    return NextResponse.json(
      {
        items: [],
        error: 'Edge Config unavailable. Check EDGE_CONFIG environment variable.',
      },
      { status: 503 },
    )
  }
}
