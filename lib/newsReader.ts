'use server'

import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import { list, put } from '@vercel/blob'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

const BLOB_PREFIX = 'news-reader/v3/'
const TTL_MS = 30 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 12_000

export interface ReaderDocument {
  title: string
  byline: string | null
  source: string
  publishedAt: string | null
  readFullUrl: string
  heroImageUrl: string | null
  heroImageAlt: string | null
  excerpt: string | null
  bodyHtml: string
  images: Array<{
    src: string
    alt: string | null
    caption: string | null
  }>
  wordCount: number
}

export interface ReaderExtractionInput {
  title: string
  source: string
}

function urlHash(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 32)
}

function cachePathname(url: string): string {
  return `${BLOB_PREFIX}${urlHash(url)}.json`
}

/**
 * Normalizes relative URLs to absolute.
 */
function toAbsolute(baseUrl: URL, value: string): string {
  if (!value) return value
  if (
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('#') ||
    value.startsWith('javascript:')
  ) {
    return value
  }

  try {
    return new URL(value).toString()
  } catch {
    return new URL(value, baseUrl).toString()
  }
}

function cleanWhitespace(value: string | null | undefined): string | null {
  if (!value) return null
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned || null
}

/**
 * Post-processes Readability HTML to ensure URLs are absolute 
 * and unwanted tags/attributes are stripped.
 */
function cleanReadabilityHtml(html: string, baseUrl: string): string {
  const $ = cheerio.load(`<section>${html}</section>`)
  const base = new URL(baseUrl)
  const $section = $('section').first()

  // Ensure absolute URLs
  $section.find('[src]').each((_, el) => {
    const src = $(el).attr('src')
    if (src) $(el).attr('src', toAbsolute(base, src))
  })

  $section.find('[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    $(el).attr('href', toAbsolute(base, href))
    if (el.tagName === 'a') {
      $(el).attr('target', '_blank')
      $(el).attr('rel', 'noopener noreferrer')
    }
  })

  // Strip event handlers
  $section.find('*').each((_, el) => {
    if (!el.attribs) return
    for (const attr of Object.keys(el.attribs)) {
      if (attr.startsWith('on')) delete el.attribs[attr]
    }
  })

  return $section.html() || ''
}

/**
 * Pulls images out of the article body to populate the "Gallery" tab.
 */
function extractImagesAndStrip(
  bodyHtml: string,
  heroImageUrl: string | null,
  heroImageAlt: string | null,
): {
  bodyHtml: string
  images: Array<{
    src: string
    alt: string | null
    caption: string | null
  }>
} {
  const $ = cheerio.load(`<section>${bodyHtml}</section>`)
  const $section = $('section').first()
  const images: Array<{ src: string; alt: string | null; caption: string | null }> = []
  const seen = new Set<string>()

  function pushImage(src: string | null | undefined, alt: string | null | undefined, caption: string | null | undefined) {
    const normalizedSrc = cleanWhitespace(src)
    if (!normalizedSrc || seen.has(normalizedSrc)) return
    seen.add(normalizedSrc)
    images.push({
      src: normalizedSrc,
      alt: cleanWhitespace(alt),
      caption: cleanWhitespace(caption),
    })
  }

  if (heroImageUrl) {
    pushImage(heroImageUrl, heroImageAlt, heroImageAlt)
  }

  $section.find('figure').each((_, figure) => {
    const $figure = $(figure)
    const $img = $figure.find('img').first()
    const src = $img.attr('src')
    if (src) {
      pushImage(
        src,
        $img.attr('alt'),
        $figure.find('figcaption').first().text() || $img.attr('alt'),
      )
    }
    $figure.remove()
  })

  $section.find('img').each((_, img) => {
    const $img = $(img)
    const src = $img.attr('src')
    if (src) {
      pushImage(
        src,
        $img.attr('alt'),
        $img.attr('alt'),
      )
    }
    $img.remove()
  })

  return {
    bodyHtml: $section.html() || '',
    images,
  }
}

function wordCountFromHtml(bodyHtml: string): number {
  const text = cleanWhitespace(bodyHtml.replace(/<[^>]+>/g, ' '))
  return text ? text.split(/\s+/).length : 0
}

/**
 * Main Mozilla Readability Orchestrator
 */
function buildReaderDocument(
  rawHtml: string,
  rawUrl: string,
  input: ReaderExtractionInput,
): ReaderDocument {
  const dom = new JSDOM(rawHtml, { url: rawUrl })
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  if (!article || !article.content || !article.textContent || article.textContent.length < 300) {
    throw new Error('Extraction produced insufficient article body')
  }

  // 1. Clean the HTML (URLs, security)
  let cleanedHtml = cleanReadabilityHtml(article.content, rawUrl)

  // 2. Separate images for the "Gallery" split (user constraint: no interleaved media)
  const extracted = extractImagesAndStrip(cleanedHtml, null, null)
  
  // 3. Final metadata gathering
  const $ = cheerio.load(rawHtml)
  const heroImageUrl = cleanWhitespace($('meta[property="og:image"]').attr('content'))
  const heroImageAlt = cleanWhitespace($('meta[property="og:image:alt"]').attr('content')) || article.title || null

  // If extractImagesAndStrip didn't have hero, add it now if found in meta
  if (heroImageUrl) {
    const absoluteHero = toAbsolute(new URL(rawUrl), heroImageUrl)
    const alreadyPresent = extracted.images.some(img => img.src === absoluteHero)
    if (!alreadyPresent) {
      extracted.images.unshift({
        src: absoluteHero,
        alt: heroImageAlt,
        caption: heroImageAlt
      })
    }
  }

  const words = wordCountFromHtml(extracted.bodyHtml)

  return {
    title: article.title || input.title,
    byline: article.byline || null,
    source: article.siteName || input.source,
    publishedAt: article.publishedTime || null,
    readFullUrl: rawUrl,
    heroImageUrl: heroImageUrl ? toAbsolute(new URL(rawUrl), heroImageUrl) : null,
    heroImageAlt,
    excerpt: cleanWhitespace(article.excerpt) || null,
    bodyHtml: extracted.bodyHtml,
    images: extracted.images,
    wordCount: words,
  }
}

export async function getCachedReader(url: string): Promise<ReaderDocument | null> {
  const pathname = cachePathname(url)

  try {
    const { blobs } = await list({ prefix: pathname, limit: 1 })
    if (!blobs.length) return null

    const blob = blobs[0]
    if (Date.now() - new Date(blob.uploadedAt).getTime() > TTL_MS) return null

    const response = await fetch(blob.url, { cache: 'no-store' })
    if (!response.ok) return null

    return await response.json() as ReaderDocument
  } catch {
    return null
  }
}

export async function saveCachedReader(url: string, document: ReaderDocument): Promise<void> {
  try {
    await put(cachePathname(url), JSON.stringify(document), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json; charset=utf-8',
    })
  } catch (error) {
    console.error('[newsReader] Blob write failed:', error)
  }
}

export async function fetchReaderDocument(
  url: string,
  input: ReaderExtractionInput,
): Promise<ReaderDocument> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AtlantaGleaner/1.0)',
      Accept: 'text/html,application/xhtml+xml,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const rawHtml = await response.text()
  return buildReaderDocument(rawHtml, url, input)
}

export async function ensureReaderDocument(
  url: string,
  input: ReaderExtractionInput,
): Promise<ReaderDocument> {
  const cached = await getCachedReader(url)
  if (cached) return cached

  const document = await fetchReaderDocument(url, input)
  await saveCachedReader(url, document)
  return document
}
