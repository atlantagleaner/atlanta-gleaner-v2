'use client'

import { useState } from 'react'
import type { GleanResult } from '@/app/actions/glean'
import { PALETTE, PALETTE_CSS, T, SPACING, ANIMATION, ITEM_RULE } from '@/src/styles/tokens'

const COLLAPSE_WORD_THRESHOLD = 1200

const READER_BODY_CSS = `
  .ag-reader-body p { 
    margin: 0 0 1.1em; 
    line-height: 1.72;
  }
  .ag-reader-body > :first-child {
    margin-top: 0 !important;
  }
  .ag-reader-body h2,
  .ag-reader-body h3,
  .ag-reader-body h4 {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    line-height: 1.12;
    margin: 1.5em 0 0.6em;
    color: var(--palette-black);
  }
  .ag-reader-body h2 { font-size: 1.6rem; }
  .ag-reader-body h3 { font-size: 1.3rem; }
  .ag-reader-body h4 { font-size: 1.1rem; }
  .ag-reader-body a {
    color: inherit;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
    text-decoration-color: var(--palette-rule-md);
  }
  .ag-reader-body blockquote {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
    font-style: italic;
    line-height: 1.55;
    margin: 1.5em 0;
    padding: 0.2em 0 0.2em 20px;
    border-left: 3px solid var(--palette-black);
    color: var(--palette-black);
  }
  .ag-reader-body ul,
  .ag-reader-body ol {
    margin: 0 0 1.2em;
    padding-left: 1.5em;
  }
  .ag-reader-body li { 
    margin-bottom: 0.5em;
    line-height: 1.6;
  }
  .ag-reader-body p:empty { display: none; }
`

function stripMediaFromLegacyReaderHtml(bodyHtml: string): string {
  return bodyHtml
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, '')
}

