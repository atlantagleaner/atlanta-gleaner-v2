'use client'

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
  source,
  episodes,
  readFullUrl,
}: {
  title: string
  source: string
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

      <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: `0 0 ${SPACING.md}` }}>
        {source}
      </p>

      {!episodes.length ? (
        <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>
          No recent uploads were found.
        </p>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {episodes.map((episode, index) => (
            <li
              key={episode.videoId}
              style={{
                display: 'grid',
                gridTemplateColumns: '112px 1fr',
                gap: SPACING.md,
                alignItems: 'start',
                borderTop: `1px solid var(--palette-rule)`,
                paddingTop: SPACING.md,
                marginTop: index === 0 ? 0 : SPACING.md,
              }}
            >
              <a
                href={episode.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textDecoration: 'none' }}
              >
                <img
                  src={episode.thumbnailUrl}
                  alt={episode.title}
                  loading="eager"
                  decoding="async"
                  style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    objectFit: 'cover',
                    display: 'block',
                    border: `1px solid var(--palette-black)`,
                    background: 'var(--palette-warm)',
                  }}
                />
              </a>

              <div>
                <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: `0 0 ${SPACING.xs}` }}>
                  #{index + 1} | {episode.publishedAt || 'Recently published'}
                </p>
                <p style={{ ...T.body, margin: `0 0 ${SPACING.xs}` }}>
                  <a
                    href={episode.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: PALETTE.black, textDecoration: 'none' }}
                  >
                    {episode.title}
                  </a>
                </p>
                <a
                  href={episode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  {'Watch on YouTube ->'}
                </a>
              </div>
            </li>
          ))}
        </ol>
      )}

      <a
        href={readFullUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...linkStyle, display: 'inline-block', marginTop: SPACING.md }}
      >
        {'Open channel ->'}
      </a>
    </div>
  )
}
