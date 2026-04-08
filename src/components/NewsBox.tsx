'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — NewsBox (Mirror Proxy Edition)
// ─────────────────────────────────────────────────────────────────────────────
// Fetches the 15-item news feed from /api/news (Edge Config, no Serper calls
// on the client). Each item expands via a Radix UI Accordion.
//
// On expand:
//   • Video items  → MirrorViewer renders a clean YouTube embed immediately.
//   • Text items   → gleanArticle() checks the 24-hour Vercel Blob cache.
//                    Cache hit  → instant drawer (no spinner).
//                    Cache miss → "Gleaning original source…" skeleton while
//                                 the proxy fetches and Cheerio cleans the HTML.
//
// Design: all styling via tokens.ts — no new CSS classes.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as Accordion from '@radix-ui/react-accordion'
import {
  PALETTE, PALETTE_CSS, T,
  BOX_SHELL, BOX_HEADER, BOX_PADDING, ITEM_RULE, SPACING, ANIMATION,
} from '@/src/styles/tokens'
import { gleanArticle }         from '@/app/actions/glean'
import type { GleanResult }     from '@/app/actions/glean'
import { MirrorViewer }         from '@/src/components/News/MirrorViewer'
import { SeriesViewer }         from '@/src/components/News/SeriesViewer'
import { formatRelativeTime }   from '@/lib/utils/date'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NewsItem {
  title:       string
  url:         string
  source:      string
  publishedAt: string
  score?:      number
  slot:        string
  type?:       'video' | 'text' | 'series'
  episodes?:   Array<{
    title: string
    url: string
    source: string
    publishedAt: string
    type: 'video'
    videoId: string
    thumbnailUrl: string
    channelHandle?: string
  }>
}

interface NewsResponse {
  items: NewsItem[]
  cachedAt: string
  count: number
}

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchNews(): Promise<NewsResponse> {
  const res = await fetch('/api/news')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function gleanItem(item: NewsItem): Promise<DrawerResult> {
  try {
    const res = await gleanArticle(item.url, {
      title: item.title,
      source: item.source,
      type: item.type,
    })

    if ('error' in res) {
      return {
        status: 'error',
        message: normalizeMirrorError(res.error),
      } as const
    }

    return {
      status: 'ready',
      result: res,
    } as const
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      status: 'error',
      message: normalizeMirrorError(message),
    } as const
  }
}

type DrawerResult =
  | { status: 'ready'; result: GleanResult }
  | { status: 'error'; message: string }

function normalizeMirrorError(message: string): string {
  if (
    message.includes('Server Components render') ||
    message.includes('digest property') ||
    message.includes('server components')
  ) {
    return 'The source blocked the mirror request. Open directly to read the original page.'
  }

  if (message.includes('HTTP 403')) {
    return 'The source denied the mirror request. Open directly to read the original page.'
  }

  return message
}

type DrawerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: GleanResult }
  | { status: 'error'; message: string }

// ── Slot badges ───────────────────────────────────────────────────────────────

const SLOT_BADGE: Record<string, string | null> = {
  science_pin:          '✦',
  grab_bag:             '✦',
  science_nova:         '◉',
  letterman:            '★',
  podcast_pin:          '🎙️',
  news:                 null,
  'news-international': null,
}

// ── Mirror Drawer ─────────────────────────────────────────────────────────────
// Mounts when an accordion item opens. Fires gleanArticle immediately.
// Video items resolve synchronously (no network); text items may show a brief
// loading skeleton on cache-miss.

function MirrorDrawer({ item }: { item: NewsItem }) {
  const { data, isLoading, error } = useQuery<DrawerResult>({
    queryKey: ['glean', item.url],
    queryFn: () => gleanItem(item),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 0,
  })

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ padding: `${SPACING.md} 0 ${SPACING.lg}` }}>
        <p style={{
          ...T.micro,
          color:        PALETTE_CSS.muted,
          margin:       `0 0 ${SPACING.md}`,
          animation:    `gleaner-pulse 1.6s ease-in-out infinite`,
        }}>
          Gleaning original source…
        </p>
        {/* Skeleton bars */}
        {[65, 45, 55].map((w, i) => (
          <div key={i} style={{
            height:       '10px',
            width:        `${w}%`,
            background:   'var(--palette-rule)',
            marginBottom: SPACING.sm,
            borderRadius: '2px',
          }} />
        ))}
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: `${SPACING.sm} 0 ${SPACING.lg}` }}>
        <p style={{ ...T.micro, color: PALETTE_CSS.muted, margin: 0 }}>
          Could not mirror article.{' '}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: PALETTE.black, textDecoration: 'none' }}
          >
            {'Open directly ->'}
          </a>
        </p>
        <p style={{ ...T.micro, color: PALETTE_CSS.meta, marginTop: SPACING.xs }}>
          {error.message}
        </p>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (!data) return null

  if (data.status === 'error') {
    return (
      <div style={{ padding: `${SPACING.sm} 0 ${SPACING.lg}` }}>
        <p style={{ ...T.micro, color: PALETTE_CSS.muted, margin: 0 }}>
          Could not mirror article.{' '}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: PALETTE.black, textDecoration: 'none' }}
          >
            {'Open directly ->'}
          </a>
        </p>
        <p style={{ ...T.micro, color: PALETTE_CSS.meta, marginTop: SPACING.xs }}>
          {data.message}
        </p>
      </div>
    )
  }

  return <MirrorViewer result={data.result} publishedAt={item.publishedAt} />
}

