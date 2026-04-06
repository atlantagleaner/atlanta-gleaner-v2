'use server'

import { ensureReaderDocument, type ReaderDocument } from '@/lib/newsReader'

export type GleanResult =
  | { type: 'reader'; document: ReaderDocument }
  | { type: 'video'; videoId: string | null; title: string; source: string; readFullUrl: string }

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
    const document = await ensureReaderDocument(url, {
      title: itemMeta.title,
      source: itemMeta.source,
    })

    return {
      type: 'reader',
      document,
    }
  } catch (error: unknown) {
    return {
      error: `Extraction failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
