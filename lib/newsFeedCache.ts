'use server'

import { put } from '@vercel/blob'
import type { CacheEntry } from '@/lib/news/types'

const FEED_PREFIX = 'news-feed/'

export interface CacheReference {
  blobUrl: string
  cachedAt: string
}

function feedPath(kind: 'live' | 'previous' | 'staged' | 'backup'): string {
  return `${FEED_PREFIX}${kind}.json`
}

function isCacheReference(value: CacheEntry | CacheReference | null | undefined): value is CacheReference {
  return Boolean(value && typeof value === 'object' && 'blobUrl' in value)
}

/**
 * Archive the current live cache as previous before saving new live.
 * Ensures we always have a fallback if new publish fails.
 */
export async function archiveCurrentLive(): Promise<CacheReference | null> {
  try {
    const response = await fetch(
      `https://api.vercel.com/v1/blob/list?prefix=${FEED_PREFIX}live`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
      }
    )

    if (!response.ok) return null

    const data = (await response.json()) as { blobs: { url: string }[] }
    const liveBlob = data.blobs?.[0]

    if (!liveBlob) return null

    // Fetch current live cache
    const liveResponse = await fetch(liveBlob.url, { cache: 'no-store' })
    if (!liveResponse.ok) return null

    const entry = (await liveResponse.json()) as CacheEntry

    // Save as previous
    const blob = await put(feedPath('previous'), JSON.stringify(entry), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json; charset=utf-8',
    })

    return {
      blobUrl: blob.url,
      cachedAt: entry.cachedAt,
    }
  } catch (error) {
    console.warn('[archiveCurrentLive] Failed:', error)
    return null
  }
}

export async function saveFeedEntry(
  kind: 'live' | 'previous' | 'staged' | 'backup',
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
