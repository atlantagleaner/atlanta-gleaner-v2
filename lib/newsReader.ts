'use server'

import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import { list, put } from '@vercel/blob'

const BLOB_PREFIX = 'news-reader/'
const TTL_MS = 30 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 12_000

const NOISE_SELECTOR = [
  'script',
  'style',
  'iframe',
  'ins',
  'noscript',
  'form',
  'button',
  'svg',
  'canvas',
  'nav',
  'header',
  'footer',
  'aside',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="complementary"]',
  '[role="dialog"]',
  '[class*="nav"]',
  '[class*="header"]',
  '[class*="footer"]',
  '[class*="sidebar"]',
  '[class*="related"]',
  '[class*="recommend"]',
  '[class*="comment"]',
  '[class*="social"]',
  '[class*="share"]',
  '[class*="subscribe"]',
  '[class*="newsletter"]',
  '[class*="promo"]',
  '[class*="cookie"]',
  '[id*="cookie"]',
  '[class*="popup"]',
  '[class*="paywall"]',
  '[class*="ad-"]',
  '[class*="-ad"]',
  '.advertisement',
  '.sr-only',
].join(', ')

const ROOT_CANDIDATE_SELECTOR = [
  'article',
  'main',
  '[role="main"]',
  '.article-body',
  '.article__body',
  '.story-body',
  '.entry-content',
  '.post-content',
  '.wysiwyg',
  '.content-body',
  '.story-content',
  'body',
].join(', ')

const BLOCK_TEXT_DROP_PATTERNS = [
  /^trending stories:?$/i,
  /^see all topics$/i,
  /^download(?: the)?(?: free)? .* app.*$/i,
  /^free .* news app.*$/i,
  /^subscribe(?: now)?$/i,
  /^sign up(?: now)?$/i,
  /^related stories:?$/i,
  /^related articles:?$/i,
  /^more from .*$/i,
  /^recommended for you$/i,
  /^you may also like$/i,
  /^share this story$/i,
  /^watch video$/i,
  /^listen to this episode$/i,
  /^\[download:.*\]$/i,
  /advertisement/i,
  /sponsored/i,
  /cookie/i,
  /privacy policy/i,
  /terms of service/i,
]

interface SiteProfile {
  rootSelectors?: string[]
  bylineSelectors?: string[]
  heroImageSelectors?: string[]
  noiseSelectors?: string[]
}

