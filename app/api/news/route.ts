import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const runtime = 'nodejs';

const SEARCH_API_KEY = process.env.SERPER_API_KEY;

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

type SerperEndpoint = 'news' | 'search' | 'videos';

type SerperRawRow = {
  title?: string;
  link?: string;
  source?: string;
  channel?: string;
  date?: string;
};

function normalizeRow(n: SerperRawRow): GleanerItem | null {
  const url = n.link;
  if (!n.title || !url) return null;
  const isVideo = url.includes('youtube.com');
  const dateStr = n.date || 'Recent';
  return {
    title: n.title,
    url,
    source: n.source || n.channel || 'Web',
    date: dateStr,
    publishedAt: dateStr === 'Recent' ? '' : dateStr,
    type: isVideo ? 'video' : 'text',
    score: 0,
    slot: 'news',
  };
}

// `endpoint` selects Video vs News vs Standard Search on Serper
async function gleanerSearch(
  query: string,
  num: number = 10,
  endpoint: SerperEndpoint = 'news'
): Promise<GleanerItem[]> {
  if (!SEARCH_API_KEY) return [];
  try {
    const res = await fetch(`https://google.serper.dev/${endpoint}`, {
      method: 'POST',
      headers: { 'X-API-KEY': SEARCH_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num }),
    });
    const data = (await res.json()) as Record<string, unknown>;

    // Serper returns different arrays per endpoint
    const results = (data[endpoint] as SerperRawRow[] | undefined) || (data.organic as SerperRawRow[] | undefined) || [];

    return results.map((n) => normalizeRow(n)).filter((x): x is GleanerItem => x !== null);
  } catch (e) {
    console.error(`Gleaner Search Error (${query}):`, e);
    return [];
  }
}

async function computeNews(): Promise<GleanerItem[]> {
  const finalSlots: (GleanerItem | null)[] = new Array(20).fill(null);
  const usedUrls = new Set<string>();

  const podcastQuery = '(site:youtube.com/c/startalk OR site:youtube.com/c/pbsspacetime) -shorts';
  const esotericQuery =
    'site:aeon.co OR site:nautil.us OR site:restofworld.org international depth obscure';
  const localGuaranteesQuery = 'site:wsbtv.com OR site:atlantanewsfirst.com Atlanta breaking news';
  const localGeneralQuery = 'Atlanta breaking news';

  const [podcasts, esoteric, localGuarantees, localGeneral] = await Promise.all([
    gleanerSearch(podcastQuery, 6, 'videos'),
    gleanerSearch(esotericQuery, 6, 'search'),
    gleanerSearch(localGuaranteesQuery, 6, 'news'),
    gleanerSearch(localGeneralQuery, 15, 'news'),
  ]);

  // SLOTS 1-4: SCIENCE PODCASTS
  podcasts.slice(0, 4).forEach((p, i) => {
    finalSlots[i] = { ...p, slot: 'science_pin' };
    usedUrls.add(p.url);
  });

  // SLOTS 17-20: ESOTERIC INTERNATIONAL
  let esotericIdx = 16;
  esoteric.forEach((n) => {
    if (esotericIdx < 20 && !usedUrls.has(n.url)) {
      finalSlots[esotericIdx] = { ...n, slot: 'news-international' };
      usedUrls.add(n.url);
      esotericIdx++;
    }
  });

  // SLOTS 5-16: ATLANTA LOCAL
  let localIdx = 4;

  localGuarantees.forEach((n) => {
    if (localIdx < 16 && !usedUrls.has(n.url)) {
      finalSlots[localIdx] = { ...n, slot: 'news' };
      usedUrls.add(n.url);
      localIdx++;
    }
  });

  localGeneral.forEach((n) => {
    if (localIdx < 16 && !usedUrls.has(n.url)) {
      finalSlots[localIdx] = { ...n, slot: 'news' };
      usedUrls.add(n.url);
      localIdx++;
    }
  });

  return finalSlots.filter((s): s is GleanerItem => s !== null);
}

export async function GET() {
  try {
    const items = await computeNews();

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
    return NextResponse.json(
      { items: [], error: 'Internal Error', generatedAt: null, count: 0 },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
