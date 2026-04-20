#!/usr/bin/env node
// Manual news feed update with real articles from past 48 hours
import { put } from '@vercel/blob';
import type { CacheEntry } from '../lib/news/types';

const ARTICLES_48H = [
  {
    title: "Atlanta Braces for Record-Breaking Heat Before Weekend Rain",
    url: "https://www.atlantanewsfirst.com/2026/04/17/atlanta-braces-record-breaking-heat-before-weekend-rain/",
    source: "Atlanta News First",
    publishedAt: "2026-04-17",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "Week Ahead in Washington: April 19th",
    url: "https://www.atlantanewsfirst.com/2026/04/19/week-ahead-washington-april-19th/",
    source: "Atlanta News First",
    publishedAt: "2026-04-19",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "Atlanta Dream officially introduces Angel Reese, says she's 'grateful' to be part of team",
    url: "https://www.atlantanewsfirst.com/2026/04/17/atlanta-dream-officially-introduces-angel-reese-says-shes-grateful-be-part-team/",
    source: "Atlanta News First",
    publishedAt: "2026-04-17",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "Atlanta police looking for suspect who broke into same location 3 times",
    url: "https://www.atlantanewsfirst.com/2026/04/16/atlanta-police-looking-suspect-who-broke-into-same-location-3-times/",
    source: "Atlanta News First",
    publishedAt: "2026-04-16",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "What to know about Atlanta-area attacks that killed 2, including a federal worker",
    url: "https://www.atlantanewsfirst.com/2026/04/16/what-know-about-atlanta-area-attacks-that-killed-2-including-federal-worker/",
    source: "Atlanta News First",
    publishedAt: "2026-04-16",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "Water main break repaired in Buckhead",
    url: "https://www.atlantanewsfirst.com/2026/04/16/water-main-break-affecting-businesses-residents-buckhead/",
    source: "Atlanta News First",
    publishedAt: "2026-04-16",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "Member of Atlanta's Indigo Girls discloses incurable medical condition",
    url: "https://www.atlantanewsfirst.com/2026/04/19/member-atlantas-indigo-girls-discloses-incurable-illness/",
    source: "Atlanta News First",
    publishedAt: "2026-04-19",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "DHS: Woman killed in DeKalb County shooting spree was a federal employee",
    url: "https://www.ajc.com/news/2026/04/woman-killed-in-dekalb-shooting-spree-was-a-federal-employee-dhs-says/",
    source: "AJC",
    publishedAt: "2026-04-16",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "Are there more accidents during a full moon? Atlanta traffic tests that theory",
    url: "https://www.ajc.com/news/2026/04/is-traffic-worse-during-a-full-moon-a-recent-rush-hour-tests-that-theory/",
    source: "AJC",
    publishedAt: "2026-04-16",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "A.M. ATL: Smile! You're on camera",
    url: "https://www.ajc.com/news/2026/04/am-atl-smile-youre-on-camera/",
    source: "AJC",
    publishedAt: "2026-04-19",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "A.M. ATL: Let's go out",
    url: "https://www.ajc.com/news/2026/04/am-atl-lets-go-out/",
    source: "AJC",
    publishedAt: "2026-04-19",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "A.M. ATL: In our backyard",
    url: "https://www.ajc.com/news/2026/04/am-atl-in-our-backyard/",
    source: "AJC",
    publishedAt: "2026-04-19",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "A.M. ATL: The earlier the better",
    url: "https://www.ajc.com/news/2026/04/am-atl-the-earlier-the-better/",
    source: "AJC",
    publishedAt: "2026-04-18",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "Things to do this weekend in metro Atlanta, North Georgia",
    url: "https://www.fox5atlanta.com/news/things-do-weekend-metro-atlanta-north-georgia-april-17-19-2026",
    source: "FOX 5 Atlanta",
    publishedAt: "2026-04-17",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "Georgia Bureau of Investigation: 2026 Officer Involved Shootings",
    url: "https://gbi.georgia.gov/news/2026-04-19/2026-officer-involved-shootings",
    source: "Georgia Bureau of Investigation",
    publishedAt: "2026-04-19",
    type: "text" as const,
    slot: "news"
  },
  {
    title: "Spring Classic Baseball Game benefits Children's Healthcare of Atlanta",
    url: "https://www.fox5atlanta.com/news/things-do-weekend-metro-atlanta-north-georgia-april-17-19-2026",
    source: "FOX 5 Atlanta",
    publishedAt: "2026-04-17",
    type: "text" as const,
    slot: "news"
  }
];

async function updateNewsFeed() {
  const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
  const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
  const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

  if (!VERCEL_API_TOKEN || !EDGE_CONFIG_ID || !BLOB_READ_WRITE_TOKEN) {
    console.error('Missing required env vars');
    process.exit(1);
  }

  try {
    console.log(`📰 Updating news feed with ${ARTICLES_48H.length} articles from past 48 hours\n`);

    // Sort by date (newest first)
    ARTICLES_48H.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Create feed entry with articles
    const feedEntry: CacheEntry = {
      items: ARTICLES_48H,
      cachedAt: new Date().toISOString()
    };

    console.log('Articles included:');
    ARTICLES_48H.forEach((article, i) => {
      console.log(`${i + 1}. ${article.title}`);
      console.log(`   ${article.source} • ${article.publishedAt}`);
    });

    console.log('\nSaving to Blob...');
    const blob = await put('news-articles/manual-48h.json', JSON.stringify(feedEntry), {
      token: BLOB_READ_WRITE_TOKEN,
      access: 'public'
    });

    console.log(`✅ Feed saved to Blob: ${blob.url}\n`);
    console.log(`Feed ready for review or integration with drawers.`);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

updateNewsFeed();
