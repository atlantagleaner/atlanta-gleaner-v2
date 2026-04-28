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
  variant = 'default',
}: {
  title: string
  episodes: SeriesEpisode[]
  readFullUrl: string
  variant?: 'default' | 'glass'
}) {
  const isGlass = variant === 'glass'
  const linkStyle = {
    ...T.micro,
    color: isGlass ? '#FFB347' : PALETTE.black,
    textDecoration: 'none',
  } as const

  const [selectedId, setSelectedId] = useState<string | null>(
    episodes[0]?.spotifyId ?? episodes[0]?.videoId ?? null,
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
  const isSpotifyShow = !!selectedEpisode?.url?.includes('/show/')
  const embedSrc = selectedEpisode
    ? isSpotify
      ? isSpotifyShow
        ? `https://open.spotify.com/embed/show/${selectedEpisode.spotifyId}?utm_source=generator`
        : `https://open.spotify.com/embed/episode/${selectedEpisode.spotifyId}?utm_source=generator`
      : `https://www.youtube-nocookie.com/embed/${selectedEpisode.videoId}?modestbranding=1&rel=0`
    : null

  const INITIAL_COUNT = 3
  const isExpandable = episodes.length > INITIAL_COUNT
  const visibleEpisodes = expanded ? episodes : episodes.slice(0, INITIAL_COUNT)

  return (
    <div role="region" aria-label={title} style={{ padding: `0 0 ${SPACING.lg}` }}>
      {!selectedEpisode || !embedSrc ? (
        <p style={{ ...T.micro, color: isGlass ? 'rgba(255,255,255,0.5)' : PALETTE_CSS.meta, margin: 0 }}>
          No content found.
        </p>
      ) : (
        <>
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: isSpotify ? '0' : '56.25%',
              height: isSpotify ? '152px' : 'auto',
              overflow: 'hidden',
              marginBottom: SPACING.md,
              background: isGlass ? 'rgba(255,255,255,0.06)' : 'var(--palette-warm)',
              border: `1px solid ${isGlass ? 'rgba(255,255,255,0.12)' : 'var(--palette-rule)'}`,
              borderRadius: '18px',
              backdropFilter: isGlass ? 'blur(16px)' : undefined,
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
                background: 'transparent',
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
                      background: isGlass
                        ? isActive
                          ? 'rgba(255,179,71,0.12)'
                          : 'rgba(255,255,255,0.04)'
                        : isActive
                          ? 'var(--palette-subtle)'
                          : 'transparent',
                      border: `1px solid ${
                        isGlass
                          ? isActive
                            ? 'rgba(255,179,71,0.35)'
                            : 'rgba(255,255,255,0.12)'
                          : isActive
                            ? 'var(--palette-black)'
                            : 'var(--palette-rule)'
                      }`,
                      padding: SPACING.md,
                      cursor: 'pointer',
                      borderRadius: '16px',
                      color: isGlass ? '#FFF' : PALETTE.black,
                    }}
                  >
                    <p style={{ ...T.micro, color: isGlass ? 'rgba(255,255,255,0.52)' : PALETTE_CSS.meta, margin: `0 0 ${SPACING.xs}` }}>
                      {episodeMetaLine(episode)}
                    </p>
                    <p style={{ ...T.body, margin: `0 0 ${SPACING.xs}` }}>
                      <span style={{ color: isGlass ? '#FFF' : PALETTE.black }}>{episode.title}</span>
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
                  background: 'linear-gradient(to bottom, transparent, rgba(255, 179, 71, 0.22))',
                  pointerEvents: 'none',
                  opacity: 1,
                  transition: `opacity 0.25s ${ANIMATION.ease}`,
                }}
              />
            )}
          </div>

          {isExpandable && (
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderTop: expanded ? `1px solid ${isGlass ? 'rgba(255,255,255,0.12)' : 'var(--palette-rule)'}` : 'none',
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
              <span style={{ ...T.label, color: isGlass ? '#FFF' : PALETTE.black }}>
                {expanded ? 'Collapse' : `Show ${episodes.length - INITIAL_COUNT} more`}
              </span>
              <span style={{ ...T.label, color: isGlass ? '#FFF' : PALETTE.black, opacity: 0.45 }}>
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
          {isSpotify ? 'Open on Spotify →' : 'Open channel →'}
        </a>
      )}
    </div>
  )
}