const SITE_PROFILES: Record<string, SiteProfile> = {
  'wsbtv.com': {
    rootSelectors: [
      '.article-body-wrapper',
      '.b-article-body',
      '[class*="article-body"]',
      'article',
    ],
    bylineSelectors: [
      '.b-byline__names',
      '.ts-byline .b-byline__names',
      '.b-byline a',
    ],
    heroImageSelectors: [
      '.redesign-lead-art img',
      '.b-lead-art img',
      'article img',
    ],
    noiseSelectors: [
      '.b-author-bio',
      '.persistent-player',
      '.interstitial-link',
      '[class*="related"]',
      '[class*="read-next"]',
      '[class*="trending"]',
      '[class*="topic"]',
      '[class*="download"]',
      '[class*="subscribe"]',
    ],
  },
  'wsb-tv.com': {
    rootSelectors: [
      '.article-body-wrapper',
      '.b-article-body',
      '[class*="article-body"]',
      'article',
    ],
    bylineSelectors: [
      '.b-byline__names',
      '.ts-byline .b-byline__names',
      '.b-byline a',
    ],
    heroImageSelectors: [
      '.redesign-lead-art img',
      '.b-lead-art img',
      'article img',
    ],
    noiseSelectors: [
      '.b-author-bio',
      '.persistent-player',
      '.interstitial-link',
      '[class*="related"]',
      '[class*="read-next"]',
      '[class*="trending"]',
      '[class*="topic"]',
      '[class*="download"]',
      '[class*="subscribe"]',
    ],
  },
  'atlantanewsfirst.com': {
    rootSelectors: [
      '.article-body',
      '.article-body-wrapper',
      '.article-content',
      '[class*="article-body"]',
      'article',
    ],
    bylineSelectors: [
      '.byline',
      '.article-byline',
      '[class*="byline"]',
    ],
    heroImageSelectors: [
      '.lead-art img',
      '.article-hero img',
      'article img',
    ],
    noiseSelectors: [
      '.related-content',
      '.newsletter',
      '.taboola',
      '.outbrain',
      '[data-testid*="ad"]',
    ],
  },
  'wabe.org': {
    rootSelectors: [
      '.entry-content',
      '.post-content',
      '.article-content',
      '.story__content',
      'article',
      'main article',
    ],
    bylineSelectors: [
      '.author',
      '.post-author',
      '.byline',
      '[rel="author"]',
    ],
    heroImageSelectors: [
      '.featured-image img',
      '.wp-post-image',
      'article img',
    ],
    noiseSelectors: [
      '.newsletter',
      '.donate',
      '.related-posts',
      '.wp-block-embed',
      '.sharedaddy',
    ],
  },
  'gpb.org': {
    rootSelectors: [
      '.node__content',
      '.field--name-body',
      '.story__body',
      '.article__body',
      'article',
    ],
    bylineSelectors: [
      '.author-name',
      '.field--name-field-author',
      '.byline',
      '.story-author',
    ],
    heroImageSelectors: [
      '.hero img',
      '.field--name-field-image img',
      '.media img',
      'article img',
    ],
    noiseSelectors: [
      '.share-this',
      '.related-content',
      '.newsletter',
      '.donate',
      '.audiofield',
    ],
  },
  'cnn.com': {
    rootSelectors: [
      'article',
      'main',
      '[role="main"]',
      '[data-type="article"]',
      '[class*="article__content"]',
      '[class*="article-body"]',
    ],
    bylineSelectors: [
      '[data-type="byline-area"]',
      '[class*="byline"]',
      '[rel="author"]',
    ],
    heroImageSelectors: [
      '[data-component-name="image"] img',
      'article img',
      'main img',
    ],
    noiseSelectors: [
      '[class*="related"]',
      '[class*="recirculation"]',
      '[class*="topic"]',
      '[class*="trending"]',
      '[class*="subscribe"]',
      '[class*="newsletter"]',
      '[data-component-name="footer"]',
    ],
  },
}

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

interface ReaderMetadata {
  title: string | null
  byline: string | null
  publishedAt: string | null
  heroImageUrl: string | null
  heroImageAlt: string | null
}

function hostnameFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function getSiteProfile(url: string): SiteProfile | null {
  const host = hostnameFor(url)
  return SITE_PROFILES[host] ?? null
}

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

function parseJsonLd($: cheerio.CheerioAPI): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = []

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text()
    if (!raw) return

    try {
      const parsed = JSON.parse(raw) as unknown
      const queue = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of queue) {
        if (item && typeof item === 'object') {
          results.push(item as Record<string, unknown>)
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  })

  return results
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string') return cleanWhitespace(value)
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstString(entry)
      if (found) return found
    }
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return firstString(record.name) || firstString(record.text)
  }
  return null
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const cleaned = cleanWhitespace(value)
    if (cleaned) return cleaned
  }
  return null
}

function selectFirstText(
  $: cheerio.CheerioAPI,
  selectors: string[] | undefined,
): string | null {
  if (!selectors?.length) return null

  for (const selector of selectors) {
    const value = cleanWhitespace($(selector).first().text())
    if (value) return value
  }

  return null
}

function selectFirstAttr(
  $: cheerio.CheerioAPI,
  selectors: string[] | undefined,
  attr: string,
): string | null {
  if (!selectors?.length) return null

  for (const selector of selectors) {
    const value = cleanWhitespace($(selector).first().attr(attr))
    if (value) return value
  }

  return null
}

