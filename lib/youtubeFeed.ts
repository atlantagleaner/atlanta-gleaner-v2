// YouTube featured series + grab bag - used by cron refresh and scripts/fetch-news.
// Prefer the channel uploads feed first because it is the most stable public path.

import type { GleanerEpisode, GleanerItem } from '@/lib/news/types'
import { fetchWithTimeout, FETCH_TIMEOUTS } from '@/lib/fetchWithTimeout'
import { fetchFeed, normalizeFeedText } from '@/lib/rssParser'

function episodeFromFeedItem(item: { title: string; link: string; pubDate: Date }): GleanerEpisode | null {
  const match = item.link.match(/[?&]v=([^&]+)/)
  const videoId = match?.[1]
  if (!videoId || !item.title) return null

  return {
    title: normalizeFeedText(item.title),
    url: item.link,
    source: 'YouTube',
    publishedAt: item.pubDate.toISOString(),
    type: 'video',
    videoId,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  }
}

async function fetchYouTubeUploadsFeed(channelId: string, maxResults: number): Promise<GleanerEpisode[]> {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const items = await fetchFeed(url)
    return items
      .map(episodeFromFeedItem)
      .filter(Boolean)
      .slice(0, maxResults) as GleanerEpisode[]
  } catch (error) {
    console.warn(`[youtubeFeed] uploads feed failed for ${channelId}`, error)
    return []
  }
}

function extractJsonObject(text: string, marker: string): string | null {
  const start = text.indexOf(marker)
  if (start === -1) return null
  const braceStart = text.indexOf('{', start)
  if (braceStart === -1) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = braceStart; i < text.length; i += 1) {
    const char = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{') {
      depth += 1
      continue
    }
    if (char === '}') {
      depth -= 1
      if (depth === 0) return text.slice(braceStart, i + 1)
    }
  }
  return null
}

function collectRenderers(value: unknown, output: unknown[] = []): unknown[] {
  if (!value || typeof value !== 'object') return output
  if (Array.isArray(value)) {
    for (const entry of value) collectRenderers(entry, output)
    return output
  }
  const v = value as Record<string, unknown>
  if (v.gridVideoRenderer) output.push(v.gridVideoRenderer)
  if (v.videoRenderer) output.push(v.videoRenderer)
  for (const child of Object.values(v)) collectRenderers(child, output)
  return output
}

function rendererToEpisode(renderer: Record<string, unknown>): GleanerEpisode | null {
  let videoId = renderer.videoId as string | undefined
  if (!videoId) {
    const nav = renderer.navigationEndpoint as { watchEndpoint?: { videoId?: string } } | undefined
    videoId = nav?.watchEndpoint?.videoId
  }

  const title =
    (renderer.title as { simpleText?: string; runs?: Array<{ text: string }> } | undefined)?.simpleText ||
    (renderer.title as { runs?: Array<{ text: string }> } | undefined)?.runs?.map((r) => r.text).join('') ||
    ''

  const publishedAt = (renderer.publishedTimeText as { simpleText?: string } | undefined)?.simpleText || ''
  if (!videoId || !title) return null

  return {
    title: normalizeFeedText(title),
    url: `https://www.youtube.com/watch?v=${videoId}`,
    source: 'YouTube',
    publishedAt,
    type: 'video',
    videoId,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  }
}

async function scrapeYouTubeChannelVideos(
  channelTitle: string,
  channelUrl: string,
  maxResults: number,
): Promise<GleanerEpisode[]> {
  try {
    const response = await fetchWithTimeout(channelUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
      timeoutMs: FETCH_TIMEOUTS.YOUTUBE,
      label: `YouTubeScrape:${channelTitle}`,
    })

    if (!response.ok) {
      console.warn(`[youtubeFeed] scrape HTTP ${response.status} for ${channelTitle}`)
      return []
    }

    const html = await response.text()
    const jsonText = extractJsonObject(html, 'ytInitialData')
    if (!jsonText) {
      console.warn(`[youtubeFeed] ytInitialData not found for ${channelTitle}`)
      return []
    }

    const data = JSON.parse(jsonText) as unknown
    return collectRenderers(data)
      .map((r) => rendererToEpisode(r as Record<string, unknown>))
      .filter(Boolean)
      .slice(0, maxResults) as GleanerEpisode[]
  } catch (e) {
    console.warn(`[youtubeFeed] scrape failed for ${channelTitle}`, e)
    return []
  }
}