function ReaderFrame({ result }: { result: Extract<GleanResult, { type: 'reader' }> }) {
  const { document } = result
  const isLong = document.wordCount >= COLLAPSE_WORD_THRESHOLD
  const [expanded, setExpanded] = useState(!isLong)
  const [mode, setMode] = useState<'reader' | 'pictures'>('reader')
  const images = Array.isArray(document.images) ? document.images : []
  const readerBodyHtml = stripMediaFromLegacyReaderHtml(document.bodyHtml)

  const tabButtonStyle = (active: boolean) => ({
    ...T.label,
    color: active ? PALETTE.black : PALETTE_CSS.meta,
    border: 'none',
    background: 'none',
    padding: `${SPACING.xs} 0`,
    cursor: 'pointer',
    transition: `color ${ANIMATION.base} ${ANIMATION.ease}`,
    borderBottom: active ? `1.5px solid ${PALETTE.black}` : '1.5px solid transparent',
  } as const)

  return (
    <article style={{ padding: `0 0 ${SPACING.lg}`, maxWidth: '700px', margin: '0 auto' }}>
      <style>{READER_BODY_CSS}</style>

      {/* ── Metadata Notice Block ────────────────────────────────────────── */}
      <div style={{
        background: PALETTE.warm,
        borderLeft: `3px solid ${PALETTE.black}`,
        padding: `${SPACING.md} ${SPACING.lg}`,
        margin: `${SPACING.md} 0 ${SPACING.xl}`,
      }}>
        <div style={{ ...T.micro, color: PALETTE_CSS.meta, marginBottom: SPACING.xs }}>
          {document.source}
        </div>
        <h1 style={{ 
          ...FONT.serif, 
          fontSize: '1.8rem', 
          fontWeight: 700, 
          lineHeight: 1.1, 
          margin: `0 0 ${SPACING.sm}`,
          color: PALETTE.black 
        }}>
          {document.title}
        </h1>
        {document.byline && (
          <div style={{ ...T.label, color: PALETTE.black }}>
            {document.byline}
          </div>
        )}
      </div>

      <header style={{ marginBottom: SPACING.lg }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: SPACING.xl,
            paddingBottom: SPACING.xs,
            borderBottom: `1px solid ${PALETTE_CSS.rule}`,
          }}
        >
          <button
            type="button"
            onClick={() => setMode('reader')}
            style={tabButtonStyle(mode === 'reader')}
          >
            Article
          </button>
          <button
            type="button"
            onClick={() => setMode('pictures')}
            style={tabButtonStyle(mode === 'pictures')}
          >
            Gallery
          </button>
        </div>
      </header>

      {mode === 'reader' ? (
        <>
          <section
            style={{
              position: 'relative',
              overflow: 'hidden',
              maxHeight: expanded ? 'none' : '1000px',
              transition: 'max-height 0.5s ease',
              padding: `0 0 ${SPACING.xl}`,
              userSelect: 'text',
            }}
          >
            <div
              className="ag-reader-body"
              style={{
                ...T.prose,
                color: PALETTE.black,
              }}
              dangerouslySetInnerHTML={{ __html: readerBodyHtml }}
            />

            {!expanded && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '150px',
                  background: `linear-gradient(to bottom, transparent, ${PALETTE.white})`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </section>

          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              style={{
                width: '100%',
                background: 'none',
                border: `1px solid ${PALETTE_CSS.ruleMd}`,
                padding: `${SPACING.sm} ${SPACING.md}`,
                cursor: 'pointer',
                ...T.label,
                color: PALETTE.black,
                marginTop: SPACING.md,
                textAlign: 'center',
              }}
            >
              {expanded ? 'Show Less' : 'Continue Reading'}
            </button>
          )}
        </>
      ) : (
        <section
          style={{
            display: 'grid',
            gap: SPACING.xl,
            paddingBottom: SPACING.xl,
          }}
        >
          {images.length > 0 ? (
            images.map((image) => (
              <figure key={image.src} style={{ margin: 0 }}>
                <div style={{ background: PALETTE.warm, padding: SPACING.xs, border: `1px solid ${PALETTE_CSS.ruleSm}` }}>
                  <img
                    src={image.src}
                    alt={image.alt || document.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      display: 'block',
                    }}
                  />
                </div>
                {(image.caption || image.alt) && (
                  <figcaption style={{ 
                    ...T.micro, 
                    color: PALETTE_CSS.meta, 
                    marginTop: SPACING.sm,
                    paddingLeft: SPACING.xs,
                    borderLeft: `1px solid ${PALETTE_CSS.ruleMd}`
                  }}>
                    {image.caption || image.alt}
                  </figcaption>
                )}
              </figure>
            ))
          ) : (
            <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>
              No pictures were extracted from this article.
            </p>
          )}
        </section>
      )}

      {/* ── Colophon ─────────────────────────────────────────────────────── */}
      <footer style={{ 
        marginTop: SPACING.xxl, 
        paddingTop: SPACING.lg, 
        borderTop: `1px solid ${PALETTE_CSS.rule}` 
      }}>
        <a
          href={document.readFullUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...T.micro,
            color: PALETTE_CSS.meta,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
          }}
        >
          <span>Source: {new URL(document.readFullUrl).hostname}</span>
          <span style={{ fontSize: '12px' }}>↗</span>
        </a>
      </footer>
    </article>
  )
}
    </article>
  )
}

function VideoEmbed({
  videoId,
  title,
  source,
  readFullUrl,
}: Extract<GleanResult, { type: 'video' }>) {
  if (!videoId) {
    return (
      <div style={{ padding: `${SPACING.md} 0 ${SPACING.lg}` }}>
        <p style={{ ...T.body, margin: `0 0 ${SPACING.sm}` }}>{title}</p>
        <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: `0 0 ${SPACING.md}` }}>{source}</p>
        <a
          href={readFullUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...T.micro,
            color: PALETTE.black,
            textDecoration: 'none',
          }}
        >
          {'Watch ->'}
        </a>
      </div>
    )
  }

  const embedSrc =
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    `?modestbranding=1&rel=0&showinfo=0`

  return (
    <div style={{ padding: `0 0 ${SPACING.lg}` }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          overflow: 'hidden',
          marginBottom: SPACING.md,
          background: 'var(--palette-warm)',
        }}
      >
        <iframe
          src={embedSrc}
          title={title}
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

      <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>{source}</p>
    </div>
  )
}

export function MirrorViewer({ result }: { result: GleanResult }) {
  if (result.type === 'video') {
    return <VideoEmbed {...result} />
  }

  return <ReaderFrame result={result} />
}