function extractMetadata(
  $: cheerio.CheerioAPI,
  rawUrl: string,
  input: ReaderExtractionInput,
): ReaderMetadata {
  const profile = getSiteProfile(rawUrl)
  const jsonLd = parseJsonLd($)
  const articleLd = jsonLd.find((item) => {
    const type = item['@type']
    if (Array.isArray(type)) return type.some((entry) => String(entry).toLowerCase().includes('article'))
    return String(type || '').toLowerCase().includes('article')
  })

  const metaTitle =
    cleanWhitespace($('meta[property="og:title"]').attr('content')) ||
    cleanWhitespace($('meta[name="twitter:title"]').attr('content')) ||
    cleanWhitespace($('h1').first().text()) ||
    cleanWhitespace($('title').first().text())

  const byline = firstNonEmpty(
    cleanWhitespace($('meta[name="author"]').attr('content')),
    cleanWhitespace($('meta[property="article:author"]').attr('content')),
    cleanWhitespace($('meta[property="authors"]').attr('content')),
    firstString(articleLd?.author),
    selectFirstText($, profile?.bylineSelectors),
    cleanWhitespace($('[rel="author"]').first().text()),
    cleanWhitespace($('[class*="author"]').first().text()),
  )

  const publishedAt =
    cleanWhitespace($('meta[property="article:published_time"]').attr('content')) ||
    cleanWhitespace($('meta[name="parsely-pub-date"]').attr('content')) ||
    cleanWhitespace($('time[datetime]').first().attr('datetime')) ||
    firstString(articleLd?.datePublished)

  const heroImageUrl = firstNonEmpty(
    cleanWhitespace($('meta[property="og:image"]').attr('content')),
    firstString(articleLd?.image),
    selectFirstAttr($, profile?.heroImageSelectors, 'src'),
    cleanWhitespace($('article img').first().attr('src')),
    cleanWhitespace($('main img').first().attr('src')),
  )

  const heroImageAlt = firstNonEmpty(
    selectFirstAttr($, profile?.heroImageSelectors, 'alt'),
    cleanWhitespace($('article img').first().attr('alt')),
    cleanWhitespace($('main img').first().attr('alt')),
  )

  return {
    title: metaTitle || input.title,
    byline,
    publishedAt,
    heroImageUrl: heroImageUrl ? toAbsolute(new URL(rawUrl), heroImageUrl) : null,
    heroImageAlt,
  }
}

function scoreRoot($root: cheerio.Cheerio<any>): number {
  const textLength = cleanWhitespace($root.text())?.length ?? 0
  const paragraphCount = $root.find('p').length
  const headingCount = $root.find('h2, h3, h4').length
  const imageCount = $root.find('img').length
  const listCount = $root.find('ul, ol').length
  const noiseCount = $root.find('nav, aside, form, [class*="related"], [class*="share"]').length

  return (
    textLength +
    paragraphCount * 240 +
    headingCount * 80 +
    imageCount * 80 +
    listCount * 50 -
    noiseCount * 180
  )
}

function pickContentRoot($: cheerio.CheerioAPI, rawUrl: string): cheerio.Cheerio<any> {
  const profile = getSiteProfile(rawUrl)
  const preferredRoots = profile?.rootSelectors?.length
    ? $(profile.rootSelectors.join(', ')).toArray()
    : []
  const roots = preferredRoots.length ? preferredRoots : $(ROOT_CANDIDATE_SELECTOR).toArray()
  let bestRoot: cheerio.Cheerio<any> = $('body').first()
  let bestScore = -1

  for (const root of roots) {
    const $root = $(root)
    const score = scoreRoot($root)
    if (score > bestScore) {
      bestScore = score
      bestRoot = $root
    }
  }

  return bestRoot
}

function normalizeContentHtml(rawHtml: string, baseUrl: string): string {
  const $ = cheerio.load(`<section>${rawHtml}</section>`)
  const base = new URL(baseUrl)
  const $section = $('section').first()
  const profile = getSiteProfile(baseUrl)

  $section.find(NOISE_SELECTOR).remove()
  if (profile?.noiseSelectors?.length) {
    $section.find(profile.noiseSelectors.join(', ')).remove()
  }
  $section.find('.advert, .ad, [data-role*="ad"], [id*="taboola"], [class*="taboola"], [class*="outbrain"]').remove()

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

  $section.find('[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset')
    if (!srcset) return
    const rewritten = srcset
      .split(',')
      .map((part) => {
        const trimmed = part.trim()
        const spaceIdx = trimmed.lastIndexOf(' ')
        if (spaceIdx === -1) return toAbsolute(base, trimmed)
        return `${toAbsolute(base, trimmed.slice(0, spaceIdx))}${trimmed.slice(spaceIdx)}`
      })
      .join(', ')
    $(el).attr('srcset', rewritten)
  })

  $section.find('*').each((_, el) => {
    if (!el.attribs) return
    for (const attr of Object.keys(el.attribs)) {
      if (attr.startsWith('on')) delete el.attribs[attr]
    }
  })

  $section.find('div, section, article').each((_, el) => {
    const $el = $(el)
    const text = cleanWhitespace($el.text())
    const hasMedia = $el.find('img, figure, video, blockquote, ul, ol, table').length > 0
    const hasParagraphs = $el.find('p').length > 0
    if (!text && !hasMedia) {
      $el.remove()
      return
    }
    if (!hasMedia && !hasParagraphs && el.tagName !== 'article') {
      $el.replaceWith($el.contents())
    }
  })

  const allowedTags = new Set([
    'p',
    'a',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'span',
    'h2',
    'h3',
    'h4',
    'blockquote',
    'ul',
    'ol',
    'li',
    'figure',
    'img',
    'figcaption',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
    'br',
  ])

  $section.find('*').each((_, el) => {
    if (!allowedTags.has(el.tagName)) {
      $(el).replaceWith($(el).contents())
    }
  })

  return $section.html() || ''
}

function buildParagraphHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => cleanWhitespace(paragraph))
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join('')
}

function extractJsonLdArticleBody(rawHtml: string): string | null {
  const $ = cheerio.load(rawHtml)
  const entries = parseJsonLd($)

  for (const entry of entries) {
    const articleBody = firstString((entry as Record<string, unknown>).articleBody)
    if (articleBody && articleBody.split(/\s+/).length >= 140) {
      return buildParagraphHtml(articleBody)
    }
  }

  return null
}

function normalizeComparableText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function isBoilerplateBlock(text: string): boolean {
  if (!text) return true
  return BLOCK_TEXT_DROP_PATTERNS.some((pattern) => pattern.test(text))
}

function hasRecirculationHint(value: string): boolean {
  return /(related|recirc|trending|topic|recommend|popular|latest|read-next|more-stories|newsletter|promo|taboola|outbrain)/i.test(value)
}

function recirculationScore(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<any>,
): number {
  const text = cleanWhitespace($el.text()) || ''
  if (!text) return 0

  const links = $el.find('a')
  const anchorCount = links.length
  const listItems = $el.find('li')
  const paragraphs = $el.find('p')
  const sentenceLikeMatches = text.match(/[.!?](?:\s|$)/g)
  const sentenceCount = sentenceLikeMatches?.length ?? 0
  const textLength = text.length
  const anchorTextLength = links
    .toArray()
    .reduce((sum, link) => sum + (cleanWhitespace($(link).text())?.length ?? 0), 0)
  const linkDensity = textLength > 0 ? anchorTextLength / textLength : 0
  const attrText = [
    $el.attr('class') || '',
    $el.attr('id') || '',
    $el.attr('data-testid') || '',
    $el.attr('data-component-name') || '',
  ].join(' ')

  let score = 0

  if (hasRecirculationHint(attrText)) score += 4
  if (anchorCount >= 2 && linkDensity >= 0.55) score += 3
  if (anchorCount >= 3 && textLength <= 280) score += 2
  if (listItems.length >= 2 && anchorCount >= listItems.length) score += 3
  if (paragraphs.length === 0 && sentenceCount === 0 && anchorCount >= 2) score += 2
  if (isBoilerplateBlock(normalizeComparableText(text))) score += 4

  return score
}

function pruneRecirculationBlocks(
  $: cheerio.CheerioAPI,
  $section: cheerio.Cheerio<any>,
): void {
  const blockSelector = 'ul, ol, div, section, article'

  $section.find(blockSelector).each((_, el) => {
    const $el = $(el)
    const score = recirculationScore($, $el)
    const hasLargeParagraph = $el
      .find('p')
      .toArray()
      .some((paragraph) => (cleanWhitespace($(paragraph).text())?.length ?? 0) >= 220)
    const containsMedia = $el.find('img, figure, video, table').length > 0

    if (score >= 5 && !hasLargeParagraph && !containsMedia) {
      $el.remove()
    }
  })
}

function pruneRepeatedBlocks(
  $: cheerio.CheerioAPI,
  $section: cheerio.Cheerio<any>,
): void {
  const seen = new Set<string>()
  const blockSelector = 'p, li, blockquote, h2, h3, h4, h5, h6, figcaption, div, section, article'

  $section.find(blockSelector).each((_, el) => {
    const $el = $(el)
    const text = normalizeComparableText($el.text())
    if (!text) return

    if (isBoilerplateBlock(text)) {
      $el.remove()
      return
    }

    const compact = text.replace(/[^a-z0-9]+/g, ' ').trim()
    if (compact.length < 8) {
      return
    }

    if (seen.has(compact)) {
      $el.remove()
      return
    }

    seen.add(compact)
  })
}