export async function fetchYouTubeChannelVideosApi(
  channelId: string,
  maxResults: number,
): Promise<GleanerEpisode[]> {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return []

  try {
    const u = new URL('https://www.googleapis.com/youtube/v3/search')
    u.searchParams.set('key', key)
    u.searchParams.set('channelId', channelId)
    u.searchParams.set('part', 'snippet,id')
    u.searchParams.set('order', 'date')
    u.searchParams.set('maxResults', String(Math.min(maxResults, 50)))
    u.searchParams.set('type', 'video')

    const res = await fetchWithTimeout(u.toString(), {
      timeoutMs: FETCH_TIMEOUTS.YOUTUBE,
      label: 'YouTubeAPI',
    })
    if (!res.ok) {
      const t = await res.text()
      console.error('[youtubeFeed] YouTube API HTTP', res.status, t.slice(0, 240))
      return []
    }

    const data = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string }
        snippet: {
          title: string
          publishedAt: string
          thumbnails?: { high?: { url?: string } }
        }
      }>
    }

    const out: GleanerEpisode[] = []
    for (const item of data.items || []) {
      const videoId = item.id?.videoId
      if (!videoId) continue
      out.push({
        title: normalizeFeedText(item.snippet.title),
        url: `https://www.youtube.com/watch?v=${videoId}`,
        source: 'YouTube',
        publishedAt: item.snippet.publishedAt,
        type: 'video',
        videoId,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      })
    }
    return out
  } catch (e) {
    console.error('[youtubeFeed] YouTube API error', e)
    return []
  }
}

/** Try uploads feed first; then Data API; then scrape channel /videos page. */
export async function fetchChannelEpisodesWithFallback(
  channelId: string,
  channelUrl: string,
  channelTitle: string,
  maxResults: number,
): Promise<GleanerEpisode[]> {
  const feed = await fetchYouTubeUploadsFeed(channelId, maxResults)
  if (feed.length > 0) return feed

  const api = await fetchYouTubeChannelVideosApi(channelId, maxResults)
  if (api.length > 0) return api

  return scrapeYouTubeChannelVideos(channelTitle, channelUrl, maxResults)
}

export const FEATURED_YOUTUBE_CHANNELS = {
  starTalk: {
    title: 'StarTalk',
    url: 'https://www.youtube.com/@StarTalk/videos',
    channelId: 'UCqoAEDirJPjEUFcF2FklnBA',
  },
  pbsSpaceTime: {
    title: 'PBS Space Time',
    url: 'https://www.youtube.com/@pbsspacetime/videos',
    channelId: 'UC7_gcs09iThXybpVgjHZ_7g',
  },
} as const

function youtubeHandleFromChannelUrl(channelUrl: string): string | undefined {
  const m = channelUrl.match(/youtube\.com\/@([^/?#]+)/i)
  return m ? `@${m[1]}` : undefined
}

export const GRAB_BAG_CHANNELS = [
  { id: 'kurzgesagt', url: 'https://www.youtube.com/@kurzgesagt/videos', cid: 'UCsXVk37bltUXD1fauIDKJgQ' },
  { id: 'novapbs', url: 'https://www.youtube.com/@novapbs/videos', cid: 'UC9uD-W5zkVUUnp6VByI_zSg' },
  { id: 'PBSDocumentaries', url: 'https://www.youtube.com/@PBSDocumentaries/videos', cid: 'UCq6OAftTQOuUBRdtUDq5SUA' },
  { id: 'Veritasium', url: 'https://www.youtube.com/@veritasium/videos', cid: 'UCHnyfMqiRRG1u-2MsSQLbXA' },
  { id: 'SmarterEveryDay', url: 'https://www.youtube.com/@smartereveryday/videos', cid: 'UC6107grRI4K0o2-umHBVMwA' },
  { id: 'RealEngineering', url: 'https://www.youtube.com/@RealEngineering/videos', cid: 'UCR1IuLEqb6UEAofA8UZ161A' },
] as const

export async function buildFeaturedSeriesItem(
  title: string,
  channelUrl: string,
  channelId: string,
  slot: string,
): Promise<GleanerItem> {
  const episodes = await fetchChannelEpisodesWithFallback(channelId, channelUrl, title, 3)
  return {
    title: normalizeFeedText(title),
    url: channelUrl,
    source: 'YouTube',
    publishedAt: episodes[0]?.publishedAt || '',
    type: 'series',
    score: 1000,
    slot,
    episodes,
  }
}

export async function buildScienceGrabBagItem(): Promise<GleanerItem> {
  const shuffled = [...GRAB_BAG_CHANNELS].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, 3)
  const episodesResults = await Promise.all(
    selected.map(async (ch) => {
      const eps = await fetchChannelEpisodesWithFallback(ch.cid, ch.url, ch.id, 2)
      const handle = youtubeHandleFromChannelUrl(ch.url)
      return eps.map((ep) => (handle ? { ...ep, channelHandle: handle } : ep))
    }),
  )

  const episodes = episodesResults.flat().slice(0, 9)
  return {
    title: 'Grab Bag',
    url: 'https://www.youtube.com/',
    source: 'YouTube',
    publishedAt: new Date().toISOString(),
    type: 'series',
    score: 1000,
    slot: 'grab_bag',
    episodes,
  }
}
