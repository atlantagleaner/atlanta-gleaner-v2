'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Banner — masthead shown on the homepage
// Future Solito: portable as-is (inline styles, no web-only APIs)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react'

const WIKIPEDIA_FALLBACK =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_Washington_Statue_Federal_Hall_NYC.jpg/400px-George_Washington_Statue_Federal_Hall_NYC.jpg'

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" }

export function Banner() {
  const [imgSrc, setImgSrc] = useState('/washington.png')

  return (
    <header style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '48px 24px 36px',
      borderBottom: '1px solid rgba(0,0,0,0.10)',
    }}>
      {/* Dateline */}
      <p style={{
        ...mono,
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.30em',
        color: '#888',
        marginBottom: '14px',
        textAlign: 'center',
      }}>
        Georgia Case Law Updates and Legal News
      </p>

      {/* Masthead title */}
      <h1 style={{
        ...serif,
        fontSize: 'clamp(3rem, 10vw, 7rem)',
        fontWeight: 700,
        letterSpacing: '-0.03em',
        lineHeight: 0.95,
        color: '#0A0A0A',
        margin: '0 0 10px 0',
        textAlign: 'center',
        textShadow: '0 0 1px rgba(0,0,0,0.35)',
      }}>
        The Atlanta Gleaner.
      </h1>

      {/* Byline */}
      <p style={{
        ...mono,
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.20em',
        color: '#999',
        marginBottom: '28px',
        textAlign: 'center',
      }}>
        Edited By George Washington
      </p>

      {/* Portrait */}
      <div style={{
        width: '108px',
        border: '1px solid rgba(0,0,0,0.12)',
        padding: '3px',
        background: '#fff',
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          onError={() => setImgSrc(WIKIPEDIA_FALLBACK)}
          alt="George Washington Statue at Federal Hall"
          style={{
            width: '100%',
            height: '135px',
            objectFit: 'cover',
            objectPosition: 'top',
            display: 'block',
            filter: 'grayscale(100%) contrast(160%) brightness(1.15)',
            mixBlendMode: 'multiply',
          }}
        />
      </div>

      {/* Edition rule */}
      <div style={{
        marginTop: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        maxWidth: '520px',
      }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.15)' }} />
        <span style={{
          ...mono,
          fontSize: '9px',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          color: '#aaa',
          whiteSpace: 'nowrap',
        }}>
          Vol. II · March 2026 · Atlanta, Georgia
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.15)' }} />
      </div>
    </header>
  )
}
