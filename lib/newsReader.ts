import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import { put, head } from '@vercel/blob'
import { parseHTML } from 'linkedom'
import { Readability } from '@mozilla/readability'
import sanitizeHtml from 'sanitize-html'

// ── Configuration ─────────────────────────────────────────────────────────────

const BLOB_PREFIX = 'news-reader/v4/'
const TTL_MS = 30 * 60 * 60 * 1000 // 30 hours
const FETCH_TIMEOUT_MS = 12_000

export interface ReaderDocument {
  title: string
  byline: string | null
  source: string
  publisher: string | null
  logo: string | null
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function urlHash(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 32)
}

function cachePathname(url: string): string {
  return `${BLOB_PREFIX}${urlHash(url)}.json`
}

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

function wordCountFromHtml(bodyHtml: string): number {
  const text = cleanWhitespace(bodyHtml.replace(/<[^>]+>/g, ' '))
  return text ? text.split(/\s+/).length : 0
}

// ── HTML Cleaning ─────────────────────────────────────────────────────────────
// Server-side sanitizer: use sanitize-html (htmlparser2) instead of isomorphic-dompurify,
// which pulls jsdom and hits ERR_REQUIRE_ESM for @exodus/bytes on Vercel serverless.

const READABILITY_SANITIZE_OPTS: NonNullable<Parameters<typeof sanitizeHtml>[1]> = {
  allowedTags: [
    'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
    'h2', 'h3', 'h4', 'blockquote', 'section', 'div', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
}

function cleanReadabilityHtml(html: string, baseUrl: string): string {
  let sanitized = html
  try {
    sanitized = sanitizeHtml(html, READABILITY_SANITIZE_OPTS)
  } catch (err) {
    console.error('[cleanReadabilityHtml] sanitize-html failed:', err)
  }

  const $ = cheerio.load(`<section>${sanitized}</section>`)
  const base = new URL(baseUrl)
  const $section = $('section').first()

  $section.find('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) {
      $(el).attr('href', toAbsolute(base, href))
      $(el).attr('target', '_blank')
      $(el).attr('rel', 'noopener noreferrer')
    }
  })

  const shareSelectors = [
    '.social-share', '.share-container', '.share-tools', '.share-buttons',
    '.article-share', '.social-links', '.social-icons', '.share-list',
    '.share-item', '.social-item', '.social-share-list', '.social-share-item',
    '.article__share', '.article__share-icons', '.share-label', '.share-bar'
  ];
  $section.find(shareSelectors.join(',')).remove();

  $section.find('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const isShareLink = 
      href.includes('facebook.com/sharer') ||
      href.includes('twitter.com/intent/tweet') ||
      href.includes('linkedin.com/share') ||
      href.includes('pinterest.com/pin/create') ||
      (href.startsWith('mailto:') && (href.includes('subject=') || href.includes('body='))) ||
      href.includes('whatsapp://send') ||
      href.includes('t.me/share');
    
    if (isShareLink) $(el).remove();
  });
  
  $section.find('svg').remove();
  return $section.html() || ''
}

// ── Extraction ────────────────────────────────────────────────────────────────

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
      pushImage(src, $img.attr('alt'), $figure.find('figcaption').first().text() || $img.attr('alt'))
    }
    $figure.remove()
  })

  $section.find('img').each((_, img) => {
    const $img = $(img)
    const src = $img.attr('src')
    if (src) pushImage(src, $img.attr('alt'), $img.attr('alt'))
    $img.remove()
  })

  return { bodyHtml: $section.html() || '', images }
}

async function buildReaderDocument(
  rawHtml: string,
  rawUrl: string,
  input: ReaderExtractionInput,
): Promise<ReaderDocument> {
  const { document } = parseHTML(rawHtml)
  const reader = new Readability(document)
  const article = reader.parse()
  
  if (!article || !article.content) {
    throw new Error('Readability failed to extract content')
  }

  const articleTitle = article.title || input.title
  const articleByline = article.byline || null
  const articleSource = article.siteName || input.source
  const articleExcerpt = article.excerpt || null
  const cleanedHtml = cleanReadabilityHtml(article.content, rawUrl)

  // Extract meta tags for more info
  const $ = cheerio.load(rawHtml)
  const ogImage = $('meta[property="og:image"]').attr('content')
  const twitterImage = $('meta[name="twitter:image"]').attr('content')
  const heroImageUrl = ogImage || twitterImage || null

  const extracted = extractImagesAndStrip(cleanedHtml, null, null)
  
  if (heroImageUrl) {
    const absoluteHero = toAbsolute(new URL(rawUrl), heroImageUrl)
    if (!extracted.images.some(img => img.src === absoluteHero)) {
      extracted.images.unshift({ src: absoluteHero, alt: articleTitle, caption: articleTitle })
    }
  }

  const words = wordCountFromHtml(extracted.bodyHtml)

  return {
    title: articleTitle,
    byline: articleByline,
    source: articleSource,
    publisher: articleSource,
    logo: null, // Hard to get reliably without metascraper
    publishedAt: null, 
    readFullUrl: rawUrl,
    heroImageUrl: heroImageUrl ? toAbsolute(new URL(rawUrl), heroImageUrl) : null,
    heroImageAlt: articleTitle,
    excerpt: articleExcerpt,
    bodyHtml: extracted.bodyHtml,
    images: extracted.images,
    wordCount: words,
  }
}

// ── Cache Operations ──────────────────────────────────────────────────────────

export async function getCachedReader(url: string): Promise<ReaderDocument | null> {
  const pathname = cachePathname(url)

  try {
    // 1. Optimized check: Use head() to see if it exists and is fresh
    const blob = await head(pathname)
    if (!blob) return null
    if (Date.now() - new Date(blob.uploadedAt).getTime() > TTL_MS) return null

    // 2. Fetch the actual content
    const response = await fetch(blob.url, { cache: 'no-store' })
    if (!response.ok) return null

    return await response.json() as ReaderDocument
  } catch (error) {
    console.warn('[getCachedReader] Cache miss/error:', error)
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

// ── Fetching ──────────────────────────────────────────────────────────────────

export async function fetchReaderDocument(
  url: string,
  input: ReaderExtractionInput,
): Promise<ReaderDocument> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const rawHtml = await response.text()
  return await buildReaderDocument(rawHtml, url, input)
}

export async function ensureReaderDocument(
  url: string,
  input: ReaderExtractionInput,
): Promise<ReaderDocument> {
  try {
    const cached = await getCachedReader(url)
    if (cached) return cached

    const document = await fetchReaderDocument(url, input)
    await saveCachedReader(url, document)
    return document
  } catch (err) {
    console.error(`[ensureReaderDocument] Failed for ${url}:`, err)
    throw err
  }
}
