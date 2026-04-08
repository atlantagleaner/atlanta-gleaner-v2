'use server'

import { ensureReaderDocument, getCachedReader, type ReaderDocument } from '@/lib/newsReader'
import { head } from '@vercel/blob'

export type GleanResult =
  | { type: 'reader'; document: ReaderDocument; updatedAt?: string }
  | { type: 'video'; videoId: string | null; title: string; source: string; readFullUrl: string; updatedAt?: string }

export interface GleanItemMeta {
  title: string
  source: string
  type?: 'video' | 'text' | 'series'
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('youtube.com')) return null
    if (parsed.pathname.startsWith('/shorts/')) return null

    const embed = parsed.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/)
    if (embed) return embed[1]

    const watchId = parsed.searchParams.get('v')
    if (watchId) return watchId

    return null
  } catch {
    return null
  }
}

function isVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname.includes('youtube.com') && !parsed.pathname.startsWith('/shorts/')
  } catch {
    return false
  }
}

export async function gleanArticle(
  url: string,
  itemMeta: GleanItemMeta,
): Promise<GleanResult | { error: string }> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { error: 'Invalid URL' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { error: 'Only http/https URLs supported' }
  }

  if (itemMeta.type === 'video' || isVideoUrl(url)) {
    return {
      type: 'video',
      videoId: extractYouTubeId(url),
      title: itemMeta.title,
      source: itemMeta.source,
      readFullUrl: url,
    }
  }

  try {
    console.log(`[gleanArticle] Gleaning: ${url}`);
    const document = await ensureReaderDocument(url, {
      title: itemMeta.title,
      source: itemMeta.source,
    })

    // Try to get actual blob timestamp if possible for "Updated X ago" fallback
    let updatedAt: string | undefined
    try {
      const crypto = await import('crypto')
      const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 32)
      const blob = await head(`news-reader/v4/${hash}.json`)
      if (blob) updatedAt = blob.uploadedAt.toISOString()
    } catch {}

    return {
      type: 'reader',
      document,
      updatedAt,
    }
  } catch (error: unknown) {
    console.error(`[gleanArticle] Failed for ${url}:`, error);
    return {
      error: `Extraction failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
