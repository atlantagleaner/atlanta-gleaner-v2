// Atlanta Gleaner - Daily News Refresh Cron
//
// Runs once per day via Vercel Cron.
// This route builds the cached feed and writes it to Blob + Edge Config.

import { createCacheEntry } from '@/lib/news/utils'
import { archiveCurrentLive, saveFeedEntry } from '@/lib/newsFeedCache'
import { BACKUP_CACHE_KEY, LIVE_CACHE_KEY, PREVIOUS_CACHE_KEY, STATUS_CACHE_KEY } from '@/lib/newsRefresh'
import { buildCloudNewsFeed } from '@/lib/newsCloudFeed'

export const runtime = 'nodejs'

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const MAX_STATUS_FAILURES = 12

async function writeToEdgeConfigItems(entries: Array<{ key: string; value: unknown }>) {
  if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) throw new Error('Missing Vercel credentials')
  const res = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: entries.map((e) => ({ operation: 'upsert', key: e.key, value: e.value })),
    }),
  })
  if (!res.ok) throw new Error(`Edge Config failed: ${await res.text()}`)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-vercel-cron')
  const userAgent = request.headers.get('user-agent') || ''
  const cronSecret = process.env.CRON_SECRET
  const isVercelCron = cronHeader === '1' || userAgent.includes('vercel-cron/1.0')
  const isAuthorized = (cronSecret && authHeader === `Bearer ${cronSecret}`) || isVercelCron

  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    console.log('[cron/refresh-news] Archiving current live cache...')
    const previousRef = await archiveCurrentLive()
    if (previousRef) {
      console.log('[cron/refresh-news] Previous cache archived:', previousRef.blobUrl)
    }

    const built = await buildCloudNewsFeed()
    const liveEntry = createCacheEntry(built.items)

    const liveRef = await saveFeedEntry('live', liveEntry)
    const backupRef = await saveFeedEntry('backup', liveEntry)
    console.log('[cron/refresh-news] Backup cache saved:', backupRef.blobUrl)

    const edgeConfigUpdates: Array<{ key: string; value: unknown }> = [
      { key: LIVE_CACHE_KEY, value: liveRef },
      { key: BACKUP_CACHE_KEY, value: backupRef },
    ]
    if (previousRef) {
      edgeConfigUpdates.push({ key: PREVIOUS_CACHE_KEY, value: previousRef })
    }
    edgeConfigUpdates.push({
      key: STATUS_CACHE_KEY,
      value: {
        phase: 'publish' as const,
        publishedAt: new Date().toISOString(),
        failures: built.failures.slice(0, MAX_STATUS_FAILURES),
        omittedFailures:
          built.failures.length > MAX_STATUS_FAILURES
            ? built.failures.length - MAX_STATUS_FAILURES
            : undefined,
        counts: { selected: liveEntry.items.length, failures: built.failures.length },
      },
    })

    await writeToEdgeConfigItems(edgeConfigUpdates)

    return Response.json({ ok: true, count: liveEntry.items.length, failures: built.failures.length })
  } catch (error: any) {
    console.error('[cron/refresh-news] Error:', error)
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }
}
