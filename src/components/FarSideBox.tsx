'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FarSideBox — Roll-C panel. One comic per publication date.
// Future: accept `imageUrl` and `caption` as props from Supabase
// ─────────────────────────────────────────────────────────────────────────────

import { type CSSProperties } from 'react'

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" }

interface FarSideBoxProps {
  imageUrl?: string
  caption?: string
  publishedDate?: string
  style?: CSSProperties
}

export function FarSideBox({
  imageUrl,
  caption = '"We\'ve updated our privacy policy, changed our terms of service, and eaten your family."',
  publishedDate,
  style,
}: FarSideBoxProps) {
  return (
    <div style={{ height: '100%', ...style }}>
      <div style={{ border: '1px solid rgba(0,0,0,0.18)', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Dark header bar */}
        <div style={{
          background: '#111',
          padding: '7px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ ...mono, fontSize: '9px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
            Roll&#x2011;C · The Far Side
          </span>
          <span style={{ ...mono, fontSize: '9px', color: '#444', letterSpacing: '0.1em' }}>IMG:01</span>
        </div>

        {/* Frame label */}
        <div style={{ background: 'rgba(0,0,0,0.025)', padding: '3px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
          <span style={{ ...mono, fontSize: '9px', color: '#bbb' }}>
            ▶ 01{publishedDate ? ` · ${publishedDate}` : ''}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{
            ...mono,
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            fontWeight: 700,
            borderBottom: '2px solid #000',
            paddingBottom: '7px',
            margin: '0 0 14px 0',
          }}>
            The Far Side
          </h2>

          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt="The Far Side comic"
              style={{
                width: '100%',
                border: '1px solid rgba(0,0,0,0.10)',
                display: 'block',
                filter: 'grayscale(20%) contrast(1.05)',
              }}
            />
          ) : (
            /* Placeholder when no image yet */
            <div style={{
              border: '1px solid rgba(0,0,0,0.10)',
              width: '100%',
              aspectRatio: '1 / 1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
              background: '#fafafa',
            }}>
              {/* Film frame icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                style={{ width: '40px', height: '40px', color: '#d1d5db', marginBottom: '12px' }}
                strokeWidth="1"
                strokeLinecap="square"
                strokeLinejoin="miter"
              >
                <rect x="2" y="2" width="20" height="20" />
                <rect x="2" y="2" width="3" height="3" fill="currentColor" />
                <rect x="2" y="7" width="3" height="3" fill="currentColor" />
                <rect x="2" y="12" width="3" height="3" fill="currentColor" />
                <rect x="2" y="17" width="3" height="3" fill="currentColor" />
                <rect x="19" y="2" width="3" height="3" fill="currentColor" />
                <rect x="19" y="7" width="3" height="3" fill="currentColor" />
                <rect x="19" y="12" width="3" height="3" fill="currentColor" />
                <rect x="19" y="17" width="3" height="3" fill="currentColor" />
                <circle cx="9" cy="9" r="1.5" />
                <polyline points="22 16 17 11 6 22" />
              </svg>
              <p style={{
                ...mono,
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#bbb',
                margin: 0,
                textAlign: 'center',
              }}>
                [ Comic Awaiting Scan ]
              </p>
            </div>
          )}

          {/* Caption */}
          {caption && (
            <p style={{
              ...serif,
              fontSize: '15px',
              fontStyle: 'italic',
              fontWeight: 600,
              color: '#333',
              textAlign: 'center',
              lineHeight: 1.55,
              marginTop: '16px',
              marginBottom: 0,
            }}>
              {caption}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
