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

    // Second test: try loading config
    console.log('[test/spotify] Trying to import config...');
    let SPOTIFY_SHOW_IDS_ARRAY: string[] = [];
    try {
      const config = await import('@/lib/newsConfig');
      SPOTIFY_SHOW_IDS_ARRAY = config.SPOTIFY_SHOW_IDS_ARRAY;
      debug.configTest = {
        success: true,
        showIdCount: SPOTIFY_SHOW_IDS_ARRAY?.length || 0,
      };
      console.log('[test/spotify] Config loaded, array length:', SPOTIFY_SHOW_IDS_ARRAY.length);
    } catch (importErr: any) {
      debug.configTest = {
        success: false,
        error: importErr.message,
      };
      throw importErr;
    }

    // Test 2b: try fetching all 30 shows
    console.log('[test/spotify] Testing with all 30 shows...');
    const start30 = Date.now();
    const all30Episodes = await getLatestEpisodes(SPOTIFY_SHOW_IDS_ARRAY);
    const end30 = Date.now();
    debug.all30ShowsTest = {
      showsRequested: SPOTIFY_SHOW_IDS_ARRAY.length,
      episodesReturned: all30Episodes.length,
      durationMs: end30 - start30,
      success: all30Episodes.length > 0,
    };
    console.log('[test/spotify] All 30 shows test result:', debug.all30ShowsTest);

    // Third test: full build
    console.log('[test/spotify] Calling buildAudioDispatchItem with 30 shows...');
    const startTime = Date.now();
    const result = await buildAudioDispatchItem();
    const endTime = Date.now();
    debug.fullBuildTest = {
      durationMs: endTime - startTime,
      episodesReturned: result.episodes?.length || 0,
      success: (result.episodes?.length || 0) > 0,
    };
    console.log('[test/spotify] Full build took', endTime - startTime, 'ms, got', result.episodes?.length, 'episodes');

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
