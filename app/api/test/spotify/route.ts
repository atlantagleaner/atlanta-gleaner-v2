// Debug endpoint to test Spotify integration
import { buildAudioDispatchItem } from '@/lib/spotifyFeed';

export const runtime = 'nodejs';

export async function GET() {
  console.log('[test/spotify] Starting debug...');
  console.log('[test/spotify] SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? '✓ set' : '✗ missing');
  console.log('[test/spotify] SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? '✓ set' : '✗ missing');

  try {
    const result = await buildAudioDispatchItem();
    return Response.json({
      ok: true,
      result,
      episodeCount: result.episodes?.length || 0,
    });
  } catch (error: any) {
    console.error('[test/spotify] Error caught:', error);
    return Response.json({
      ok: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
