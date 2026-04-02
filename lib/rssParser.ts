// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — Lightweight RSS / Atom Parser
// Zero external dependencies. Handles RSS 2.0 and Atom 1.0.
// ─────────────────────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 9000;

export async function fetchFeed(url: string): Promise<Array<{title: string, link: string, pubDate: Date, snippet: string}>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AtlantaGleaner/2.0; +https://atlantagleaner.com)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
    }

    const text = await res.text();
    return parseXml(text);
  } finally {
    clearTimeout(timer);
  }
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: Date;
  snippet: string;
}

function parseXml(xml: string): FeedItem[] {
  const isAtom = /<feed\b/i.test(xml);
  const itemTag = isAtom ? 'entry' : 'item';
  const itemRegex = new RegExp(`<${itemTag}[\\s>]([\\s\\S]*?)<\/${itemTag}>`, 'gi');
  const items: FeedItem[] = [];
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const chunk = match[1];
    const item = parseItem(chunk, isAtom);
    if (item.title && item.link && isValidUrl(item.link)) {
      items.push(item);
    }
  }

  return items;
}

function parseItem(chunk: string, isAtom: boolean): FeedItem {
  const title = decodeEntities(
    extractCdata(chunk, 'title') ||
    extractAttrHref(chunk, 'title') ||
    ''
  ).trim();

  let link = '';
  if (isAtom) {
    link = extractAtomLink(chunk);
  } else {
    link = extractCdata(chunk, 'link') || extractPermaGuid(chunk) || '';
  }
  link = link.trim();

  const rawDate =
    extractCdata(chunk, 'pubDate') ||
    extractCdata(chunk, 'published') ||
    extractCdata(chunk, 'updated') ||
    extractCdata(chunk, 'dc:date') ||
    '';
  const pubDate = rawDate ? new Date(rawDate) : new Date();

  const rawSnippet =
    extractCdata(chunk, 'description') ||
    extractCdata(chunk, 'summary') ||
    extractCdata(chunk, 'content') ||
    '';
  const snippet = stripHtml(decodeEntities(rawSnippet)).slice(0, 400);

  return { title, link, pubDate, snippet };
}

function extractCdata(xml: string, tag: string): string {
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>`, 'i');
  let m = xml.match(cdataRe);
  if (m) return m[1];

  const plainRe = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i');
  m = xml.match(plainRe);
  if (m) return m[1];

  return '';
}

function extractAttrHref(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*href="([^"]*)"`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function extractAtomLink(chunk: string): string {
  const altRe = new RegExp('<link[^>]*rel="alternate"[^>]*href="([^"]*)"[^>]*\\/?>','i');
  let m = chunk.match(altRe);
  if (m) return m[1];

  const hrefRe = new RegExp('<link[^>]*href="([^"]*)"[^>]*\\/?>','i');
  m = chunk.match(hrefRe);
  if (m) return m[1];

  return extractCdata(chunk, 'link');
}

function extractPermaGuid(chunk: string): string {
  const re = new RegExp('<guid[^>]*isPermaLink="true"[^>]*>([^<]+)<\/guid>','i');
  const m = chunk.match(re);
  return m ? m[1].trim() : '';
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_: string, code: string) => String.fromCharCode(Number(code)));
}

function isValidUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('#')) return false;
  if (url.startsWith('javascript:')) ret