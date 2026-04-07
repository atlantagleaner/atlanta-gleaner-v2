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
import * as Accordion from '@radix-ui/react-accordion'
import {
  PALETTE, PALETTE_CSS, T,
  BOX_SHELL, BOX_HEADER, BOX_PADDING, ITEM_RULE, SPACING, ANIMATION,
} from '@/src/styles/tokens'
import { gleanArticle }         from '@/app/actions/glean'
import type { GleanResult }     from '@/app/actions/glean'
import { MirrorViewer }         from '@/src/components/News/MirrorViewer'
import { SeriesViewer }         from '@/src/components/News/SeriesViewer'

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
  }>
}

type DrawerState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: GleanResult }
  | { status: 'error'; message: string }

// ── Slot badges ───────────────────────────────────────────────────────────────

const SLOT_BADGE: Record<string, string | null> = {
  science_pin:          null,
  grab_bag:             '✦',
  science_nova:         '◉',
  letterman:            '★',
  news:                 null,
  'news-international': null,
}

// ── Mirror Drawer ─────────────────────────────────────────────────────────────
// Mounts when an accordion item opens. Fires gleanArticle immediately.
// Video items resolve synchronously (no network); text items may show a brief
// loading skeleton on cache-miss.

function MirrorDrawer({ item }: { item: NewsItem }) {
  const [drawer, setDrawer]   = useState<DrawerState>({ status: 'idle' })
  const [, startTransition]   = useTransition()

  useEffect(() => {
    setDrawer({ status: 'loading' })
    startTransition(async () => {
      const result = await gleanArticle(item.url, {
        title:  item.title,
        source: item.source,
        type:   item.type,
      })
      if ('error' in result) {
        setDrawer({ status: 'error', message: result.error })
      } else {
        setDrawer({ status: 'done', result })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.url])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (drawer.status === 'idle' || drawer.status === 'loading') {
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
  if (drawer.status === 'error') {
    return (
      <div style={{ padding: `${SPACING.sm} 0 ${SPACING.lg}` }}>
        <p style={{ ...T.micro, color: PALETTE_CSS.muted, margin: 0 }}>
          Could not mirror article.{' '}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: PALETTE.black, textUnderlineOffset: '2px' }}
          >
            Open directly →
          </a>
        </p>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  return <MirrorViewer result={drawer.result} />
}

function SeriesDrawer({ item }: { item: NewsItem }) {
  return (
    <SeriesViewer
      title={item.title}
      episodes={item.episodes ?? []}
      readFullUrl={item.url}
    />
  )
}

// ── Individual accordion item ─────────────────────────────────────────────────

function NewsAccordionItem({ item }: { item: NewsItem }) {
  const [open, setOpen] = useState(false)

  const badge      = SLOT_BADGE[item.slot] ?? null
  const isSeries   = item.type === 'series' || Boolean(item.episodes?.length)
  const isYouTube  = item.type === 'video' || /youtube\.com|youtu\.be/i.test(item.url)
  const isSpotify  = /spotify\.com/i.test(item.url)
  const mediaLabel = isYouTube ? ' · YouTube' : isSpotify ? ' · Spotify' : ''

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
                  {item.source}{mediaLabel}
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
  const [items, setItems]     = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/news')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setItems(data.items || [])
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError('News unavailable')
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

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

            {loading && <LoadingSkeleton />}

            {error && !loading && (
              <p style={{ ...T.micro, color: PALETTE.black, margin: 0 }}>{error}</p>
            )}

            {!loading && !error && (
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
