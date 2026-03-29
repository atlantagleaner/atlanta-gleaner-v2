'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FarSideBox — Roll-C panel. One comic strip.
// Future: wire `imageUrl` and `caption` from Supabase
// ─────────────────────────────────────────────────────────────────────────────

import { type CSSProperties } from 'react'
import { PALETTE, T, BOX_SHELL, BOX_HEADER, BOX_PADDING } from '@/src/styles/tokens'

interface FarSideBoxProps {
  imageUrl?: string
  caption?:  string
  style?:    CSSProperties
}

export function FarSideBox({
  imageUrl,
  caption = '"Suddenly, Ted remembered he had left the primordial soup on."',
  style,
}: FarSideBoxProps) {
  return (
    // FIX: Changed height from '100%' to 'fit-content' so the module hugs its content.
    <div style={{ height: 'fit-content', ...style }}>
      {/* Ensure your BOX_SHELL in tokens.ts is also set to height: 'fit-content' */}
      <div style={BOX_SHELL}>
        <div style={{ padding: BOX_PADDING, display: 'flex', flexDirection: 'column' }}>

          {/* Section header — BOX_HEADER */}
          <h2 style={BOX_HEADER}>The Far Side</h2>

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
            /* Placeholder — warm background, film-frame icon */
            <div style={{
              border:          '1px solid rgba(0,0,0,0.10)',
              width:           '100%',
              aspectRatio:     '1 / 1',
              display:         'flex',
              flexDirection:   'column',
              justifyContent:  'center',
              alignItems:      'center',
              padding:         '20px',
              background:      PALETTE.warm,
            }}>
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                style={{ width: '40px', height: '40px', color: PALETTE.black, marginBottom: '12px' }}
                strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter"
              >
                <rect x="2" y="2" width="20" height="20" />
                <rect x="2"  y="2"  width="3" height="3" fill="currentColor" />
                <rect x="2"  y="7"  width="3" height="3" fill="currentColor" />
                <rect x="2"  y="12" width="3" height="3" fill="currentColor" />
                <rect x="2"  y="17" width="3" height="3" fill="currentColor" />
                <rect x="19" y="2"  width="3" height="3" fill="currentColor" />
                <rect x="19" y="7"  width="3" height="3" fill="currentColor" />
                <rect x="19" y="12" width="3" height="3" fill="currentColor" />
                <rect x="19" y="17" width="3" height="3" fill="currentColor" />
                <circle cx="9" cy="9" r="1.5" />
                <polyline points="22 16 17 11 6 22" />
              </svg>
              {/* Placeholder label — T.micro */}
              <p style={{ ...T.micro, color: PALETTE.black, margin: 0, textAlign: 'center' }}>
                [ Comic Awaiting Scan ]
              </p>
            </div>
          )}

          {/* Caption — T.caption */}
          {caption && (
            <p style={{
              ...T.caption,
              color:      PALETTE.black,
              textAlign:  'center',
              marginTop:  '16px',
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
