import type { Metadata } from 'next'
import Link from 'next/link'
import { get } from '@vercel/edge-config'
import { Banner } from '@/src/components/Banner'
import { PALETTE, PALETTE_CSS, T, SPACING, PAGE_MAX_W, PAGE_TITLE_BLOCK, BOX_SHELL, BOX_PADDING, ITEM_RULE } from '@/src/styles/tokens'
import type { CacheEntry } from '@/lib/news/types'
import { resolveFeedEntry } from '@/lib/newsFeedCache'
import type { CacheReference } from '@/lib/newsFeedCache'
import { LIVE_CACHE_KEY, STAGED_CACHE_KEY, STATUS_CACHE_KEY } from '@/lib/newsRefresh'
import type { RefreshStatus } from '@/lib/newsRefresh'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'News Refresh Status',
  robots: {
    index: false,
    follow: false,
  },
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not available'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  }).format(parsed)
}

function StatusCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div
      style={{
        ...BOX_SHELL,
        padding: BOX_PADDING,
        gap: SPACING.sm,
      }}
    >
      <p style={{ ...T.label, color: PALETTE.black, margin: 0 }}>{label}</p>
      <p
        style={{
          ...T.heading,
          fontSize: 'clamp(1.2rem, 3vw, 1.75rem)',
          color: PALETTE.black,
          margin: 0,
        }}
      >
        {value}
      </p>
      {hint && (
        <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function FeedSection({
  title,
  entry,
}: {
  title: string
  entry: CacheEntry | null
}) {
  return (
    <section style={{ ...BOX_SHELL, overflow: 'hidden' }}>
      <div style={{ padding: BOX_PADDING, borderBottom: '1px solid var(--palette-rule)' }}>
        <h2 style={{ ...T.label, color: PALETTE.black, margin: 0 }}>{title}</h2>
        <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: `${SPACING.sm} 0 0` }}>
          Cached at {formatDate(entry?.cachedAt ?? null)}
        </p>
      </div>

      <div style={{ background: PALETTE.white }}>
        {entry?.items?.length ? (
          entry.items.map((item, index) => (
            <div
              key={`${title}-${item.url}-${index}`}
              style={{
                padding: BOX_PADDING,
                ...(index < entry.items.length - 1 ? ITEM_RULE : {}),
              }}
            >
              <p style={{ ...T.body, color: PALETTE.black, margin: `0 0 ${SPACING.xs}` }}>
                {item.title}
              </p>
              <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>
                {[item.source, item.slot, item.type].filter(Boolean).join(' · ')}
              </p>
            </div>
          ))
        ) : (
          <div style={{ padding: BOX_PADDING }}>
            <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>
              No cached items.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default async function NewsStatusPage() {
  const [status, liveEntry, stagedEntry] = await Promise.all([
    get<RefreshStatus>(STATUS_CACHE_KEY),
    get<CacheEntry | CacheReference>(LIVE_CACHE_KEY).then((value) => resolveFeedEntry(value)),
    get<CacheEntry | CacheReference>(STAGED_CACHE_KEY).then((value) => resolveFeedEntry(value)),
  ])

  const failures = status?.failures ?? []

  return (
    <main
      style={{
        minHeight: '100vh',
        background: PALETTE.warm,
        paddingBottom: SPACING.xxxxl,
      }}
    >
      <Banner />

      <div
        style={{
          maxWidth: PAGE_MAX_W,
          margin: '0 auto',
          padding: `0 ${SPACING.lg}`,
        }}
      >
        <div style={{ ...PAGE_TITLE_BLOCK, marginTop: 0 }}>
          <h1 style={{ ...T.pageTitle, paddingTop: SPACING.xl, color: PALETTE.black, margin: 0 }}>
            News Refresh Status
          </h1>
          <p style={{ ...T.prose, color: PALETTE.black, margin: `${SPACING.md} 0 0`, maxWidth: '780px' }}>
            This page shows the staged and live news caches, plus the last prepare or publish run recorded by the cron pipeline.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: SPACING.lg,
            marginBottom: SPACING.xl,
          }}
        >
          <StatusCard label="Last Phase" value={status?.phase ?? 'No runs yet'} />
          <StatusCard label="Prepared" value={formatDate(status?.preparedAt)} />
          <StatusCard label="Published" value={formatDate(status?.publishedAt)} />
          <StatusCard label="Selected" value={String(status?.counts.selected ?? 0)} hint="Items in the last recorded run" />
          <StatusCard label="Failures" value={String(status?.counts.failures ?? 0)} hint="Extraction replacements during prepare" />
        </div>

        <section style={{ ...BOX_SHELL, marginBottom: SPACING.xl, overflow: 'hidden' }}>
          <div style={{ padding: BOX_PADDING, borderBottom: '1px solid var(--palette-rule)' }}>
            <h2 style={{ ...T.label, color: PALETTE.black, margin: 0 }}>Failure Log</h2>
            {status?.omittedFailures ? (
              <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: `${SPACING.sm} 0 0` }}>
                Showing the first {failures.length} failures. {status.omittedFailures} additional failures were omitted from the cached status record.
              </p>
            ) : null}
          </div>
          <div style={{ background: PALETTE.white }}>
            {failures.length ? (
              failures.map((failure, index) => (
                <div
                  key={`${failure.url}-${index}`}
                  style={{
                    padding: BOX_PADDING,
                    ...(index < failures.length - 1 ? ITEM_RULE : {}),
                  }}
                >
                  <p style={{ ...T.body, color: PALETTE.black, margin: `0 0 ${SPACING.xs}` }}>
                    {failure.title}
                  </p>
                  <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: `0 0 ${SPACING.sm}` }}>
                    {failure.source}
                  </p>
                  <p style={{ ...T.prose, color: PALETTE.black, margin: 0 }}>
                    {failure.error}
                  </p>
                  <Link
                    href={failure.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...T.micro,
                      display: 'inline-block',
                      color: PALETTE.black,
                      marginTop: SPACING.sm,
                      textDecoration: 'none',
                      borderBottom: `1px solid ${PALETTE.black}`,
                    }}
                  >
                    Source Link
                  </Link>
                </div>
              ))
            ) : (
              <div style={{ padding: BOX_PADDING }}>
                <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>
                  No extraction failures recorded in the latest run.
                </p>
              </div>
            )}
          </div>
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: SPACING.xl,
          }}
        >
          <FeedSection title="Live Feed" entry={liveEntry ?? null} />
          <FeedSection title="Staged Feed" entry={stagedEntry ?? null} />
        </div>
      </div>
    </main>
  )
}
