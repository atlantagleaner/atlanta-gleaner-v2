import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Helper to load simple env from .env if it exists
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
}

loadEnv();

const SERPER_API_KEY = process.env.SERPER_API_KEY;

if (!SERPER_API_KEY) {
  console.error('❌ Error: SERPER_API_KEY is not set in environment or .env file.');
  process.exit(1);
}

// We'll import the config. Since it's TS, we'll mock the parts we need or read it as a module if possible.
// For a standalone script, it's often easiest to just define the logic here or use a tool to run TS.
// But to keep it simple and dependency-free for the user, I will replicate the core scoring/logic.

// Replicate the parts of newsConfig we need since we can't easily import TS in a raw ESM script
// without extra dependencies like tsx.
const configPath = path.join(ROOT, 'lib', 'newsConfig.ts');
const configContent = fs.readFileSync(configPath, 'utf-8');

// Simplified extraction using regex
function extractObject(content, variableName) {
  const regex = new RegExp(`export const ${variableName} = ({[\\s\\S]*?}) as const;`, 'm');
  const match = content.match(regex);
  if (!match) return {};
  // Extremely hacky: eval the object string. Since it's our own config file, it's relatively safe for a local script.
  // We remove 'as EditorialQuery[]' and other TS-isms.
  const cleanObj = match[1]
    .replace(/as EditorialQuery\[\]/g, '')
    .replace(/as const/g, '')
    .replace(/readonly/g, '');
  try {
    return eval(`(${cleanObj})`);
  } catch (e) {
    console.error(`Failed to parse ${variableName}:`, e);
    return {};
  }
}

const EDITORIAL_QUERIES = extractObject(configContent, 'EDITORIAL_QUERIES');
const SOURCE_WEIGHTS = extractObject(configContent, 'SOURCE_WEIGHTS');
const SCORING = extractObject(configContent, 'SCORING');
const FEED_TARGETS = { featured: 3, total: 15 };

const FEATURED_CHANNELS = {
  starTalk: {
    title: 'StarTalk',
    url: 'https://www.youtube.com/@StarTalk/videos',
  },
  pbsSpaceTime: {
    title: 'PBS Space Time',
    url: 'https://www.youtube.com/@pbsspacetime/videos',
  },
};

const MIN_FEATURED_VIDEO_SECONDS = 4 * 60;

// Replicate utility functions from the API route
function extractJsonObject(text, marker) {
  const start = text.indexOf(marker);
  if (start === -1) return null;
  const braceStart = text.indexOf('{', start);
  if (braceStart === -1) return null;
  let depth = 0; let inString = false; let escaped = false;
  for (let i = braceStart; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; continue; }
    if (char === '{') { depth += 1; continue; }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(braceStart, i + 1);
    }
  }
  return null;
}

function collectRenderers(value, output = []) {
  if (!value || typeof value !== 'object') return output;
  if (Array.isArray(value)) {
    for (const entry of value) collectRenderers(entry, output);
    return output;
  }
  if (value.gridVideoRenderer) output.push(value.gridVideoRenderer);
  if (value.videoRenderer) output.push(value.videoRenderer);
  for (const child of Object.values(value)) collectRenderers(child, output);
  return output;
}

