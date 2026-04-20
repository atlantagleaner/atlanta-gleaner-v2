#!/usr/bin/env node
import { put } from '@vercel/blob';
import { fetchChannelEpisodesWithFallback, buildScienceGrabBagItem } from '../lib/youtubeFeed';
import { buildAudioDispatchItem } from '../lib/spotifyFeed';
import { ensureReaderDocument } from '../lib/newsReader';
import type { GleanerItem, CacheEntry } from '../lib/news/types';

const ARTICLES_48H = [
  { title: "Week Ahead in Washington: April 19th", url: "https://www.atlantanewsfirst.com/2026/04/19/week-ahead-washington-april-19th/", source: "Atlanta News First", publishedAt: "2026-04-19", type: "text" as const, slot: "news" },
  { title: "Member of Atlanta's Indigo Girls discloses incurable medical condition", url: "https://www.atlantanewsfirst.com/2026/04/19/member-atlantas-indigo-girls-discloses-incurable-illness/", source: "Atlanta News First", publishedAt: "2026-04-19", type: "text" as const, slot: "news" },
  { title: "A.M. ATL: Smile! You're on camera", url: "https://www.ajc.com/news/2026/04/am-atl-smile-youre-on-camera/", source: "AJC", publishedAt: "2026-04-19", type: "text" as const, slot: "news" },
  { title: "A.M. ATL: Let's go out", url: "https://www.ajc.com/news/2026/04/am-atl-lets-go-out/", source: "AJC", publishedAt: "2026-04-19", type: "text" as const, slot: "news" },
  { title: "A.M. ATL: In our backyard", url: "https://www.ajc.com/news/2026/04/am-atl-in-our-backyard/", source: "AJC", publishedAt: "2026-04-19", type: "text" as const, slot: "news" },
  { title: "Georgia Bureau of Investigation: 2026 Officer Involved Shootings", url: "https://gbi.georgia.gov/news/2026-04-19/2026-officer-involved-shootings", source: "Georgia Bureau of Investigation", publishedAt: "2026-04-19", type: "text" as const, slot: "news" },
  { title: "A.M. ATL: The earlier the better", url: "https://www.ajc.com/news/2026/04/am-atl-the-earlier-the-better/", source: "AJC", publishedAt: "2026-04-18", type: "text" as const, slot: "news" },
  { title: "Atlanta Braces for Record-Breaking Heat Before Weekend Rain", url: "https://www.atlantanewsfirst.com/2026/04/17/atlanta-braces-record-breaking-heat-before-weekend-rain/", source: "Atlanta News First", publishedAt: "2026-04-17", type: "text" as const, slot: "news" },
  { title: "Atlanta Dream officially introduces Angel Reese, says she's 'grateful' to be part of team", url: "https://www.atlantanewsfirst.com/2026/04/17/atlanta-dream-officially-introduces-angel-reese-says-shes-grateful-be-part-team/", source: "Atlanta News First", publishedAt: "2026-04-17", type: "text" as const, slot: "news" },
  { title: "Things to do this weekend in metro Atlanta, North Georgia", url: "https://www.fox5atlanta.com/news/things-do-weekend-metro-atlanta-north-georgia-april-17-19-2026", source: "FOX 5 Atlanta", publishedAt: "2026-04-17", type: "text" as const, slot: "news" },
  { title: "Spring Classic Baseball Game benefits Children's Healthcare of Atlanta", url: "https://www.fox5atlanta.com/news/things-do-weekend-metro-atlanta-north-georgia-april-17-19-2026", source: "FOX 5 Atlanta", publishedAt: "2026-04-17", type: "text" as const, slot: "news" },
  { title: "Atlanta police looking for suspect who broke into same location 3 times", url: "https://www.atlantanewsfirst.com/2026/04/16/atlanta-police-looking-suspect-who-broke-into-same-location-3-times/", source: "Atlanta News First", publishedAt: "2026-04-16", type: "text" as const, slot: "news" },
  { title: "What to know about Atlanta-area attacks that killed 2, including a federal worker", url: "https://www.atlantanewsfirst.com/2026/04/16/what-know-about-atlanta-area-attacks-that-killed-2-including-federal-worker/", source: "Atlanta News First", publishedAt: "2026-04-16", type: "text" as const, slot: "news" },
  { title: "Water main break repaired in Buckhead", url: "https://www.atlantanewsfirst.com/2026/04/16/water-main-break-affecting-businesses-residents-buckhead/", source: "Atlanta News First", publishedAt: "2026-04-16", type: "text" as const, slot: "news" },
  { title: "DHS: Woman killed in DeKalb County shooting spree was a federal employee", url: "https://www.ajc.com/news/2026/04/woman-killed-in-dekalb-shooting-spree-was-a-federal-employee-dhs-says/", source: "AJC", publishedAt: "2026-04-16", type: "text" as const, slot: "news" },
  { title: "Are there more accidents during a full moon? Atlanta traffic tests that theory", url: "https://www.ajc.com/news/2026/04/is-traffic-worse-during-a-full-moon-a-recent-rush-hour-tests-that-theory/", source: "AJC", publishedAt: "2026-04-16", type: "text" as const, slot: "news" },
];

