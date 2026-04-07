'use server'

import { put } from '@vercel/blob'
import type { CacheEntry } from '@/lib/news/types'

const FEED_PREFIX = 'news-feed/'

export interface CacheReference {
  blobUrl: string
  cachedAt: string
}

function feedPath(kind: 'live' | 'staged'): string {
  return `${FEED_PREFIX}${kind}.json`
}

function isCacheReference(value: CacheEntry | CacheReference | null | undefined): value is CacheReference {
  return Boolean(value && typeof value === 'object' && 'blobUrl' in value)
}

export async function saveFeedEntry(
  kind: 'live' | 'staged',
  entry: CacheEntry,
): Promise<CacheReference> {
  const blob = await put(feedPath(kind), JSON.stringify(entry), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json; charset=utf-8',
  })

  return {
    blobUrl: blob.url,
    cachedAt: entry.cachedAt,
  }
}

export async function resolveFeedEntry(
  value: CacheEntry | CacheReference | null | undefined,
): Promise<CacheEntry | null> {
  if (!value) return null
  if (!isCacheReference(value)) return value

  const response = await fetch(value.blobUrl, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Feed cache fetch failed: HTTP ${response.status}`)
  }

  return await response.json() as CacheEntry
}
