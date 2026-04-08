// ─────────────────────────────────────────────────────────────────────────────
// Spotify Feed Integration (using spotify-web-api-node library)
// ─────────────────────────────────────────────────────────────────────────────

import SpotifyWebApi from 'spotify-web-api-node'
import type { GleanerItem } from '@/lib/news/types'

// Get Spotify access token via Client Credentials flow
async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.statusText}`)
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

// Initialize Spotify client with access token
async function getSpotifyClient() {
  const client = new SpotifyWebApi()
  const token = await getSpotifyAccessToken()
  client.setAccessToken(token)
  return client
}

// Build audio dispatch drawer with latest podcast episodes
export async function buildAudioDispatchItem(): Promise<GleanerItem> {
  try {
    console.log('[buildAudioDispatchItem] Starting Spotify fetch...')

    const { SPOTIFY_SHOW_IDS_ARRAY } = await import('@/lib/newsConfig')
    console.log(`[buildAudioDispatchItem] Loaded ${SPOTIFY_SHOW_IDS_ARRAY.length} show IDs`)

    // Get authenticated client
    console.log('[buildAudioDispatchItem] Authenticating with Spotify...')
    const client = await getSpotifyClient()
    console.log('[buildAudioDispatchItem] Authentication successful')

    // Fetch episodes from all shows in parallel
    console.log('[buildAudioDispatchItem] Fetching episodes from all shows...')
    console.log('[buildAudioDispatchItem] Show IDs:', SPOTIFY_SHOW_IDS_ARRAY.slice(0, 3))

    const episodeTasks = SPOTIFY_SHOW_IDS_ARRAY.map((showId) => {
      console.log(`[buildAudioDispatchItem] Creating task for show: ${showId}`)
      return client.getShowEpisodes(showId, { limit: 1 })
    })

    console.log(`[buildAudioDispatchItem] Created ${episodeTasks.length} tasks, executing...`)
    const episodeResults = await Promise.allSettled(episodeTasks)

    // Count successes and failures
    const successCount = episodeResults.filter(r => r.status === 'fulfilled').length
    const failureCount = episodeResults.filter(r => r.status === 'rejected').length

    if (failureCount > 0) {
      console.error(`[buildAudioDispatchItem] WARNING: ${failureCount}/${SPOTIFY_SHOW_IDS_ARRAY.length} shows failed to fetch`)
      episodeResults.forEach((result, idx) => {
        if (result.status === 'rejected') {
          const showId = SPOTIFY_SHOW_IDS_ARRAY[idx]
          const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason)
          console.error(`  - Show ${showId}: ${errorMsg}`)
        }
      })
    } else {
      console.log(`[buildAudioDispatchItem] ✓ All ${successCount} shows fetched successfully`)
    }

    // Extract and flatten episodes
    const allEpisodes = episodeResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<any>).value)
      .flatMap((result) => result.body?.items || [])
      .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())

    console.log(`[buildAudioDispatchItem] Got ${allEpisodes.length} episodes total`)

    // Transform to SeriesViewer-compatible format
    const episodes = allEpisodes.slice(0, 8).map((ep) => ({
      title: ep.name,
      url: ep.external_urls.spotify,
      source: ep.show.name,
      publishedAt: ep.release_date,
      type: 'audio' as const,
      spotifyId: ep.id,
      thumbnailUrl: ep.images?.[0]?.url || '',
    }))

    console.log(`[buildAudioDispatchItem] Transformed ${episodes.length} episodes for display`)

    // Return GleanerItem-compatible structure
    const item: GleanerItem = {
      title: 'Audio Dispatch',
      url: 'https://open.spotify.com',
      source: 'Spotify',
      publishedAt: episodes[0]?.publishedAt || new Date().toISOString(),
      type: 'series' as const,
      score: 1000,
      slot: 'audio_dispatch',
      episodes,
    }

    console.log(`[buildAudioDispatchItem] Returning item with ${item.episodes?.length || 0} episodes`)
    return item
  } catch (error) {
    console.error('[buildAudioDispatchItem] FATAL ERROR during Spotify fetch:', {
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
    })

    return {
      title: 'Audio Dispatch',
      url: 'https://open.spotify.com',
      source: 'Spotify',
      publishedAt: new Date().toISOString(),
      type: 'series' as const,
      score: 1000,
      slot: 'audio_dispatch',
      episodes: [],
    }
  }
}
