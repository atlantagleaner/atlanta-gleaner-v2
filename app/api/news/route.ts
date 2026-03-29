import { unstable_cache, revalidateTag } from 'next/cache';
import { fetchFeed } from '@/lib/rssParser';
import { SOURCES, SCORING, SLOT_CONFIG } from '@/lib/newsConfig';

export const runtime = 'nodejs';
export const maxDuration = 45;

// New investigative signals to reward original reporting
const INVESTIGATIVE_TERMS = [
 'investigation', 'exclusive', 'uncovered', 'records show', 
 'documents reveal', 'whistleblower', 'public records', 
 'foia', 'investigative', 'exposed', 'watchdog', 'scrutiny',
 'channel 2 investigates', 'atlanta news first investigates'
];

const getCachedNews = unstable_cache(
 computeNews,
 ['gleaner-news'],
 { revalidate: 90000, tags: ['gleaner-news'] }
);

export async function GET() {
 try {
 const news = await getCachedNews();
 return Response.json(news, {
 headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
 });
 } catch (err) {
 console.error('[news/route] GET error:', err);
 return Response.json({ items: [], error: 'Feed unavailable' }, { status: 200 });
 }
}

function scoreItem(item: any, source: any, now: Date): number {
 let score = source.sourceBonus || 0;
 const text = `${item.title} ${item.snippet || ''}`.toLowerCase();

 // Investigative Bonus
 if (INVESTIGATIVE_TERMS.some(kw => text.includes(kw))) {
 score += 35; 
 }

 const tiers = [
 { keywords: SCORING.tier1, points: 25 },
 { keywords: SCORING.tier2, points: 20 },
 { keywords: SCORING.tier3, points: 15 },
 ];

 for (const { keywords, points } of tiers) {
 if (keywords.some((kw: string) => text.includes(kw))) {
 score += points;
 }
 }

 const pubDate = new Date(item.pubDate || item.publishedAt);
 const ageHours = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);
 if (ageHours < 12) score += 10;
 
 return score;
}

async function computeNews() {
 const now = new Date();
 const slots = [];

 // 1. Science Pins (Slots 1-4)
 slots.push(...await fetchSciencePin(SOURCES.starTalk, 2));
 slots.push(...await fetchSciencePin(SOURCES.pbsSpaceTime, 1));
 
 // 2. Fetch and Score ALL News
 const newsSources = Object.entries(SOURCES).filter(([, s]: any) => s.type === 'news');
 const allRawItems = await Promise.all(
 newsSources.map(async ([key, source]: any) => {
 try {
 const items = await fetchFeed(source.url);
 return items.slice(0, 25).map((item: any) => ({
 title: item.title,
 url: item.link,
 source: source.label,
 publishedAt: item.pubDate,
 score: scoreItem(item, source, now),
 isLetterman: false, 
 slot: null,
 }));
 } catch { return []; }
 })
 );

 const allItems = allRawItems.flat().sort((a: any, b: any) => b.score - a.score);
 const usedUrls = new Set<string>(slots.map((i: any) => i.url));
 const guaranteedPicks = [];

 // 3. Guarantee 2 scored articles for each major local source
 const primarySources = [SOURCES.wsbTV.label, SOURCES.atlantaNewsFirst.label]; 
 for (const label of primarySources) {
 const topTwo = allItems
 .filter((i: any) => i.source === label && !usedUrls.has(i.url))
 .slice(0, 2);
 
 topTwo.forEach((i: any) => {
 usedUrls.add(i.url);
 guaranteedPicks.push({ ...i, slot: 'news' });
 });
 }

 // 4. Fill remaining slots to reach 12
 const remainingSlots = 12 - slots.length - guaranteedPicks.length;
 const newsPicks = allItems
 .filter((i: any) => !usedUrls.has(i.url))
 .slice(0, remainingSlots)
 .map((i: any) => ({ ...i, slot: 'news' }));

 return {
 items: [...slots, ...guaranteedPicks, ...newsPicks],
 generatedAt: now.toISOString(),
 };
}

async function fetchSciencePin(source: any, count: number) {
 try {
 const items = await fetchFeed(source.url);
 return items.slice(0, count).map((item: any) => ({
 title: item.title,
 url: item.link,
 source: source.label,
 score: 999,
 slot: source.type,
 }));
 } catch { return []; }
}
