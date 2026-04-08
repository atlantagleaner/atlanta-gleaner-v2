import { SOURCE_WEIGHTS, SCORING } from '@/lib/newsConfig'
import type { 
  GleanerEpisode, 
  CompactEpisode, 
  GleanerItem, 
  CompactItem, 
  CacheEntry 
} from './types'

// ── Hydration ───────────────────────────────────────────────────────────────

export function hydrateEpisode(episode: GleanerEpisode | CompactEpisode): GleanerEpisode {
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
    ...(comp.h ? { channelHandle: comp.h } : {}),
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
              ...(episode.channelHandle ? { h: episode.channelHandle } : {}),
            })),
          }
        : {}),
    })),
  }
}

// ── Scoring ─────────────────────────────────────────────────────────────────

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

export function scoreItem(item: Partial<GleanerItem>): number {
  const text = ((item.title || '') + ' ' + (item.source || '')).toLowerCase()
  const host = getHostname(item.url || '')
  let score = item.score || 0
  
  if (host in SOURCE_WEIGHTS) {
    score += (SOURCE_WEIGHTS as any)[host]
  }
  
  const hits = (list: readonly string[], pts: number) => 
    list.reduce((s, kw) => text.includes(kw.toLowerCase()) ? s + pts : s, 0)
    
  score += hits(SCORING.localGeorgia, 3)
  score += hits(SCORING.cnn, 18)
  score += hits(SCORING.legalGeorgia, 8)
  score += hits(SCORING.absurd, 10)
  score += hits(SCORING.macabre, 12)
  
  return score
}

export function inferSlot(item: Partial<GleanerItem>): string {
  const text = ((item.title || '') + ' ' + (item.source || '')).toLowerCase()
  if (SCORING.absurd.some(kw => text.includes(kw.toLowerCase())) || 
      SCORING.macabre.some(kw => text.includes(kw.toLowerCase()))) {
    return 'letterman'
  }
  if (SCORING.international.some(kw => text.includes(kw.toLowerCase()))) {
    return 'news-international'
  }
  if (SCORING.documentary.some(kw => text.includes(kw.toLowerCase()))) {
    return 'science_nova'
  }
  return 'news'
}
