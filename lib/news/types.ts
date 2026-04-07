// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — News Types
// ─────────────────────────────────────────────────────────────────────────────

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

// ── Compact Types for Storage ────────────────────────────────────────────────

export interface CompactEpisode {
  t: string
  p: string
  v?: string
  s?: string
}

export interface CompactItem {
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

export interface CacheReference {
  blobUrl: string
  cachedAt: string
}
