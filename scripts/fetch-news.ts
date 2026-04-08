import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCacheEntry, scoreItem, inferSlot } from '../lib/news/utils';
import { EDITORIAL_QUERIES, FEED_TARGETS } from '../lib/newsConfig';
import {
  buildFeaturedSeriesItem,
  buildScienceGrabBagItem,
  FEATURED_YOUTUBE_CHANNELS,
} from '../lib/youtubeFeed';

// ── Environment ─────────────────────────────────────────────────────────────

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!SERPER_API_KEY) {
  console.error('❌ Error: SERPER_API_KEY is not set.');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── Vercel Production Sync ──────────────────────────────────────────────────

async function syncToProduction(finalItems: any[]) {
  if (!VERCEL_API_TOKEN || !EDGE_CONFIG_ID || !BLOB_READ_WRITE_TOKEN) {
    console.error('❌ Missing Vercel credentials. Skipping sync.');
    return;
  }

  console.log('\n🚀 Syncing to Production...');
  try {
    const cachedAt = new Date().toISOString();
    const payload = createCacheEntry(finalItems, cachedAt);

    const blobRes = await fetch('https://blob.vercel-storage.com/news-feed/live.json', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${BLOB_READ_WRITE_TOKEN}`,
        'x-add-random-suffix': '0'
      },
      body: JSON.stringify(payload)
    });

    if (!blobRes.ok) throw new Error(`Blob upload failed: ${await blobRes.text()}`);
    const blobData = (await blobRes.json()) as any;
    console.log(`✅ Blob uploaded: ${blobData.url}`);

    const edgeRes = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          operation: 'upsert',
          key: 'news_cache',
          value: { blobUrl: blobData.url, cachedAt }
        }]
      })
    });

    if (!edgeRes.ok) throw new Error(`Edge Config update failed: ${await edgeRes.text()}`);
    console.log('✅ Edge Config updated successfully.');
  } catch (err: any) {
    console.error('💥 Sync failed:', err.message);
  }
}

// ── Podcast Drawer ───────────────────────────────────────────────────────────

const SPOTIFY_SHOWS = [
  { id: '2YvYmS07vLD1o2MvAsv3P3', name: 'The Bill Simmons Podcast' },
  { id: '1lUPomulZRPquVAOOd56EW', name: 'The Rewatchables' },
  { id: '3IM0SVD9ndXmB5KyEpxRYm', name: 'The Daily' },
];

async function buildPodcastDrawer() {
  console.log('🎙️ Building Podcast Drawer...');
  const episodes = SPOTIFY_SHOWS.map(show => ({
    title: `Latest from ${show.name}`,
    url: `https://open.spotify.com/show/${show.id}`,
    source: show.name,
    publishedAt: 'Recent',
    type: 'audio' as const,
    spotifyId: show.id,
    thumbnailUrl: '',
  }));

  return {
    title: 'Podcasts',
    url: 'https://open.spotify.com/',
    source: 'Curated Audio',
    publishedAt: new Date().toISOString(),
    type: 'series' as const,
    score: 1000,
    slot: 'podcast_pin',
    episodes,
  };
}

// ── Serper Integration ───────────────────────────────────────────────────────

async function serperSearch(query: any, lane: string) {
  console.log(`🔍 Searching ${lane}: "${query.q}"...`);
  try {
    const res = await fetch(`https://google.serper.dev/${query.endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query.q, num: query.num }),
    });
    if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);
    const data = (await res.json()) as any;
    const rows = data[query.endpoint] || data.organic || [];

    return rows.map((row: any) => ({
      title: row.title,
      url: row.link,
      source: row.source || row.channel || 'Web',
      publishedAt: row.date || '',
      type: row.link?.includes('youtube.com') ? ('video' as const) : ('text' as const),
      slot: 'news',
      score: query.boost,
      lane,
    })).filter((item: any) => item.title && item.url);
  } catch (error: any) {
    console.error(`❌ Error searching "${query.q}":`, error.message);
    return [];
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting news fetch...');

  const allQueries: any[] = [];
  Object.entries(EDITORIAL_QUERIES).forEach(([lane, queries]) => {
    (queries as any[]).forEach(q => allQueries.push({ lane, q }));
  });

  const [starTalk, pbs, grabBag, podcasts, ...searchResults] = await Promise.all([
    buildFeaturedSeriesItem(
      FEATURED_YOUTUBE_CHANNELS.starTalk.title,
      FEATURED_YOUTUBE_CHANNELS.starTalk.url,
      FEATURED_YOUTUBE_CHANNELS.starTalk.channelId,
      'science_pin',
    ),
    buildFeaturedSeriesItem(
      FEATURED_YOUTUBE_CHANNELS.pbsSpaceTime.title,
      FEATURED_YOUTUBE_CHANNELS.pbsSpaceTime.url,
      FEATURED_YOUTUBE_CHANNELS.pbsSpaceTime.channelId,
      'science_pin',
    ),
    buildScienceGrabBagItem(),
    buildPodcastDrawer(),
    ...allQueries.map(({ lane, q }) => serperSearch(q, lane))
  ]);

  const processed = searchResults.flat().map(item => ({
    ...item,
    score: scoreItem(item),
    slot: inferSlot(item)
  })).sort((a, b) => b.score - a.score);

  const seen = new Set([starTalk.url, pbs.url, grabBag.url, podcasts.url]);
  const finalItems = [starTalk, pbs, grabBag, podcasts];
  
  // Track source counts for articles only
  const sourceCounts: Record<string, number> = {};

  for (const item of processed) {
    if (finalItems.length >= FEED_TARGETS.total) break;
    if (seen.has(item.url)) continue;

    // Rule: Max 2 articles per source
    const source = item.source || 'Web';
    const currentCount = sourceCounts[source] || 0;
    if (currentCount >= 2) continue;

    seen.add(item.url);
    sourceCounts[source] = currentCount + 1;
    finalItems.push(item);
  }

  const output = {
    items: finalItems,
    cachedAt: new Date().toISOString(),
    count: finalItems.length,
    local: true
  };

  const outputPath = path.join(ROOT, 'public', 'news-local.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Saved ${finalItems.length} items to ${outputPath}`);

  if (process.argv.includes('--sync')) {
    await syncToProduction(finalItems);
  }
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