function SeriesDrawer({ item }: { item: NewsItem }) {
  if (!item.episodes?.length) {
    return (
      <div style={{ padding: `${SPACING.sm} 0 ${SPACING.lg}` }}>
        <p style={{ ...T.micro, color: PALETTE_CSS.muted, margin: 0 }}>
          No recent episodes found.{' '}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: PALETTE.black }}
          >
            View on platform →
          </a>
        </p>
      </div>
    )
  }

  return (
    <SeriesViewer
      title={item.title}
      episodes={item.episodes}
      readFullUrl={item.url}
    />
  )
}

// ── Individual accordion item ─────────────────────────────────────────────────

function NewsAccordionItem({ item }: { item: NewsItem }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const badge      = SLOT_BADGE[item.slot] ?? null
  const isSeries   = item.type === 'series' || (item.episodes && item.episodes.length > 0)
  const isYouTube  = item.type === 'video' || /youtube\.com|youtu\.be/i.test(item.url)
  const isSpotify  = /spotify\.com/i.test(item.url)
  const mediaLabel = isYouTube ? ' · YouTube' : isSpotify ? ' · Spotify' : ''
  const age        = mounted ? formatRelativeTime(item.publishedAt) : ''

  const handleChange = useCallback((val: string) => {
    setOpen(val === item.url)
  }, [item.url])

  return (
    <Accordion.Root
      type="single"
      collapsible
      onValueChange={handleChange}
      style={{ width: '100%' }}
    >
      <Accordion.Item
        value={item.url}
        style={{ ...ITEM_RULE, paddingBottom: 0, marginBottom: 0 }}
      >
        {/* ── Trigger ─────────────────────────────────────────────────────── */}
        <Accordion.Header style={{ margin: 0 }}>
          <Accordion.Trigger
            style={{
              width:          '100%',
              background:     'none',
              border:         'none',
              padding:        `${SPACING.md} 0`,
              cursor:         'pointer',
              textAlign:      'left',
              display:        'flex',
              alignItems:     'flex-start',
              justifyContent: 'space-between',
              gap:            SPACING.sm,
            }}
          >
            <span>
              <span style={{
                ...T.body,
                color:      PALETTE.black,
                display:    'block',
                marginBottom: SPACING.xs,
              }}>
                {badge && (
                  <span style={{ ...T.micro, marginRight: SPACING.xs, verticalAlign: 'middle' }}>
                    {badge}
                  </span>
                )}
                {item.title}
              </span>
              {!isSeries && (
                <span style={{
                  ...T.micro,
                  color:     PALETTE_CSS.meta,
                  display:   'block',
                  marginTop: SPACING.xs,
                }}>
                  {item.source}{mediaLabel}{age && ` · ${age}`}
                </span>
              )}
            </span>

            {/* Chevron */}
            <span
              aria-hidden="true"
              style={{
                ...T.micro,
                color:      PALETTE_CSS.meta,
                flexShrink: 0,
                marginTop:  '2px',
                display:    'inline-block',
                transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform ${ANIMATION.base} ${ANIMATION.ease}`,
              }}
            >
              ↓
            </span>
          </Accordion.Trigger>
        </Accordion.Header>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <Accordion.Content className="gleaner-accordion-content">
          <div style={{ paddingBottom: SPACING.sm }}>
            {open && (isSeries ? <SeriesDrawer item={item} /> : <MirrorDrawer item={item} />)}
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} style={{ ...ITEM_RULE, paddingBottom: SPACING.md, marginBottom: SPACING.md }}>
          <div style={{ height: '14px', width: `${60 + (i % 3) * 15}%`, background: 'var(--palette-rule)', marginBottom: SPACING.sm }} />
          <div style={{ height: '10px', width: '30%', background: 'var(--palette-rule-sm)' }} />
        </li>
      ))}
    </ul>
  )
}

// ── Main NewsBox ───────────────────────────────────────────────────────────────

export function NewsBox({ style }: { style?: React.CSSProperties }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['news-feed'],
    queryFn: fetchNews,
  })

  const items = data?.items || []

  return (
    <>
      {/* Pulse animation for cache-miss loading state */}
      <style>{`
        @keyframes gleaner-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div style={{ height: 'fit-content', ...style }}>
        <div style={BOX_SHELL}>
          <div style={{ padding: BOX_PADDING }}>
            <h2 style={BOX_HEADER}>News Index</h2>

            {isLoading && <LoadingSkeleton />}

            {isError && !isLoading && (
              <div style={{ padding: `${SPACING.md} 0` }}>
                <p style={{ ...T.micro, color: PALETTE.black, marginBottom: SPACING.sm }}>
                  News feed unavailable.
                </p>
                <button 
                  onClick={() => refetch()}
                  style={{
                    ...T.micro,
                    background: 'none',
                    border: `1px solid ${PALETTE.black}`,
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
                {error && (
                  <p style={{ ...T.micro, color: PALETTE_CSS.meta, marginTop: SPACING.sm }}>
                    Error: {error.message}
                  </p>
                )}
              </div>
            )}

            {!isLoading && !isError && items.length === 0 && (
              <p style={{ ...T.micro, color: PALETTE_CSS.meta, padding: `${SPACING.md} 0` }}>
                Feed is empty. Check back later.
              </p>
            )}

            {!isLoading && !isError && items.length > 0 && (
              <div>
                {items.map((item) => (
                  <NewsAccordionItem key={item.url} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
