import { NextResponse } from 'next/server';

// Force dynamic to break the 25-hour cache
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const runtime = 'nodejs';
export const maxDuration = 60;

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_API_KEY = process.env.SERPER_API_KEY;

const PODCASTS = [
  { label: 'StarTalk', youtubeId: 'UC9X7u_73YfV7Mpx2fO1u0gQ' },
  { label: 'PBS Space Time', youtubeId: 'UC7_gcs09iThXyqcRLV6TSHeA' },
];

type CrawlItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  type: string;
  score: number;
};

async function fetchPodcasts(source: { label: string; youtubeId: string }) {
  if (!YOUTUBE_API_KEY) return [];
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${source.youtubeId}&maxResults=10&order=date&type=video&key=${YOUTUBE_API_KEY}`
    );
    const data = await res.json();
    // Filter out Shorts by checking title and description for keywords
    return (data.items || [])
      .filter(
        (v: { snippet: { title: string; description: string } }) =>
          !v.snippet.title.toLowerCase().includes('#shorts') &&
          !v.snippet.description.toLowerCase().includes('#shorts')
      )
      .map((v: { id: { videoId: string }; snippet: { title: string; publishedAt?: string } }) => ({
        title: v.snippet.title,
        url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
        source: source.label,
        publishedAt: v.snippet.publishedAt || '',
        type: 'video',
        score: 100,
      }));
  } catch (e) {
    console.error(`Podcast Fetch Error (${source.label}):`, e);
    return [];
  }
}

async function crawlNews(query: string, limit: number = 10): Promise<CrawlItem[]> {
  if (!SEARCH_API_KEY) return [];
  try {
    const res = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: { 'X-API-KEY': SEARCH_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: limit }),
    });
    const data = await res.json();
    return (data.news || []).map(
      (n: { title: string; link: string; source: string; date?: string }): CrawlItem => ({
        title: n.title,
        url: n.link,
        source: n.source,
        publishedAt: n.date || '',
        type: 'text',
        score: 80,
      })
    );
  } catch (e) {
    console.error(`Crawl Error for "${query}":`, e);
    return [];
  }
}

async function computeNews() {
  const finalSlots: unknown[] = new Array(20).fill(null);
  const usedUrls = new Set<string>();

  // --- SLOTS 1-4: PODCASTS (NO SHORTS) ---
  const podcastData = await Promise.all(PODCASTS.map(fetchPodcasts));
  const podcastPicks = podcastData.flat().slice(0, 4);
  podcastPicks.forEach((p, i) => {
    finalSlots[i] = { ...p, slot: 'science_pin' };
    usedUrls.add(p.url);
  });

  // --- SLOTS 17-20: ESOTERIC INTERNATIONAL ---
  // Querying for high-quality, obscure, or in-depth global topics
  const esotericNews = await crawlNews(
    'longform international journalism esoteric obscure global issues depth',
    6
  );
  let esotericIdx = 16; // Index for slot 17
  esotericNews.forEach((n: CrawlItem) => {
    if (esotericIdx < 20 && !usedUrls.has(n.url)) {
      finalSlots[esotericIdx] = { ...n, slot: 'news-international' };
      usedUrls.add(n.url);
      esotericIdx++;
    }
  });

  // --- SLOTS 5-16: ATLANTA LOCAL (WITH GUARANTEES) ---
  const localSearch = await crawlNews('Atlanta news wsb-tv atlanta news first', 20);

  // Handle 2 WSB and 2 ANF guarantees first
  let localFillIdx = 4; // Start at slot 5
  ;['WSB-TV', 'Atlanta News First'].forEach((target) => {
    const matches = localSearch
      .filter((n: CrawlItem) => (n.source || '').toLowerCase().includes(target.toLowerCase()))
      .slice(0, 2);
    matches.forEach((m: CrawlItem) => {
      if (localFillIdx < 16 && !usedUrls.has(m.url)) {
        finalSlots[localFillIdx] = { ...m, slot: 'news' };
        usedUrls.add(m.url);
        localFillIdx++;
      }
    });
  });

  // Fill remaining local slots up to 16
  localSearch.forEach((n: CrawlItem) => {
    if (localFillIdx < 16 && !usedUrls.has(n.url)) {
      finalSlots[localFillIdx] = { ...n, slot: 'news' };
      usedUrls.add(n.url);
      localFillIdx++;
    }
  });

  // Cleanup: Remove any nulls if searches came up short
  return finalSlots.filter((s): s is Record<string, unknown> => s !== null);
}

export async function GET() {
  try {
    const items = await computeNews();
    const generatedAt = new Date().toISOString();
    return NextResponse.json(
      { items, generatedAt, count: items.length },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
    );
  } catch (error) {
    console.error('[news/route] GET error:', error);
    return NextResponse.json({ items: [], generatedAt: null, count: 0 }, { status: 500 });
  }
}

/** Cron and some clients call POST; delegate to the same handler. */
export async function POST() {
  return GET();
}
