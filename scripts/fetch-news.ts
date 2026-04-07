import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCacheEntry, scoreItem, inferSlot } from '../lib/news/utils';
import { EDITORIAL_QUERIES, FEED_TARGETS } from '../lib/newsConfig';

// ── Environment ─────────────────────────────────────────────────────────────

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

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

// ── YouTube Integration ─────────────────────────────────────────────────────

const CHANNEL_IDS = {
  starTalk: 'UCv8u5797wK4_YtZ89Y8088A',
  pbsSpaceTime: 'UC7_gcs09iThXybpVgjHZ_7g',
};

async function fetchYouTubeChannelVideos(channelId: string, maxResults = 5) {
  if (!YOUTUBE_API_KEY) {
    console.warn(`⚠️ No YOUTUBE_API_KEY. Channel ${channelId} will be empty.`);
    return [];
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`
    );
    if (!res.ok) throw new Error(`YouTube API ${res.status}`);
    const data = (await res.json()) as any;

    return (data.items || []).map((item: any) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: 'YouTube',
      publishedAt: item.snippet.publishedAt,
      type: 'video' as const,
      videoId: item.id.videoId,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
    }));
  } catch (e: any) {
    console.error(`❌ YouTube fetch failed for ${channelId}:`, e.message);
    return [];
  }
}

async function buildFeaturedSeries(title: string, channelId: string, slot: string) {
  const episodes = await fetchYouTubeChannelVideos(channelId, 3);
  return {
    title,
    url: `https://www.youtube.com/channel/${channelId}`,
    source: `Official ${title} uploads`,
    publishedAt: episodes[0]?.publishedAt || '',
    type: 'series' as const,
    score: 1000,
    slot,
    episodes,
  };
}

// ── Grab Bag Drawer ──────────────────────────────────────────────────────────

const GRAB_BAG_CHANNELS = [
  { id: 'kurzgesagt', url: 'https://www.youtube.com/@kurzgesagt/videos', cid: 'UCsXVk37bltUXD1fauIDKJgQ' },
  { id: 'novapbs', url: 'https://www.youtube.com/@novapbs/videos', cid: 'UC9uD-W5zkVUUnp6VByI_zSg' },
  { id: 'PBSDocumentaries', url: 'https://www.youtube.com/@PBSDocumentaries/videos', cid: 'UC4E98t898F908z98S9S9S9S' }, // Placeholder CID
  { id: 'Veritasium', url: 'https://www.youtube.com/@veritasium/videos', cid: 'UCHnyfMqiRRG1u-2MsSQLbXA' },
  { id: 'SmarterEveryDay', url: 'https://www.youtube.com/@smartereveryday/videos', cid: 'UC6107grRI4K0o2-umHBVMwA' },
  { id: 'RealEngineering', url: 'https://www.youtube.com/@RealEngineering/videos', cid: 'UCR1IuLEqb6UEAofA8UZ161A' },
];

async function buildScienceGrabBag() {
  console.log('📦 Building Science Grab Bag...');
  const shuffled = [...GRAB_BAG_CHANNELS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);
  
  const episodesResults = await Promise.all(
    selected.map(ch => fetchYouTubeChannelVideos(ch.cid, 2))
  );
  
  const episodes = episodesResults.flat().slice(0, 9);
  
  return {
    title: 'Grab Bag',
    url: 'https://www.youtube.com/',
    source: 'Curated Grab Bag',
    publishedAt: new Date().toISOString(),
    type: 'series' as const,
    score: 1000,
    slot: 'grab_bag',
    episodes,
  };
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
    buildFeaturedSeries('StarTalk', CHANNEL_IDS.starTalk, 'science_pin'),
    buildFeaturedSeries('PBS Space Time', CHANNEL_IDS.pbsSpaceTime, 'science_pin'),
    buildScienceGrabBag(),
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
