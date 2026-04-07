'use server'

import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import { list, put } from '@vercel/blob'
import { parseHTML } from 'linkedom'
import { Readability } from '@mozilla/readability'

// Metascraper core and plugins
import metascraper from 'metascraper'
import author from 'metascraper-author'
import date from 'metascraper-date'
import description from 'metascraper-description'
import image from 'metascraper-image'
import logo from 'metascraper-logo'
import publisher from 'metascraper-publisher'
import title from 'metascraper-title'
import url from 'metascraper-url'
import readability from 'metascraper-readability'
import DOMPurify from 'isomorphic-dompurify'

const scraper = metascraper([
  author(),
  date(),
  description(),
  image(),
  logo(),
  publisher(),
  title(),
  url(),
  readability()
])

const BLOB_PREFIX = 'news-reader/v4/'
const TTL_MS = 30 * 60 * 60 * 1000
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
  // 1. Sanitize with DOMPurify (whitelist-based)
  // This strips all scripts, inline styles, and non-standard attributes
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 
      'h2', 'h3', 'h4', 'blockquote', 'section', 'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    // Ensure all links are forced to be safe
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onclick'],
  })

  // 2. Post-process with Cheerio for absolute URLs and extra cleanup
  const $ = cheerio.load(`<section>${sanitized}</section>`)
  const base = new URL(baseUrl)
  const $section = $('section').first()

  // Ensure absolute URLs and standard attributes for all links
  $section.find('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) {
      $(el).attr('href', toAbsolute(base, href))
      $(el).attr('target', '_blank')
      $(el).attr('rel', 'noopener noreferrer')
    }
  })

  // Remove common share containers and labels (secondary filter)
  const shareSelectors = [
    '.social-share', '.share-container', '.share-tools', '.share-buttons',
    '.article-share', '.social-links', '.social-icons', '.share-list',
    '.share-item', '.social-item', '.social-share-list', '.social-share-item',
    '.article__share', '.article__share-icons', '.share-label', '.share-bar'
  ];
  $section.find(shareSelectors.join(',')).remove();

  // Remove share links by href patterns
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
    
    if (isShareLink) {
      $(el).remove();
    }
  });
  
  // Remove SVG icons which are often social icons left behind
  $section.find('svg').remove();

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
 * Main Mozilla Readability Orchestrator powered by Metascraper
 */
async function buildReaderDocument(
  rawHtml: string,
  rawUrl: string,
  input: ReaderExtractionInput,
): Promise<ReaderDocument> {
  // 1. Unified metadata extraction
  const metadata = await scraper({ html: rawHtml, url: rawUrl })
  
  // 2. Body extraction (from metascraper-readability or fallback)
  const article = metadata.readability || null
  
  if (!article || !article.content || !article.textContent || article.textContent.length < 300) {
    // If metascraper-readability fails, try raw Readability as a fallback
    const { document } = parseHTML(rawHtml)
    const reader = new Readability(document)
    const fallback = reader.parse()
    
    if (!fallback || !fallback.content || !fallback.textContent || fallback.textContent.length < 300) {
      throw new Error('Extraction produced insufficient article body')
    }
    
    // Map fallback to article structure
    Object.assign(article || {}, fallback)
  }

  const articleContent = article?.content || ''
  const articleTitle = metadata.title || article?.title || input.title
  const articleByline = metadata.author || article?.byline || null
  const articleSource = metadata.publisher || article?.siteName || input.source
  const articleExcerpt = metadata.description || article?.excerpt || null
  const articlePublishedAt = metadata.date || article?.publishedTime || null

  // 3. Clean the HTML (URLs, security)
  let cleanedHtml = cleanReadabilityHtml(articleContent, rawUrl)

  // 4. Separate images for the "Gallery" split
  const extracted = extractImagesAndStrip(cleanedHtml, null, null)
  
  // 5. Final metadata gathering
  const heroImageUrl = metadata.image || null
  const heroImageAlt = articleTitle

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
    title: articleTitle,
    byline: articleByline,
    source: articleSource,
    publisher: metadata.publisher || null,
    logo: metadata.logo || null,
    publishedAt: articlePublishedAt,
    readFullUrl: rawUrl,
    heroImageUrl: heroImageUrl ? toAbsolute(new URL(rawUrl), heroImageUrl) : null,
    heroImageAlt,
    excerpt: articleExcerpt,
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
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const rawHtml = await response.text()
  return await buildReaderDocument(rawHtml, url, input)
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
