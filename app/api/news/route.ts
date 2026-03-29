import { unstable_cache, revalidateTag } from 'next/cache';
import { fetchFeed } from '@/lib/rssParser';
import { SOURCES, SCORING, SLOT_CONFIG } from '@/lib/newsConfig';

export const runtime = 'nodejs';
export const maxDuration = 45;

const TOTAL_ITEMS = 15;
const INTERNATIONAL_QUOTA = 4;

const INVESTIGATIVE_TERMS = [
 'investigation', 'exclusive', 'uncovered', 'records show', 
 'documents reveal', 'whistleblower', 'public records', 
 'foia', 'investigative', 'exposed', 'watchdog', 'scrutiny',
 'channel 2 investigates', 'atlanta news first investigates'
];

const ESOTERIC_TERMS = [
 'deep dive', 'analysis', 'in-depth', 'esoteric', 'obscure',
 'niche', 'longread', 'untold', 'forgotten', 'phenomenon',
 'special report', 'origins', 'history of', 'complexities'
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

function scoreItem(item: any, source: any, now: Date, isInternational: boolean): number {
 let score = source.sourceBonus || 0;
 const text = `${item.title} ${item.snippet || ''}`.toLowerCase();

 // Watchdog Bonus
 if (INVESTIGATIVE_TERMS.some(kw => text.includes(kw))) {
 score += 35; 
 }

 // Esoteric Deep Dive Bonus (Heavily weighted for international)
 if (isInternational && ESOTERIC_TERMS.some(kw => text.includes(kw))) {
 score += 45; 
 }

 const tiers = [
 { keywords: SCORING.tier1, points: 25 },
 { keywords: SCORING.tier2, points: 20 },
 { keywords: SCORING.tier3, points: 15 },
 ];

 for (const { keywords, points } of tiers) {
 if (keywords?.some((kw: string) => text.includes(kw))) {
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

 // 1. Science Pins
 slots.push(...await fetchSciencePin(SOURCES.starTalk, 2));
 slots.push(...await fetchSciencePin(SOURCES.pbsSpaceTime, 1));
 
 // 2. Fetch and Score ALL News
 const newsSources = Object.entries(SOURCES).filter(([, s]: any) => s.type === 'news' || s.type === 'international');
 const allRawItems = await Promise.all(
 newsSources.map(async ([key, source]: any) => {
 try {
 const isInternational = source.type === 'international' || source.isInternational === true;
 const items = await fetchFeed(source.url);
 
 return items.slice(0, 25).map((item: any) => ({
 title: item.title,
 url: item.link,
 source: source.label,
 publishedAt: item.pubDate,
 score: scoreItem(item, source, now, isInternational),
 isInternational,
 slot: null,
 }));
 } catch { return []; }
 })
 );

 const allItems = allRawItems.flat().sort((a: any, b: any) => b.score - a.score);
 const usedUrls = new Set<string>(slots.map((i: any) => i.url));
 const guaranteedPicks: any[] = [];

 // 3a. Guarantee Local Local Sources (2 each)
 const primarySources = [SOURCES.wsbTV?.label, SOURCES.atlantaNewsFirst?.label].filter(Boolean); 
 for (const label of primarySources) {
 const topTwo = allItems
 .filter((i: any) => i.source === label && !usedUrls.has(i.url))
 .slice(0, 2);
 
 topTwo.forEach((i: any) => {
 usedUrls.add(i.url);
 guaranteedPicks.push({ ...i, slot: 'news-local' });
 });
 }

 // 3b. Guarantee International Deep Dives (Top 4)
 const topInternational = allItems
 .filter((i: any) => i.isInternational && !usedUrls.has(i.url))
 .slice(0, INTERNATIONAL_QUOTA);

 topInternational.forEach((i: any) => {
 usedUrls.add(i.url);
 guaranteedPicks.push({ ...i, slot: 'news-international' });
 });

 // 4. Fill remaining slots to reach 15
 const remainingSlots = TOTAL_ITEMS - slots.length - guaranteedPicks.length;
 const newsPicks = allItems
 .filter((i: any) => !usedUrls.has(i.url))
 .slice(0, Math.max(0, remainingSlots))
 .map((i: any) => ({ ...i, slot: 'news' }));

 return {
 items: [...slots, ...guaranteedPicks, ...newsPicks].slice(0, TOTAL_ITEMS),
 generatedAt: now.toISOString(),
 };
}

async function fetchSciencePin(source: any, count: number) {
 if (!source) return [];
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
