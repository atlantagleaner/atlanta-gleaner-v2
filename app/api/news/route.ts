// Atlanta Gleaner - /api/news Route
// This route only reads the cached feed from Edge Config.
// The cron pipeline stages the next feed at 10:30 PM ET, prewarms reader
// caches, and publishes it live at 12:00 AM ET.

import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'
import { resolveFeedEntry } from '@/lib/newsFeedCache'
import type { CacheReference } from '@/lib/newsFeedCache'
import { LIVE_CACHE_KEY } from '@/lib/newsRefresh'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export interface GleanerEpisode {
  title: string
  publishedAt: string
  videoId?: string
  spotifyId?: string
  url?: string
  source?: string
  type?: 'video' | 'audio'
  thumbnailUrl?: string
}

export interface GleanerItem {
  title: string
  url: string
  source: string
  publishedAt: string
  type: 'video' | 'text' | 'series'
  score?: number
  slot: string
  episodes?: GleanerEpisode[]
}

interface CompactEpisode {
  t: string
  p: string
  v?: string
  s?: string
}

interface CompactItem {
  title: string
  url: string
  source: string
  publishedAt: string
  type: 'video' | 'text' | 'series'
  slot: string
  episodes?: CompactEpisode[]
}

export interface CacheEntry {
  items: Array<GleanerItem | CompactItem>
  cachedAt: string
}

function hydrateEpisode(episode: GleanerEpisode | CompactEpisode): GleanerEpisode {
  if ('videoId' in episode || 'spotifyId' in episode) {
    const ep = episode as GleanerEpisode;
    if (ep.spotifyId) {
      return {
        ...ep,
        url: ep.url || `https://open.spotify.com/episode/${ep.spotifyId}`,
        source: ep.source || 'Spotify',
        type: ep.type || 'audio',
        thumbnailUrl: ep.thumbnailUrl || '',
      }
    }
    return {
      ...ep,
      url: ep.url || `https://www.youtube.com/watch?v=${ep.videoId}`,
      source: ep.source || 'YouTube',
      type: ep.type || 'video',
      thumbnailUrl: ep.thumbnailUrl || `https://i.ytimg.com/vi/${ep.videoId}/hqdefault.jpg`,
    }
  }

  const comp = episode as CompactEpisode;
  if (comp.s) {
    return {
      title: comp.t,
      publishedAt: comp.p,
      spotifyId: comp.s,
      url: `https://open.spotify.com/episode/${comp.s}`,
      source: 'Spotify',
      type: 'audio',
      thumbnailUrl: '',
    }
  }

  return {
    title: comp.t,
    publishedAt: comp.p,
    videoId: comp.v || '',
    url: `https://www.youtube.com/watch?v=${comp.v}`,
    source: 'YouTube',
    type: 'video',
    thumbnailUrl: `https://i.ytimg.com/vi/${comp.v}/hqdefault.jpg`,
  }
}

export function hydrateCacheItems(items: Array<GleanerItem | CompactItem>): GleanerItem[] {
  return items.map((item) => ({
    ...item,
    score: 'score' in item ? item.score : undefined,
    episodes: item.episodes?.map((episode) => hydrateEpisode(episode)),
  }))
}

export function createCacheEntry(items: GleanerItem[], cachedAt = new Date().toISOString()): CacheEntry {
  return {
    cachedAt,
    items: items.map((item) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      publishedAt: item.publishedAt,
      type: item.type,
      slot: item.slot,
      ...(item.episodes?.length
        ? {
            episodes: item.episodes.map((episode) => ({
              t: episode.title,
              p: episode.publishedAt,
              v: episode.videoId,
              s: episode.spotifyId,
            })),
          }
        : {}),
    })),
  }
}

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