function trimLeadingDuplicates(
  bodyHtml: string,
  title: string,
  byline: string | null,
): string {
  const $ = cheerio.load(`<section>${bodyHtml}</section>`)
  const $section = $('section').first()
  const titleText = normalizeComparableText(title)
  const bylineText = normalizeComparableText(byline)

  $section.children().each((_, el) => {
    const text = normalizeComparableText($(el).text())
    const isDuplicateTitle = text && text === titleText
    const isDuplicateByline = bylineText && text && (text === bylineText || text === `by ${bylineText}`)

    if (isDuplicateTitle || isDuplicateByline) {
      $(el).remove()
      return
    }

    return false
  })

  return $section.html() || bodyHtml
}

function extractImages(
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
    pushImage(
      $img.attr('src'),
      $img.attr('alt'),
      $figure.find('figcaption').first().text(),
    )
    $figure.remove()
  })

  $section.find('img').each((_, img) => {
    const $img = $(img)
    pushImage(
      $img.attr('src'),
      $img.attr('alt'),
      $img.attr('alt'),
    )
    $img.remove()
  })

  $section.find('p, div, section, article').each((_, el) => {
    const $el = $(el)
    const text = cleanWhitespace($el.text())
    const hasMedia = $el.find('img, figure').length > 0
    if (!text && !hasMedia) {
      $el.remove()
    }
  })

  return {
    bodyHtml: $section.html() || '',
    images,
  }
}

function buildExcerpt(bodyText: string): string | null {
  const cleaned = cleanWhitespace(bodyText)
  if (!cleaned) return null
  return cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned
}

function wordCountFromHtml(bodyHtml: string): number {
  const text = cleanWhitespace(bodyHtml.replace(/<[^>]+>/g, ' '))
  return text ? text.split(/\s+/).length : 0
}

function buildReaderDocument(
  rawHtml: string,
  rawUrl: string,
  input: ReaderExtractionInput,
): ReaderDocument {
  const $ = cheerio.load(rawHtml)
  const metadata = extractMetadata($, rawUrl, input)
  const root = pickContentRoot($, rawUrl)
  let cleanedBodyHtml = normalizeContentHtml(root.html() || $.html(), rawUrl)
  cleanedBodyHtml = trimLeadingDuplicates(cleanedBodyHtml, metadata.title || input.title, metadata.byline)

  const sanitized = cheerio.load(`<section>${cleanedBodyHtml}</section>`)
  const $section = sanitized('section').first()
  pruneRecirculationBlocks(sanitized, $section)
  pruneRepeatedBlocks(sanitized, $section)
  cleanedBodyHtml = $section.html() || cleanedBodyHtml

  let words = wordCountFromHtml(cleanedBodyHtml)

  if (words < 140) {
    const jsonLdBody = extractJsonLdArticleBody(rawHtml)
    if (jsonLdBody) {
      cleanedBodyHtml = jsonLdBody
      words = wordCountFromHtml(cleanedBodyHtml)
    }
  }

  if (!cleanedBodyHtml || words < 140) {
    throw new Error('Extraction produced insufficient article body')
  }

  const extracted = extractImages(
    cleanedBodyHtml,
    metadata.heroImageUrl,
    metadata.heroImageAlt,
  )
  cleanedBodyHtml = extracted.bodyHtml
  words = wordCountFromHtml(cleanedBodyHtml)

  if (!cleanedBodyHtml || words < 140) {
    throw new Error('Extraction produced insufficient text-only article body')
  }

  const bodyText = cheerio.load(`<section>${cleanedBodyHtml}</section>`)('section').text()

  return {
    title: metadata.title || input.title,
    byline: metadata.byline,
    source: input.source,
    publishedAt: metadata.publishedAt,
    readFullUrl: rawUrl,
    heroImageUrl: metadata.heroImageUrl,
    heroImageAlt: metadata.heroImageAlt,
    excerpt: buildExcerpt(bodyText),
    bodyHtml: cleanedBodyHtml,
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
