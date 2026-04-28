import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { put } from '@vercel/blob'
import { buildCloudNewsFeed } from '../lib/newsCloudFeed'
import { createCacheEntry } from '../lib/news/utils'
import { archiveCurrentLive, saveFeedEntry } from '../lib/newsFeedCache'
import { BACKUP_CACHE_KEY, LIVE_CACHE_KEY, PREVIOUS_CACHE_KEY, STATUS_CACHE_KEY } from '../lib/newsRefresh'

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function syncToProduction(finalItems: any[]) {
  if (!VERCEL_API_TOKEN || !EDGE_CONFIG_ID || !BLOB_READ_WRITE_TOKEN) {
    console.error('⚠️ Missing Vercel credentials. Skipping sync.')
    return
  }

  console.log('\n🚀 Syncing to Production...')
  try {
    const cachedAt = new Date().toISOString()
    const payload = createCacheEntry(finalItems, cachedAt)

    const blobRes = await put('news-feed/live.json', JSON.stringify(payload), {
      token: BLOB_READ_WRITE_TOKEN,
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json; charset=utf-8',
    })

    console.log(`✅ Blob uploaded: ${blobRes.url}`)

    const edgeRes = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: LIVE_CACHE_KEY,
            value: { blobUrl: blobRes.url, cachedAt },
          },
          {
            operation: 'upsert',
            key: BACKUP_CACHE_KEY,
            value: { blobUrl: blobRes.url, cachedAt },
          },
          {
            operation: 'upsert',
            key: STATUS_CACHE_KEY,
            value: {
              phase: 'publish',
              publishedAt: cachedAt,
              failures: [],
              counts: { selected: finalItems.length, failures: 0 },
            },
          },
        ],
      }),
    })

    if (!edgeRes.ok) throw new Error(`Edge Config update failed: ${await edgeRes.text()}`)

    console.log('✅ Edge Config updated successfully.')
  } catch (err: any) {
    console.error('💥 Sync failed:', err.message)
  }
}

async function main() {
  console.log('🚀 Starting news fetch...')

  const built = await buildCloudNewsFeed()
  const feedEntry = createCacheEntry(built.items)

  const outputPath = path.join(ROOT, 'public', 'news-local.json')
  fs.writeFileSync(outputPath, JSON.stringify(feedEntry, null, 2))
  console.log(`\n✅ Saved ${built.items.length} items to ${outputPath}`)

  if (process.argv.includes('--sync')) {
    await archiveCurrentLive()
    await saveFeedEntry('live', feedEntry)
    await saveFeedEntry('backup', feedEntry)
    await syncToProduction(built.items)
  }
}

main().catch((err) => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
