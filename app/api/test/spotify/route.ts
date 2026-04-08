// Debug endpoint to test Spotify integration
import { buildAudioDispatchItem, getLatestEpisodes } from '@/lib/spotifyFeed';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  console.log('[test/spotify] Starting debug...');
  console.log('[test/spotify] SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? `✓ set (${process.env.SPOTIFY_CLIENT_ID.substring(0, 8)}...)` : '✗ missing');
  console.log('[test/spotify] SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? `✓ set (${process.env.SPOTIFY_CLIENT_SECRET.substring(0, 8)}...)` : '✗ missing');

  const debug: Record<string, any> = {
    envVars: {
      clientIdSet: !!process.env.SPOTIFY_CLIENT_ID,
      clientSecretSet: !!process.env.SPOTIFY_CLIENT_SECRET,
    },
  };

  try {
    // First test: try fetching a single show's episodes
    console.log('[test/spotify] Testing with sample show ID...');
    const testShowId = '1mNsuXfG95Lf76YQeVMuo1'; // StarTalk Radio
    const singleShowEpisodes = await getLatestEpisodes([testShowId]);
    debug.singleShowTest = {
      showId: testShowId,
      episodesReturned: singleShowEpisodes.length,
      success: singleShowEpisodes.length > 0,
    };
    console.log('[test/spotify] Single show test result:', debug.singleShowTest);

    // Second test: try with first 5 shows
    console.log('[test/spotify] Testing with 5 shows...');
    const { SPOTIFY_SHOW_IDS_ARRAY } = await import('@/lib/newsConfig');
    const first5Shows = SPOTIFY_SHOW_IDS_ARRAY.slice(0, 5);
    const firstFiveEpisodes = await Promise.allSettled(
      first5Shows.map(id => getLatestEpisodes([id]))
    );
    const successCount = firstFiveEpisodes.filter(r => r.status === 'fulfilled').length;
    const failureCount = firstFiveEpisodes.filter(r => r.status === 'rejected').length;
    debug.first5ShowsTest = {
      showsRequested: first5Shows.length,
      successCount,
      failureCount,
      totalEpisodes: firstFiveEpisodes
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + (r.status === 'fulfilled' ? r.value.length : 0), 0),
    };
    console.log('[test/spotify] First 5 shows test result:', debug.first5ShowsTest);

    // Third test: full build
    console.log('[test/spotify] Calling buildAudioDispatchItem...');
    const result = await buildAudioDispatchItem();
    return Response.json({
      ok: true,
      debug,
      result,
      episodeCount: result.episodes?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[test/spotify] Error caught:', error);
    debug.error = {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    };
    return Response.json({
      ok: false,
      debug,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
