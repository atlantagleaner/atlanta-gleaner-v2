'use client'

import { useEffect, useMemo, useState } from 'react'
import { SPACING, T, BOX_HEADER, BOX_PADDING, ITEM_RULE } from '@/src/styles/tokens'
import { SeriesViewer } from '@/src/components/News/SeriesViewer'
import { formatRelativeTime } from '@/lib/utils/date'

type NewsItem = {
  title: string
  url: string
  source: string
  publishedAt: string
  score?: number
  slot: string
  type?: 'video' | 'text' | 'series'
  episodes?: Array<{
    title: string
    url: string
    source: string
    publishedAt: string
    type: 'video' | 'audio'
    videoId?: string
    spotifyId?: string
    thumbnailUrl: string
    channelHandle?: string
  }>
}

type NewsResponse = {
  items: NewsItem[]
  cachedAt: string | null
  count: number
  isStale?: boolean
  source?: string
  message?: string
}

const FEATURED_SLOTS = new Set(['science_pin', 'grab_bag', 'audio_dispatch'])

function FeaturedDrawerCard({ item }: { item: NewsItem }) {
  const [open, setOpen] = useState(false)
  const episodes = item.episodes || []
  const canShow = episodes.length > 0

  return (
    <section
      style={{
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: '100%',
          textAlign: 'left',
          background: open ? 'rgba(255, 179, 71, 0.10)' : 'rgba(255, 255, 255, 0.03)',
          border: 'none',
          borderBottom: open ? '1px solid rgba(255,255,255,0.10)' : 'none',
          padding: BOX_PADDING,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.lg,
          transition: 'background 0.2s ease, transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        }}
      >
        <span>
          <span style={{ ...T.label, color: '#FFF', display: 'block', letterSpacing: '0.18em' }}>{item.title}</span>
          <span style={{ ...T.micro, color: 'rgba(255,255,255,0.48)', display: 'block', marginTop: SPACING.xs }}>
            {item.source} · Featured Drawer
          </span>
        </span>
        <span style={{ ...T.label, color: 'rgba(255,255,255,0.55)' }}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div
          style={{
            padding: BOX_PADDING,
            background: 'rgba(2,1,1,0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {canShow ? (
            <SeriesViewer title={item.title} episodes={episodes} readFullUrl={item.url} variant="glass" />
          ) : (
            <div style={{ padding: `${SPACING.sm} 0` }}>
              <p style={{ ...T.micro, color: 'rgba(255,255,255,0.48)', margin: 0 }}>
                No embedded episodes are available right now.
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...T.micro,
                  display: 'inline-block',
                  color: '#FFB347',
                  marginTop: SPACING.sm,
                  textDecoration: 'none',
                }}
              >
                Open source →
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function HeadlineRow({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: '#FFF',
        padding: `${SPACING.md} 0`,
        ...(item ? ITEM_RULE : {}),
      }}
    >
      <div style={{ ...T.body, margin: `0 0 ${SPACING.xs}` }}>{item.title}</div>
      <div style={{ ...T.micro, color: 'rgba(255,255,255,0.48)' }}>
        {item.source} · {formatRelativeTime(item.publishedAt)}
      </div>
    </a>
  )
}

function HeadlinesDrawerCard({ headlines }: { headlines: NewsItem[] }) {
  return (
    <section
      style={{
        overflow: 'hidden',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
      }}
    >
      <div
        style={{
          padding: BOX_PADDING,
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <span style={{ ...T.label, color: '#FFF', display: 'block', letterSpacing: '0.18em' }}>News Index</span>
        <span style={{ ...T.micro, color: 'rgba(255,255,255,0.48)', display: 'block', marginTop: SPACING.xs }}>
          Headline feed · open articles directly
        </span>
      </div>

      <div style={{ padding: '0 18px 4px' }}>
        {headlines.length ? (
          headlines.map((item, index) => (
            <div key={item.url}>
              <HeadlineRow item={item} />
              {index < headlines.length - 1 && <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }} />}
            </div>
          ))
        ) : (
          <p style={{ ...T.micro, color: 'rgba(255,255,255,0.4)', margin: 0, padding: `${SPACING.md} 0` }}>
            No headlines cached yet.
          </p>
        )}
      </div>
    </section>
  )
}

export function NewsPanel({ open }: { open: boolean }) {
  const [data, setData] = useState<NewsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!open || data) return
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/news', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as NewsResponse
      })
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, data])

  const featured = useMemo(
    () => (data?.items || []).filter((item) => FEATURED_SLOTS.has(item.slot)),
    [data],
  )
  const headlines = useMemo(
    () => (data?.items || []).filter((item) => !FEATURED_SLOTS.has(item.slot)),
    [data],
  )

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '88px 16px 18px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          width: 'min(980px, 100%)',
          height: isMobile ? 'min(58vh, calc(100vh - 190px))' : 'min(58vh, calc(100vh - 220px))',
          minHeight: isMobile ? '520px' : '560px',
          maxHeight: isMobile ? '620px' : '660px',
          overflow: 'hidden',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(2, 1, 1, 0.72))',
          backdropFilter: 'blur(28px)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        <div
          className={`ag-news-panel-scroll${isMobile ? ' ag-news-panel-scroll--mobile' : ''}`}
          style={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            padding: '12px 14px 12px 12px',
            scrollbarGutter: 'stable both-edges',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 179, 71, 0.75) rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              padding: '6px 6px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '14px',
            }}
          >
            <h2 style={{ ...BOX_HEADER, color: '#FFF', marginBottom: SPACING.sm }}>News Index</h2>
            {loading && (
              <p style={{ ...T.micro, color: 'rgba(255,255,255,0.4)' }}>
                Loading cached news feed...
              </p>
            )}
            {error && (
              <p style={{ ...T.micro, color: '#FFB347' }}>
                News feed unavailable: {error}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
            {featured.length ? (
              featured.map((item) => <FeaturedDrawerCard key={item.url} item={item} />)
            ) : (
              <section
                style={{
                  overflow: 'hidden',
                  borderRadius: '24px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
                  padding: BOX_PADDING,
                }}
              >
                <p style={{ ...T.micro, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  No featured drawers are cached yet.
                </p>
              </section>
            )}

            <HeadlinesDrawerCard headlines={headlines} />
          </div>
        </div>
      </div>

      <style>{`
        .ag-news-panel-scroll::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .ag-news-panel-scroll--mobile::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        .ag-news-panel-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 999px;
        }
        .ag-news-panel-scroll--mobile::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.08);
        }
        .ag-news-panel-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(255, 198, 101, 0.95), rgba(255, 165, 0, 0.75));
          border-radius: 999px;
          border: 3px solid rgba(2, 1, 1, 0.72);
          background-clip: padding-box;
          box-shadow: 0 0 10px rgba(255, 179, 71, 0.35);
          min-height: 72px;
        }
        .ag-news-panel-scroll--mobile::-webkit-scrollbar-thumb {
          border: 4px solid rgba(2, 1, 1, 0.72);
          box-shadow: 0 0 12px rgba(255, 179, 71, 0.4);
          min-height: 84px;
        }
        .ag-news-panel-scroll::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, rgba(255, 214, 140, 0.98), rgba(255, 179, 71, 0.85));
          cursor: grab;
        }
        .ag-news-panel-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(255, 214, 140, 0.98), rgba(255, 179, 71, 0.85));
        }
      `}</style>
    </div>
  )
}
