import { NextResponse } from 'next/server';

// Force fresh data and break the old 25-hour cache
export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const runtime = 'nodejs';

const SEARCH_API_KEY = process.env.SERPER_API_KEY;

type SerperNewsRow = {
  title: string;
  link: string;
  source: string;
  date?: string;
};

type GleanerItem = {
  title: string;
  url: string;
  source: string;
  date?: string;
  publishedAt: string;
  type: 'video' | 'text';
  score: number;
  slot: string;
};

/**
 * Unified Search Function
 * Uses Serper.dev to find news, videos, or esoteric articles.
 */
async function gleanerSearch(query: string, num: number = 10): Promise<GleanerItem[]> {
  if (!SEARCH_API_KEY) return [];
  try {
    const res = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: { 'X-API-KEY': SEARCH_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num }),
    });
    const data = await res.json();
    return (data.news || []).map((n: SerperNewsRow): GleanerItem => {
      const isVideo = n.link.includes('youtube.com');
      return {
        title: n.title,
        url: n.link,
        source: n.source,
        date: n.date,
        publishedAt: n.date || '',
        type: isVideo ? 'video' : 'text',
        score: 0,
        slot: 'news',
      };
    });
  } catch (e) {
    console.error(`Gleaner Search Error (${query}):`, e);
    return [];
  }
}

async function computeNews(): Promise<GleanerItem[]> {
  const finalSlots: (GleanerItem | null)[] = new Array(20).fill(null);
  const usedUrls = new Set<string>();

  // 1. SLOTS 1-4: SCIENCE PODCASTS (No Shorts)
  // We search specifically for long-form videos to avoid YouTube Shorts
  const podcastQuery =
    '(site:youtube.com/c/startalk OR site:youtube.com/c/pbsspacetime) -shorts';
  const podcasts = await gleanerSearch(podcastQuery, 6);
  podcasts.slice(0, 4).forEach((p, i) => {
    finalSlots[i] = { ...p, slot: 'science_pin' };
    usedUrls.add(p.url);
  });

  // 2. SLOTS 17-20: ESOTERIC INTERNATIONAL
  // Target high-quality, obscure, and long-form global journalism
  const esotericQuery =
    'site:aeon.co OR site:nautil.us OR site:restofworld.org international depth obscure';
  const esoteric = await gleanerSearch(esotericQuery, 6);
  let esotericIdx = 16;
  esoteric.forEach((n) => {
    if (esotericIdx < 20 && !usedUrls.has(n.url)) {
      finalSlots[esotericIdx] = { ...n, slot: 'news-international' };
      usedUrls.add(n.url);
      esotericIdx++;
    }
  });

  // 3. SLOTS 5-16: ATLANTA LOCAL (WITH OUTLET GUARANTEES)
  // Search specifically for your guaranteed outlets first
  const localQuery = 'site:wsbtv.com OR site:atlantanewsfirst.com Atlanta breaking news';
  const localNews = await gleanerSearch(localQuery, 15);

  let localIdx = 4; // Starting at Slot 5
  localNews.forEach((n) => {
    if (localIdx < 16 && !usedUrls.has(n.url)) {
      finalSlots[localIdx] = { ...n, slot: 'news' };
      usedUrls.add(n.url);
      localIdx++;
    }
  });

  // Final cleanup for any empty slots
  return finalSlots.filter((s): s is GleanerItem => s !== null);
}

export async function GET() {
  try {
    const items = await computeNews();

    // If absolutely nothing came back, return a clear diagnostic for the user
    if (items.length === 0) {
      return NextResponse.json({
        items: [
          {
            title: 'Check SERPER_API_KEY in Vercel settings.',
            url: '#',
            source: 'System',
            publishedAt: '',
            score: 0,
            slot: 'news',
            type: 'text' as const,
          },
        ],
        generatedAt: new Date().toISOString(),
        count: 1,
      });
    }

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

export async function POST() {
  return GET();
}
