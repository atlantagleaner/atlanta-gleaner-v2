import type { GleanerItem } from '@/lib/news/types'
import { FEED_TARGETS } from '@/lib/newsConfig'
import type { RefreshFailure } from '@/lib/newsRefresh'
import { inferSlot, scoreItem } from '@/lib/news/utils'
import { fetchFeed } from '@/lib/rssParser'
import { buildAudioDispatchItem } from '@/lib/spotifyFeed'
import {
  buildScienceGrabBagItem,
  buildFeaturedSeriesItem,
  FEATURED_YOUTUBE_CHANNELS,
} from '@/lib/youtubeFeed'

type CloudFeedSource = {
  source: string
  url: string
  maxItems: number
}

const CLOUD_FEED_SOURCES: CloudFeedSource[] = [
  {
    source: '11Alive',
    url: 'https://www.11alive.com/feeds/syndication/rss/news',
    maxItems: 12,
  },
  {
    source: 'CNN',
    url: 'http://rss.cnn.com/rss/cnn_topstories.rss',
    maxItems: 12,
  },
  {
    source: 'CNN',
    url: 'http://rss.cnn.com/rss/edition.rss',
    maxItems: 12,
  },
  {
    source: 'NPR',
    url: 'https://feeds.npr.org/1001/rss.xml',
    maxItems: 10,
  },
  {
    source: 'BBC',
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    maxItems: 12,
  },
  {
    source: 'BBC',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    maxItems: 12,
  },
]

async function fetchSourceArticles(source: CloudFeedSource): Promise<GleanerItem[]> {
  const items = await fetchFeed(source.url)
  return items
    .slice(0, source.maxItems)
    .map((item) => ({
      title: item.title,
      url: item.link,
      source: source.source,
      publishedAt: item.pubDate.toISOString(),
      type: 'text' as const,
      score: 0,
      slot: 'news',
    }))
    .filter((item) => item.title && item.url)
}

export async function buildCloudNewsFeed(): Promise<{ items: GleanerItem[]; failures: RefreshFailure[] }> {
  const failures: RefreshFailure[] = []

  const [starTalk, pbs, grabBag, audioDispatch] = await Promise.all([
    buildFeaturedSeriesItem(
      FEATURED_YOUTUBE_CHANNELS.starTalk.title,
      FEATURED_YOUTUBE_CHANNELS.starTalk.url,
      FEATURED_YOUTUBE_CHANNELS.starTalk.channelId,
      'science_pin',
    ),
    buildFeaturedSeriesItem(
      FEATURED_YOUTUBE_CHANNELS.pbsSpaceTime.title,
      FEATURED_YOUTUBE_CHANNELS.pbsSpaceTime.url,
      FEATURED_YOUTUBE_CHANNELS.pbsSpaceTime.channelId,
      'science_pin',
    ),
    buildScienceGrabBagItem(),
    buildAudioDispatchItem(),
  ])

  const sourceResults = await Promise.allSettled(CLOUD_FEED_SOURCES.map(fetchSourceArticles))
  const articlePool: GleanerItem[] = []

  sourceResults.forEach((result, index) => {
    const source = CLOUD_FEED_SOURCES[index]
    if (result.status === 'fulfilled') {
      articlePool.push(...result.value)
      if (result.value.length === 0) {
        failures.push({
          title: source.source,
          url: source.url,
          source: source.source,
          error: 'Feed returned no items',
        })
      }
    } else {
      failures.push({
        title: source.source,
        url: source.url,
        source: source.source,
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })
    }
  })

  const processed = articlePool
    .map((item) => ({
      ...item,
      score: scoreItem(item),
      slot: inferSlot(item),
    }))
    .sort((a, b) => b.score - a.score)

  const seen = new Set([starTalk.url, pbs.url, grabBag.url, audioDispatch.url])
  const finalItems: GleanerItem[] = [starTalk, pbs, grabBag, audioDispatch]
  const sourceCounts: Record<string, number> = {}
  const sourceCap = 4

  for (const item of processed) {
    if (finalItems.length >= FEED_TARGETS.total) break
    if (seen.has(item.url)) continue

    const source = item.source || 'Web'
    const currentCount = sourceCounts[source] || 0
    if (currentCount >= sourceCap) continue

    seen.add(item.url)
    sourceCounts[source] = currentCount + 1
    finalItems.push(item)
  }

  return { items: finalItems, failures }
}
