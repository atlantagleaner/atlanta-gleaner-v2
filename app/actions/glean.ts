'use server'

// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — Mirror Engine (glean.ts)
// ─────────────────────────────────────────────────────────────────────────────
// Called when a user expands a NewsBox accordion item.
//
// Branch A — Video (YouTube/Spotify):
//   Extracts the YouTube video ID and returns a structured video result.
//   No network fetch needed — the ID is derived from the URL.
//
// Branch B — Text article:
//   1. Check Vercel Blob cache for a version < 24 h old.
//   2. IF CACHED: return immediately (instant drawer open).
//   3. IF MISS: fetch directly from target URL, run cheerio to convert relative
//      links to absolute and strip scripts/iframes/ads, save to Blob, return HTML.
//
// Required env vars:
//   BLOB_READ_WRITE_TOKEN — Vercel Blob token (auto-set when Blob store linked)
// ─────────────────────────────────────────────────────────────────────────────

import * as cheerio     from 'cheerio'
import { put, list }    from '@vercel/blob'
import { createHash }   from 'crypto'

// ── Return types ──────────────────────────────────────────────────────────────

export type GleanResult =
  | { type: 'mirror'; html: string;  readFullUrl: string }
  | { type: 'video';  videoId: string | null; title: string; source: string; readFullUrl: string }

export interface GleanItemMeta {
  title:  string
  source: string
  type?:  'video' | 'text' | 'series'
}

// ── YouTube ID extraction ─────────────────────────────────────────────────────
// Handles all four known URL patterns.

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] || null
    const shorts = u.pathname.match(/\/shorts\/([A-Za-z0-9_-]{11})/)
    if (shorts) return shorts[1]
    const embed = u.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/)
    if (embed) return embed[1]
    return u.searchParams.get('v') ?? null
  } catch {
    return null
  }
}

function isVideoUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('spotify.com')
}

// ── URL hash for Blob cache key ───────────────────────────────────────────────

function urlHash(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 32)
}

// ── Cheerio HTML cleaner ──────────────────────────────────────────────────────
// 1. Extracts the best "main content" container (article > main > body).
// 2. Converts all relative src/href/srcset to absolute URLs.
// 3. Strips scripts, iframes, ad tags, and inline event handlers.
// 4. Opens all links in a new tab.

function cleanHtml(rawHtml: string, baseUrl: string): string {
  const $   = cheerio.load(rawHtml)
  const base = new URL(baseUrl)
  const origin   = `${base.protocol}//${base.host}`
  const basePath = base.href.endsWith('/')
    ? base.href
    : base.href.split('/').slice(0, -1).join('/') + '/'

  function toAbsolute(val: string): string {
    if (!val) return val
    if (val.startsWith('data:') || val.startsWith('blob:') || val.startsWith('#') || val.startsWith('javascript:')) return val
    try { new URL(val); return val } catch { /* relative */ }
    if (val.startsWith('//'))  return `${base.protocol}${val}`
    if (val.startsWith('/'))   return `${origin}${val}`
    return `${basePath}${val}`
  }

  // Remove noise before extraction
  $('script, iframe, ins, noscript, style[data-emotion]').remove()

  // Rewrite src
  $('[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (src) $(el).attr('src', toAbsolute(src))
  })

  // Rewrite href + open links in new tab
  $('[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    const abs = toAbsolute(href)
    $(el).attr('href', abs)
    if (el.type === 'tag' && el.name === 'a') {
      $(el).attr('target', '_blank')
      $(el).attr('rel', 'noopener noreferrer')
    }
  })

  // Rewrite srcset
  $('[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset')
    if (!srcset) return
    const rewritten = srcset.split(',').map(part => {
      const trimmed = part.trim()
      const spaceIdx = trimmed.lastIndexOf(' ')
      if (spaceIdx === -1) return toAbsolute(trimmed)
      return `${toAbsolute(trimmed.slice(0, spaceIdx))}${trimmed.slice(spaceIdx)}`
    }).join(', ')
    $(el).attr('srcset', rewritten)
  })

  // Strip inline event handlers (security hardening)
  $('*').each((_, el) => {
    if (el.type !== 'tag' || !el.attribs) return
    for (const attr of Object.keys(el.attribs)) {
      if (attr.startsWith('on')) delete el.attribs[attr]
    }
  })

  // Extract main content: article > main > [role=main] > body
  const content =
    $('article').first().html()    ||
    $('main').first().html()       ||
    $('[role="main"]').first().html() ||
    $('body').html()               ||
    $.html()

  return content
}

// ── Vercel Blob cache ─────────────────────────────────────────────────────────

const BLOB_PREFIX = 'news-mirror/'
const TTL_MS      = 24 * 60 * 60 * 1000  // 24 hours

async function getCached(url: string): Promise<string | null> {
  const pathname = `${BLOB_PREFIX}${urlHash(url)}.html`
  try {
    const { blobs } = await list({ prefix: pathname, limit: 1 })
    if (!blobs.length) return null
    const blob = blobs[0]
    if (Date.now() - new Date(blob.uploadedAt).getTime() > TTL_MS) return null
    const res = await fetch(blob.url, { cache: 'no-store' })
    return res.ok ? res.text() : null
  } catch {
    return null
  }
}

async function saveToCache(url: string, html: string): Promise<void> {
  const pathname = `${BLOB_PREFIX}${urlHash(url)}.html`
  try {
    await put(pathname, html, {
      access:          'public',
      addRandomSuffix: false,
      contentType:     'text/html; charset=utf-8',
    })
  } catch (e) {
    // Non-fatal — drawer still works, just won't be cached
    console.error('[glean] Blob write failed:', e)
  }
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function gleanArticle(
  url:      string,
  itemMeta: GleanItemMeta,
): Promise<GleanResult | { error: string }> {

  // Validate URL
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { error: 'Invalid URL' }
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { error: 'Only http/https URLs supported' }
  }

  // ── Branch A: video items ─────────────────────────────────────────────────
  if (itemMeta.type === 'video' || isVideoUrl(url)) {
    return {
      type:        'video',
      videoId:     extractYouTubeId(url),
      title:       itemMeta.title,
      source:      itemMeta.source,
      readFullUrl: url,
    }
  }

  // ── Branch B: text — check Blob cache ─────────────────────────────────────
  const cached = await getCached(url)
  if (cached) {
    return { type: 'mirror', html: cached, readFullUrl: url }
  }

  // ── Cache miss — direct fetch ────────────────────────────────────────────────
  let rawHtml: string
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AtlantaGleaner/1.0)',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) return { error: `HTTP ${res.status}` }
    rawHtml = await res.text()
  } catch (err: unknown) {
    return { error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}` }
  }

  // ── Cheerio clean + save ───────────────────────────────────────────────────
  const cleanedHtml = cleanHtml(rawHtml, url)
  await saveToCache(url, cleanedHtml)

  return { type: 'mirror', html: cleanedHtml, readFullUrl: url }
}