function parseDurationSeconds(value) {
  if (!value) return null;
  const parts = value.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function rendererToEpisode(renderer) {
  const videoId = renderer.videoId || renderer.navigationEndpoint?.watchEndpoint?.videoId || null;
  const title = renderer.title?.simpleText || renderer.title?.runs?.map(r => r.text).join('') || '';
  const publishedAt = renderer.publishedTimeText?.simpleText || '';
  const durationText = renderer.thumbnailOverlays?.find(o => o.thumbnailOverlayTimeStatusRenderer?.text?.simpleText)?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText;
  const durationSeconds = parseDurationSeconds(durationText);
  if (!videoId || !title) return null;
  if (durationSeconds !== null && durationSeconds < MIN_FEATURED_VIDEO_SECONDS) return null;
  return {
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    source: 'YouTube',
    publishedAt,
    type: 'video',
    videoId,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

async function fetchLatestYouTubeEpisodes(channelTitle, channelUrl) {
  console.log(`📺 Fetching YouTube episodes for ${channelTitle}...`);
  const response = await fetch(channelUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AtlantaGleaner/1.0)' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const jsonText = extractJsonObject(html, 'ytInitialData');
  if (!jsonText) throw new Error(`Could not find ytInitialData`);
  const data = JSON.parse(jsonText);
  const renderers = collectRenderers(data)
    .map(rendererToEpisode)
    .filter(Boolean);
  
  const seen = new Set();
  const episodes = [];
  for (const ep of renderers) {
    if (seen.has(ep.videoId)) continue;
    seen.add(ep.videoId);
    episodes.push(ep);
    if (episodes.length === 3) break;
  }
  return episodes;
}

async function buildFeaturedSeries(title, channelUrl, slot) {
  const episodes = await fetchLatestYouTubeEpisodes(title, channelUrl);
  return {
    title,
    url: channelUrl,
    source: `Official ${title} uploads`,
    publishedAt: episodes[0]?.publishedAt || '',
    type: 'series',
    score: 1000,
    slot,
    episodes,
  };
}

const GRAB_BAG_CHANNELS = [
  { id: 'kurzgesagt', url: 'https://www.youtube.com/@kurzgesagt/videos' },
  { id: 'novapbs', url: 'https://www.youtube.com/@novapbs/videos' },
  { id: 'PBSDocumentaries', url: 'https://www.youtube.com/@PBSDocumentaries/videos' },
  { id: 'TheLIUniverse', url: 'https://www.youtube.com/@TheLIUniverse/videos' },
  { id: 'whatifscienceshow', url: 'https://www.youtube.com/@whatifscienceshow/videos' },
  { id: 'StarTalk', url: 'https://www.youtube.com/@StarTalk/videos' },
  { id: 'PBS', url: 'https://www.youtube.com/@PBS/videos' },
  { id: 'americanmasters', url: 'https://www.youtube.com/@americanmasters/videos' },
  { id: 'AmericanExperiencePBS', url: 'https://www.youtube.com/@AmericanExperiencePBS/videos' },
  { id: 'Veritasium', url: 'https://www.youtube.com/@veritasium/videos' },
  { id: 'SmarterEveryDay', url: 'https://www.youtube.com/@smartereveryday/videos' },
  { id: 'RealEngineering', url: 'https://www.youtube.com/@RealEngineering/videos' },
  { id: 'history', url: 'https://www.youtube.com/@history/videos' },
  { id: 'TimelineChannel', url: 'https://www.youtube.com/@TimelineChannel/videos' },
  { id: 'TEDEd', url: 'https://www.youtube.com/@TEDEd/videos' },
];

async function fetchNasaLiveStream() {
  try {
    const response = await fetch('https://www.youtube.com/@NASA/streams', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AtlantaGleaner/1.0)' },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const jsonText = extractJsonObject(html, 'ytInitialData');
    if (!jsonText) return null;
    const data = JSON.parse(jsonText);
    const renderers = collectRenderers(data);
    for (const renderer of renderers) {
      const isLive = renderer.thumbnailOverlays?.some(overlay => 
        overlay.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE' || 
        overlay.thumbnailOverlayTimeStatusRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW'
      );
      if (isLive) {
        const videoId = renderer.videoId || renderer.navigationEndpoint?.watchEndpoint?.videoId;
        const title = renderer.title?.simpleText || renderer.title?.runs?.map(r => r.text).join('') || 'NASA Live Stream';
        if (videoId) {
          return {
            title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            source: 'NASA',
            publishedAt: 'Live Now',
            type: 'video',
            videoId,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          };
        }
      }
    }
  } catch (e) { console.error('[fetchNasaLiveStream] Error:', e); }
  return null;
}

async function buildScienceGrabBag() {
  const shuffledChannels = [...GRAB_BAG_CHANNELS].sort(() => Math.random() - 0.5);
  const selectedChannels = shuffledChannels.slice(0, 9);
  const channelResults = await Promise.all(
    selectedChannels.map(async (ch) => {
      try {
        const eps = await fetchLatestYouTubeEpisodes(ch.id, ch.url);
        return eps.length > 0 ? eps[Math.floor(Math.random() * eps.length)] : null;
      } catch(e) { return null; }
    })
  );
  const episodes = channelResults.filter(Boolean).slice(0, 9);
  const nasaLive = await fetchNasaLiveStream() || {
    title: 'NASA Live Stream',
    url: 'https://www.youtube.com/@NASA/live',
    source: 'NASA',
    publishedAt: 'Live Now',
    type: 'video',
    videoId: '21X5lGlDOfg',
    thumbnailUrl: '',
  };
  if (episodes.length >= 3) { episodes.splice(3, 0, nasaLive); } else { episodes.push(nasaLive); }
  return {
    title: 'Science Grab Bag',
    url: 'https://www.youtube.com/',
    source: 'Curated Grab Bag',
    publishedAt: new Date().toISOString(),
    type: 'series',
    score: 1000,
    slot: 'science_grab_bag',
    episodes,
  };
}

async function serperSearch(query, lane) {
  console.log(`🔍 Searching ${lane}: "${query.q}"...`);
  try {
    const res = await fetch(`https://google.serper.dev/${query.endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query.q, num: query.num }),
    });
    if (!res.ok) throw new Error(`Serper HTTP ${res.status}`);
    const data = await res.json();
    const rows = data[query.endpoint] || data.organic || [];

    return rows.map(row => ({
      title: row.title,
      url: row.link,
      source: row.source || row.channel || 'Web',
      publishedAt: row.date || '',
      type: row.link?.includes('youtube.com') ? 'video' : 'text',
      slot: 'news', // Will be inferred later
      score: query.boost,
      lane,
    })).filter(item => item.title && item.url);
  } catch (error) {
    console.error(`❌ Error searching "${query.q}":`, error.message);
    return [];
  }
}

// Scoring logic (Simplified copy from route.ts)
function getHostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

function scoreItem(item) {
  const text = (item.title + ' ' + item.source).toLowerCase();
  const host = getHostname(item.url);
  let score = item.score || 0;
  if (host in SOURCE_WEIGHTS) score += SOURCE_WEIGHTS[host];
  
  const hits = (list, pts) => list.reduce((s, kw) => text.includes(kw) ? s + pts : s, 0);
  score += hits(SCORING.localGeorgia, 3);
  score += hits(SCORING.cnn, 18);
  score += hits(SCORING.legalGeorgia, 8);
  score += hits(SCORING.absurd, 10);
  score += hits(SCORING.macabre, 12);
  
  return score;
}

function inferSlot(item) {
  const text = (item.title + ' ' + item.source).toLowerCase();
  if (SCORING.absurd.some(kw => text.includes(kw)) || SCORING.macabre.some(kw => text.includes(kw))) return 'letterman';
  if (SCORING.international.some(kw => text.includes(kw))) return 'news-international';
  if (SCORING.documentary.some(kw => text.includes(kw))) return 'science_nova';
  return 'news';
}

async function main() {
  console.log('🚀 Starting local news fetch (All-at-once mode)...');
  
  const allQueries = [];
  Object.entries(EDITORIAL_QUERIES).forEach(([lane, queries]) => {
    queries.forEach(q => allQueries.push({ lane, q }));
  });

  console.log(`📡 Launching ${allQueries.length + 3} concurrent requests (YouTube + Serper)...`);

  const [starTalk, pbs, grabBag, ...searchResults] = await Promise.all([
    buildFeaturedSeries(FEATURED_CHANNELS.starTalk.title, FEATURED_CHANNELS.starTalk.url, 'science_pin'),
    buildFeaturedSeries(FEATURED_CHANNELS.pbsSpaceTime.title, FEATURED_CHANNELS.pbsSpaceTime.url, 'science_pin'),
    buildScienceGrabBag(),
    ...allQueries.map(({ lane, q }) => serperSearch(q, lane))
  ]);

  const editorialPool = searchResults.flat();

  // 3. Score and Sort
  const processed = editorialPool.map(item => ({
    ...item,
    score: scoreItem(item),
    slot: inferSlot(item)
  })).sort((a, b) => b.score - a.score);

  // 4. Select top unique items
  const seen = new Set([starTalk.url, pbs.url, grabBag.url]);
  const finalItems = [starTalk, pbs, grabBag];
  
  for (const item of processed) {
    if (finalItems.length >= 15) break;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
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
  
  console.log(`\n✅ Success! Saved ${finalItems.length} items to ${outputPath}`);
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
