'use client'

import { useEffect, useMemo, useState } from 'react'
import { PALETTE, PALETTE_CSS, T, SPACING, ANIMATION } from '@/src/styles/tokens'

export interface SeriesEpisode {
  title: string
  url: string
  source: string
  publishedAt: string
  type: 'video' | 'audio'
  videoId?: string
  spotifyId?: string
  /** Grab-bag only — strict @handle from channel URL */
  channelHandle?: string
  thumbnailUrl: string
}

function episodeMetaLine(episode: SeriesEpisode): string {
  const date = episode.publishedAt || 'Recently'
  if (episode.source === 'NASA') {
    return `🔴 LIVE | ${episode.source} · ${date}`
  }
  if (episode.channelHandle) {
    return `${episode.source} · ${episode.channelHandle} · ${date}`
  }
  return `${episode.source} · ${date}`
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

  const [selectedId, setSelectedId] = useState<string | null>(
    episodes[0]?.spotifyId ?? episodes[0]?.videoId ?? null
  )
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setSelectedId(episodes[0]?.spotifyId ?? episodes[0]?.videoId ?? null)
  }, [episodes])

  const selectedEpisode = useMemo(
    () => episodes.find((ep) => (ep.spotifyId ?? ep.videoId) === selectedId) ?? episodes[0] ?? null,
    [episodes, selectedId],
  )

  const isSpotify = selectedEpisode?.type === 'audio' || !!selectedEpisode?.spotifyId
  const embedSrc = selectedEpisode
    ? isSpotify 
      ? `https://open.spotify.com/embed/episode/${selectedEpisode.spotifyId}?utm_source=generator`
      : `https://www.youtube-nocookie.com/embed/${selectedEpisode.videoId}?modestbranding=1&rel=0`
    : null

  // Collapses to exactly 3 items per user request
  const INITIAL_COUNT = 3
  const isExpandable = episodes.length > INITIAL_COUNT
  const visibleEpisodes = expanded ? episodes : episodes.slice(0, INITIAL_COUNT)

  return (
    <div
      role="region"
      aria-label={title}
      style={{ padding: `0 0 ${SPACING.lg}` }}
    >
      {!selectedEpisode || !embedSrc ? (
        <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>
          No content found.
        </p>
      ) : (
        <>
          <div
            style={{
              position: 'relative',
              width: '100%',
              // YouTube is 16:9 aspect ratio, Spotify is fixed height
              paddingBottom: isSpotify ? '0' : '56.25%',
              height: isSpotify ? '152px' : 'auto',
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
                position: isSpotify ? 'relative' : 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              loading="lazy"
            />
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
              {visibleEpisodes.map((episode) => {
                const epId = episode.spotifyId ?? episode.videoId
                const isActive = epId === selectedId

                return (
                  <button
                    key={epId}
                    type="button"
                    onClick={() => {
                      setSelectedId(epId!)
                    }}
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
                      {episodeMetaLine(episode)}
                    </p>
                    <p style={{ ...T.body, margin: `0 0 ${SPACING.xs}` }}>
                      <span style={{ color: PALETTE.black }}>{episode.title}</span>
                    </p>
                  </button>
                )
              })}
            </div>

            {isExpandable && !expanded && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '90px',
                  background: 'linear-gradient(to bottom, transparent, var(--interactive-gradient-fade))',
                  pointerEvents: 'none',
                  opacity: 1,
                  transition: `opacity 0.25s ${ANIMATION.ease}`,
                }}
              />
            )}
          </div>
          
          {isExpandable && (
            <button
              onClick={() => setExpanded(v => !v)}
              aria-expanded={expanded}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderTop: expanded ? '1px solid var(--palette-rule)' : 'none',
                padding: `${SPACING.md} 0`,
                marginTop: expanded ? SPACING.md : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
                transition: `border-color ${ANIMATION.base} ${ANIMATION.ease}`,
              }}
            >
              <span style={{ ...T.label, color: PALETTE.black }}>
                {expanded ? 'Collapse' : `Show ${episodes.length - INITIAL_COUNT} more`}
              </span>
              <span style={{ ...T.label, color: PALETTE.black, opacity: 0.45 }}>
                {expanded ? '↑' : '↓'}
              </span>
            </button>
          )}
        </>
      )}

      {episodes.length > 0 && (
        <a
          href={readFullUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...linkStyle, display: 'inline-block', marginTop: SPACING.md }}
        >
          {isSpotify ? 'Open on Spotify ->' : 'Open channel ->'}
        </a>
      )}
    </div>
  )
}
