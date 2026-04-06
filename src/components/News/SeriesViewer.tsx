'use client'

import { useEffect, useMemo, useState } from 'react'
import { PALETTE, PALETTE_CSS, T, SPACING } from '@/src/styles/tokens'

export interface SeriesEpisode {
  title: string
  url: string
  source: string
  publishedAt: string
  type: 'video'
  videoId: string
  thumbnailUrl: string
}

export function SeriesViewer({
  title,
  episodes,
  readFullUrl,
}: {
  title: string
  episodes: SeriesEpisode[]
  readFullUrl: string
  }) {
  const linkStyle = {
    ...T.micro,
    color: PALETTE.black,
    textDecoration: 'none',
    borderBottom: `1px solid ${PALETTE.black}`,
    paddingBottom: '1px',
  } as const

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(episodes[0]?.videoId ?? null)

  useEffect(() => {
    setSelectedVideoId(episodes[0]?.videoId ?? null)
  }, [episodes])

  const selectedEpisode = useMemo(
    () => episodes.find((episode) => episode.videoId === selectedVideoId) ?? episodes[0] ?? null,
    [episodes, selectedVideoId],
  )

  const embedSrc = selectedEpisode
    ? `https://www.youtube-nocookie.com/embed/${selectedEpisode.videoId}?modestbranding=1&rel=0`
    : null

  return (
    <div style={{ padding: `${SPACING.md} 0 ${SPACING.lg}` }}>
      <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: `0 0 ${SPACING.xs}` }}>
        Latest uploads
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          marginBottom: SPACING.xs,
        }}
      >
        <p style={{ ...T.body, margin: 0 }}>{title}</p>
        <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>
          {episodes.length} recent uploads
        </p>
      </div>

      {!selectedEpisode || !embedSrc ? (
        <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>
          No recent uploads were found.
        </p>
      ) : (
        <>
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%',
              overflow: 'hidden',
              marginBottom: SPACING.md,
              background: 'var(--palette-warm)',
              border: `1px solid var(--palette-rule)`,
            }}
          >
            <iframe
              src={embedSrc}
              title={selectedEpisode.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            {episodes.map((episode, index) => {
              const isActive = episode.videoId === selectedEpisode.videoId

              return (
                <button
                  key={episode.videoId}
                  type="button"
                  onClick={() => setSelectedVideoId(episode.videoId)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: isActive ? 'var(--palette-subtle)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--palette-black)' : 'var(--palette-rule)'}`,
                    padding: SPACING.md,
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: `0 0 ${SPACING.xs}` }}>
                    #{index + 1} | {episode.publishedAt || 'Recently published'}
                  </p>
                  <p style={{ ...T.body, margin: `0 0 ${SPACING.xs}` }}>
                    <span style={{ color: PALETTE.black }}>{episode.title}</span>
                  </p>
                </button>
              )
            })}
          </div>
        </>
      )}

      {episodes.length > 0 && (
        <a
          href={readFullUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...linkStyle, display: 'inline-block', marginTop: SPACING.md }}
        >
          {'Open channel ->'}
        </a>
      )}
    </div>
  )
}
