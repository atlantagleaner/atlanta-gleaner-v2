'use client'

import { useState } from 'react'
import type { GleanResult } from '@/app/actions/glean'
import { PALETTE, PALETTE_CSS, T, SPACING, ANIMATION, ITEM_RULE } from '@/src/styles/tokens'

const COLLAPSE_WORD_THRESHOLD = 1200

const READER_BODY_CSS = `
  .ag-reader-body p { margin: 0 0 1.05em; }
  .ag-reader-body > :first-child {
    margin-top: 0 !important;
  }
  .ag-reader-body h2,
  .ag-reader-body h3,
  .ag-reader-body h4 {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    line-height: 1.15;
    margin: 1.2em 0 0.55em;
  }
  .ag-reader-body h2 { font-size: 1.45rem; }
  .ag-reader-body h3 { font-size: 1.2rem; }
  .ag-reader-body h4 { font-size: 1rem; }
  .ag-reader-body a {
    color: inherit;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
  }
  .ag-reader-body blockquote {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem;
    font-style: italic;
    line-height: 1.5;
    margin: 0 0 1em;
    padding-left: 14px;
    border-left: 3px solid var(--palette-black);
  }
  .ag-reader-body ul,
  .ag-reader-body ol {
    margin: 0 0 1em;
    padding-left: 1.4em;
  }
  .ag-reader-body li { margin-bottom: 0.35em; }
  .ag-reader-body figure { margin: 0 0 1.1em; }
  .ag-reader-body p:empty,
  .ag-reader-body div:empty,
  .ag-reader-body section:empty,
  .ag-reader-body article:empty,
  .ag-reader-body li:empty,
  .ag-reader-body blockquote:empty {
    display: none;
  }
  .ag-reader-body img {
    width: 100%;
    height: auto;
    display: block;
    border: 1px solid var(--palette-rule);
    background: var(--palette-warm);
  }
  .ag-reader-body figcaption {
    margin-top: 6px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--palette-meta);
  }
  .ag-reader-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 1em;
    font-size: 13px;
  }
  .ag-reader-body th,
  .ag-reader-body td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--palette-rule);
    text-align: left;
  }
`

function ReaderFrame({ result }: { result: Extract<GleanResult, { type: 'reader' }> }) {
  const { document } = result
  const isLong = document.wordCount >= COLLAPSE_WORD_THRESHOLD
  const [expanded, setExpanded] = useState(!isLong)

  return (
    <article style={{ paddingBottom: SPACING.lg }}>
      <style>{READER_BODY_CSS}</style>

      <header
        style={{
          padding: `${SPACING.md} 0 ${SPACING.lg}`,
          borderBottom: '1px solid var(--palette-rule)',
        }}
      >
        <p style={{ ...T.label, color: PALETTE.black, margin: `0 0 ${SPACING.sm}` }}>
          Reader View
        </p>

        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(1.4rem, 3.8vw, 2rem)',
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: '-0.01em',
            color: PALETTE.black,
            margin: `0 0 ${SPACING.sm}`,
          }}
        >
          {document.title}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${SPACING.xs} ${SPACING.md}` }}>
          <span style={{ ...T.micro, color: PALETTE_CSS.meta }}>{document.source}</span>
          {document.byline && <span style={{ ...T.micro, color: PALETTE_CSS.meta }}>By {document.byline}</span>}
          {document.publishedAt && (
            <span style={{ ...T.micro, color: PALETTE_CSS.meta }}>{document.publishedAt}</span>
          )}
        </div>

        {document.excerpt && (
          <p style={{ ...T.prose, color: PALETTE.black, margin: `${SPACING.md} 0 0` }}>
            {document.excerpt}
          </p>
        )}
      </header>

      {document.heroImageUrl && (
        <figure style={{ margin: `${SPACING.lg} 0` }}>
          <img
            src={document.heroImageUrl}
            alt={document.heroImageAlt || document.title}
            loading="lazy"
            style={{
              width: '100%',
              display: 'block',
              border: '1px solid var(--palette-rule)',
              background: 'var(--palette-warm)',
            }}
          />
          {document.heroImageAlt && (
            <figcaption style={{ ...T.micro, color: PALETTE_CSS.meta, marginTop: SPACING.xs }}>
              {document.heroImageAlt}
            </figcaption>
          )}
        </figure>
      )}

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          maxHeight: expanded ? '9000px' : '900px',
          transition: expanded ? 'max-height 0.55s ease-in' : 'max-height 0.3s ease-out',
          padding: `0 0 ${SPACING.xl}`,
          userSelect: 'text',
          ...ITEM_RULE,
        }}
      >
        <div
          className="ag-reader-body"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            lineHeight: 1.72,
            color: PALETTE.black,
          }}
          dangerouslySetInnerHTML={{ __html: document.bodyHtml }}
        />

        {isLong && (
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
              opacity: expanded ? 0 : 1,
              transition: `opacity ${expanded ? '0.1s' : '0.25s'} ${ANIMATION.ease}`,
            }}
          />
        )}
      </section>

      {isLong && (
        <button
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          style={{
            width: '100%',
            background: PALETTE.white,
            border: 'none',
            borderTop: expanded ? '1px solid var(--palette-rule)' : 'none',
            padding: `${SPACING.md} 0`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: `border-color ${ANIMATION.base} ${ANIMATION.ease}`,
          }}
        >
          <span style={{ ...T.label, color: PALETTE.black }}>
            {expanded ? 'Collapse' : 'Read Full Article'}
          </span>
          <span style={{ ...T.label, color: PALETTE.black, opacity: 0.45 }}>
            {expanded ? '^' : 'v'}
          </span>
        </button>
      )}

      <a
        href={document.readFullUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...T.micro,
          display: 'inline-block',
          marginTop: SPACING.md,
          color: PALETTE.black,
          textDecoration: 'none',
          borderBottom: `1px solid ${PALETTE.black}`,
          paddingBottom: '1px',
        }}
      >
        {'Read Full ->'}
      </a>
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
            borderBottom: `1px solid ${PALETTE.black}`,
            paddingBottom: '1px',
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
    <div style={{ padding: `${SPACING.md} 0 ${SPACING.lg}` }}>
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
