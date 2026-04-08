import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ensureReaderDocument } from '../lib/newsReader'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOCAL_FEED_PATH = path.join(ROOT, 'public', 'news-local.json')

async function main() {
  if (!fs.existsSync(LOCAL_FEED_PATH)) {
    console.error('❌ Local feed not found. Run fetch-news first.')
    return
  }

  const feed = JSON.parse(fs.readFileSync(LOCAL_FEED_PATH, 'utf-8'))
  const articles = feed.items.filter((item: any) => item.type === 'text')

  console.log(`🚀 Re-gleaning ${articles.length} articles to refresh dates...`)

  for (const article of articles) {
    console.log(`✨ Refreshing: ${article.title.slice(0, 50)}...`)
    try {
      await ensureReaderDocument(article.url, {
        title: article.title,
        source: article.source,
      }, { force: true })
      console.log(`   ✅ Success`)
    } catch (err) {
      console.error(`   ❌ Failed: ${err}`)
    }
    // Small delay to be polite
    await new Promise(r => setTimeout(r, 800))
  }

  console.log('\n🏁 Finished re-gleaning current feed.')
}

main().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
