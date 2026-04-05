'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — MirrorViewer
// ─────────────────────────────────────────────────────────────────────────────
// Renders a GleanResult inside the accordion drawer.
//
// type: 'mirror'  → Shadow DOM with cleaned article HTML + reader-mode CSS.
//                   Shadow DOM prevents the news site's CSS from bleeding into
//                   the Atlanta Gleaner layout.
//
// type: 'video'   → Clean YouTube <iframe> embed (modestbranding=1).
//                   Extracts ID from watch?v=, /shorts/, youtu.be/ patterns.
//
// The reader-mode stylesheet injected into the shadow root uses Inter + Cormorant
// to match the Atlanta Gleaner's typographic system, applied only inside the shadow.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef }  from 'react'
import type { GleanResult }   from '@/app/actions/glean'
import { PALETTE, PALETTE_CSS, T, SPACING, ANIMATION } from '@/src/styles/tokens'

// ── Reader-mode stylesheet injected into the Shadow Root ──────────────────────
// Uses Inter + Cormorant Garamond — already loaded globally via next/font.
// All rules are scoped inside the shadow root; nothing leaks out.

const READER_CSS = `
  :host {
    display: block;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.65;
    color: #1a1a1a;
  }
  *, *::before, *::after { box-sizing: border-box; }

  /* Responsive media */
  img, video, audio { max-width: 100%; height: auto; display: block; }
  figure { margin: 0 0 1em; }
  figcaption {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(0,0,0,0.45);
    margin-top: 6px;
  }

  /* Headings — Cormorant Garamond */
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 700;
    line-height: 1.15;
    margin: 0 0 0.6em;
  }
  h1 { font-size: clamp(1.4rem, 4vw, 2rem); }
  h2 { font-size: clamp(1.1rem, 3vw, 1.5rem); }
  h3 { font-size: 1.1rem; }
  h4, h5, h6 { font-size: 1rem; }

  /* Body copy */
  p { margin: 0 0 1em; }
  a { color: inherit; text-underline-offset: 2px; }
  a:hover { opacity: 0.7; }
  blockquote {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-size: 15px;
    border-left: 3px solid #1a1a1a;
    padding-left: 12px;
    margin: 0 0 1em;
  }
  ul, ol { padding-left: 1.4em; margin: 0 0 1em; }
  li { margin-bottom: 0.3em; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin: 0 0 1em; font-size: 13px; }
  th, td { padding: 6px 8px; border-bottom: 1px solid rgba(0,0,0,0.08); text-align: left; }
  th { font-weight: 600; }

  /* Hide structural chrome from the original site */
  nav, header, footer, aside,
  [role="navigation"], [role="banner"], [role="complementary"],
  [class*="nav-"], [class*="header-"], [class*="footer-"],
  [class*="sidebar"], [class*="related"], [class*="recommend"],
  [class*="comment"], [class*="social"], [class*="share"],
  [class*="subscribe"], [class*="newsletter"], [class*="paywall"],
  [class*="cookie"], [id*="cookie"], [class*="popup"],
  [class*="promo"], [class*="ad-"], [class*="-ad"] {
    display: none !important;
  }
`

// ── Shadow DOM mirror ─────────────────────────────────────────────────────────

function MirrorFrame({ html, readFullUrl }: { html: string; readFullUrl: string }) {
  const hostRef   = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<ShadowRoot | null>(null)

  useEffect(() => {
    if (!hostRef.current) return

    // Attach shadow root once; update content on html changes
    if (!shadowRef.current) {
      shadowRef.current = hostRef.current.attachShadow({ mode: 'open' })
    }

    shadowRef.current.innerHTML = `<style>${READER_CSS}</style>${html}`
  }, [html])

  return (
    <div style={{ paddingBottom: SPACING.lg }}>
      {/* Shadow host */}
      <div ref={hostRef} style={{ overflowX: 'hidden' }} />

      {/* Read full link */}
      <a
        href={readFullUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...T.micro,
          display:        'inline-block',
          marginTop:      SPACING.md,
          color:          PALETTE.black,
          textDecoration: 'none',
          borderBottom:   `1px solid ${PALETTE.black}`,
          paddingBottom:  '1px',
        }}
      >
        Read Full →
      </a>
    </div>
  )
}

// ── YouTube embed ─────────────────────────────────────────────────────────────

function VideoEmbed({
  videoId,
  title,
  source,
  readFullUrl,
}: {
  videoId:     string | null
  title:       string
  source:      string
  readFullUrl: string
}) {
  if (!videoId) {
    // Spotify or unknown video — fall back to a plain link
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
            color:          PALETTE.black,
            textDecoration: 'none',
            borderBottom:   `1px solid ${PALETTE.black}`,
            paddingBottom:  '1px',
          }}
        >
          Watch →
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
          position:      'relative',
          width:         '100%',
          paddingBottom: '56.25%',  // 16:9
          overflow:      'hidden',
          marginBottom:  SPACING.md,
          background:    'var(--palette-warm)',
        }}
      >
        <iframe
          src={embedSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            inset:    0,
            width:    '100%',
            height:   '100%',
            border:   'none',
          }}
        />
      </div>

      <p style={{ ...T.micro, color: PALETTE_CSS.meta, margin: 0 }}>{source}</p>
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export function MirrorViewer({ result }: { result: GleanResult }) {
  if (result.type === 'video') {
    return (
      <VideoEmbed
        videoId={result.videoId}
        title={result.title}
        source={result.source}
        readFullUrl={result.readFullUrl}
      />
    )
  }

  return (
    <MirrorFrame
      html={result.html}
      readFullUrl={result.readFullUrl}
    />
  )
}
