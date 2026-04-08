// Quick script to fetch Spotify podcast IDs
// Run with: npx tsx scripts/get-spotify-ids.mjs

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  if (line.startsWith('#') || !line.includes('=')) continue;
  const [key, value] = line.split('=');
  process.env[key] = value.replace(/^"|"$/g, '');
}

const PODCAST_NAMES = [
  // Bill Simmons Universe
  'The Bill Simmons Podcast',
  'The Rewatchables',
  'The Big Picture',
  'The Watch',
  'Higher Learning',

  // History
  'The Rest is History',
  'Stuff You Missed in History Class',
  'Our Fake History',
  'Behind the Bastards',
  'Revolutions',
  'Stuff You Didn\'t Know About',
  'Cabinet of Curiosities',
  'The Bugle',

  // Science
  'StarTalk Radio',
  'Ologies',
  'Radiolab',
  'Short Wave',
  'The Infinite Monkey Cage',
  'Sawbones',
  'Science Vs',
  'Stuff You Should Know',

  // Culture & Analysis
  '99% Invisible',
  'The New Yorker Radio Hour',
  'On Being',
  'TED Radio Hour',
  'Switched On Pop',
  'Articles of Interest',
  'The Ezra Klein Show',

  // International & Depth
  'Kerning Cultures',
  'Unexplained',
];

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env.local');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

async function searchSpotifyShow(query, token) {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=show&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  return data.shows?.items[0] || null;
}

async function main() {
  try {
    console.log('🔐 Authenticating with Spotify...');
    const token = await getSpotifyAccessToken();

    console.log('🔍 Searching for 30 podcasts...\n');

    const ids = {};
    for (const name of PODCAST_NAMES) {
      const show = await searchSpotifyShow(name, token);
      if (show) {
        ids[name] = show.id;
        console.log(`✓ ${name}`);
      } else {
        console.log(`✗ ${name} (not found)`);
      }
      // Respectful rate limiting
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log('\n✅ Spotify Show IDs:\n');
    console.log(JSON.stringify(ids, null, 2));

    console.log('\n📋 Copy the JSON above into SPOTIFY_SHOW_IDS in newsConfig.ts');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