async function buildAndCacheFeed() {
  const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
  const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
  const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;

  if (!BLOB_READ_WRITE_TOKEN || !VERCEL_API_TOKEN || !EDGE_CONFIG_ID) {
    console.error('Missing required env vars');
    process.exit(1);
  }

  try {
    console.log('Building complete 20-item feed (4 drawers + 16 news articles)\n');

    // Build drawers
    console.log('🎯 Building drawers...');
    const [starTalkEpisodes, pbsEpisodes, grabBagItem, audioDispatchItem] = await Promise.all([
      fetchChannelEpisodesWithFallback(
        'UCv8u5797wK4_YtZ89Y8088A',
        'https://www.youtube.com/@StarTalk/videos',
        'StarTalk',
        3
      ),
      fetchChannelEpisodesWithFallback(
        'UC7_gcs09iThXybpVgjHZ_7g',
        'https://www.youtube.com/@pbsspacetime/videos',
        'PBS Space Time',
        3
      ),
      buildScienceGrabBagItem(),
      buildAudioDispatchItem(),
    ]);

    const starTalk: GleanerItem = {
      title: 'StarTalk',
      url: 'https://www.youtube.com/@StarTalk/videos',
      source: 'YouTube',
      publishedAt: starTalkEpisodes[0]?.publishedAt || new Date().toISOString(),
      type: 'series',
      score: 1000,
      slot: 'science_pin',
      episodes: starTalkEpisodes,
    };

    const pbs: GleanerItem = {
      title: 'PBS Space Time',
      url: 'https://www.youtube.com/@pbsspacetime/videos',
      source: 'YouTube',
      publishedAt: pbsEpisodes[0]?.publishedAt || new Date().toISOString(),
      type: 'series',
      score: 1000,
      slot: 'science_pin',
      episodes: pbsEpisodes,
    };

    console.log(`✅ StarTalk: ${starTalkEpisodes.length} episodes`);
    console.log(`✅ PBS Space Time: ${pbsEpisodes.length} episodes`);
    console.log(`✅ Grab Bag: ${grabBagItem.episodes?.length || 0} episodes`);
    console.log(`✅ Audio Dispatch: ${audioDispatchItem.episodes?.length || 0} episodes\n`);

    // Pre-warm reader cache for news articles
    console.log('📚 Pre-warming reader cache for 16 news articles...\n');
    let success = 0;
    let failed = 0;

    for (const article of ARTICLES_48H) {
      const shortTitle = article.title.substring(0, 50);
      process.stdout.write(`  ${shortTitle}... `);

      try {
        await ensureReaderDocument(article.url, {
          title: article.title,
          source: article.source,
        });
        console.log('✅');
        success++;
      } catch (error: any) {
        console.log(`❌`);
        failed++;
      }

      // Polite delay
      await new Promise(r => setTimeout(r, 800));
    }

    console.log(`\n✨ Reader cache: ${success} cached, ${failed} failed\n`);

    // Build final feed
    const completeItems: any[] = [starTalk, pbs, grabBagItem, audioDispatchItem, ...ARTICLES_48H];

    const feedEntry: CacheEntry = {
      items: completeItems,
      cachedAt: new Date().toISOString()
    };

    console.log(`Building final feed with ${completeItems.length} items`);
    console.log(`  - 4 featured drawers`);
    console.log(`  - 16 news articles\n`);

    // Save to Blob
    console.log('Saving feed to Blob...');
    const blob = await put('news-feed/live.json', JSON.stringify(feedEntry), {
      token: BLOB_READ_WRITE_TOKEN,
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json; charset=utf-8',
    });

    console.log(`✅ Feed saved: ${blob.url}\n`);

    // Update Edge Config
    console.log('Updating Edge Config...');
    const res = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: 'news_cache_live',
            value: { blobUrl: blob.url, cachedAt: feedEntry.cachedAt },
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Edge Config update failed: ${await res.text()}`);
    }

    console.log('✅ Edge Config updated\n');
    console.log('🚀 Feed is ready for deployment!');
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

buildAndCacheFeed();
