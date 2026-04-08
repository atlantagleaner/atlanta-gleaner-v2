// Debug endpoint to test Spotify integration
import { buildAudioDispatchItem, getLatestEpisodes, getShowEpisodes } from '@/lib/spotifyFeed';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const debug: Record<string, any> = {
    envVars: {
      clientIdSet: !!process.env.SPOTIFY_CLIENT_ID,
      clientSecretSet: !!process.env.SPOTIFY_CLIENT_SECRET,
    },
  };

  try {
    // Test 0: Try a raw getShowEpisodes call
    console.log('[test/spotify] Test 0: Raw getShowEpisodes call...');
    try {
      const episodes = await getShowEpisodes('1mNsuXfG95Lf76YQeVMuo1', 1);
      debug.rawShowEpisodesTest = {
        success: true,
        episodesReturned: episodes.length,
      };
    } catch (e: any) {
      debug.rawShowEpisodesTest = {
        success: false,
        error: e.message,
      };
    }

    // Test 1: Single show via getLatestEpisodes
    console.log('[test/spotify] Test 1: Single show...');
    const singleShowEpisodes = await getLatestEpisodes(['1mNsuXfG95Lf76YQeVMuo1']);
    debug.singleShowTest = {
      showId: '1mNsuXfG95Lf76YQeVMuo1',
      episodesReturned: singleShowEpisodes.length,
      success: singleShowEpisodes.length > 0,
    };

    // Test 2: Config load
    console.log('[test/spotify] Test 2: Load config...');
    let SPOTIFY_SHOW_IDS_ARRAY: string[] = [];
    try {
      const config = await import('@/lib/newsConfig');
      SPOTIFY_SHOW_IDS_ARRAY = config.SPOTIFY_SHOW_IDS_ARRAY;
      debug.configTest = {
        success: true,
        showIdCount: SPOTIFY_SHOW_IDS_ARRAY?.length || 0,
      };
    } catch (importErr: any) {
      debug.configTest = {
        success: false,
        error: importErr.message,
      };
      throw importErr;
    }

    // Test 3: All 30 shows
    console.log('[test/spotify] Test 3: All 30 shows...');
    const start30 = Date.now();
    const all30Episodes = await getLatestEpisodes(SPOTIFY_SHOW_IDS_ARRAY);
    const end30 = Date.now();
    debug.all30ShowsTest = {
      showsRequested: SPOTIFY_SHOW_IDS_ARRAY.length,
      episodesReturned: all30Episodes.length,
      durationMs: end30 - start30,
      success: all30Episodes.length > 0,
    };

    // Test 4: Full build
    console.log('[test/spotify] Test 4: Full buildAudioDispatchItem...');
    const startFull = Date.now();
    const result = await buildAudioDispatchItem();
    const endFull = Date.now();
    debug.fullBuildTest = {
      durationMs: endFull - startFull,
      episodesReturned: result.episodes?.length || 0,
      success: (result.episodes?.length || 0) > 0,
    };

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
