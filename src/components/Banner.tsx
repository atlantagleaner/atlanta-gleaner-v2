'use client'

import { useState } from 'react'
import { PALETTE, T } from '@/src/styles/tokens'

const WIKIPEDIA_FALLBACK =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_Washington_Statue_Federal_Hall_NYC.jpg/400px-George_Washington_Statue_Federal_Hall_NYC.jpg'

export function Banner() {
  const [imgSrc, setImgSrc] = useState('/washington.png')

  return (
    <header style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '113px 24px 83px',
    }}>
      <h1 style={{
        ...T.display,
        color: PALETTE.black,
        margin: '0 0 12px 0',
        textAlign: 'center',
        textShadow: '0 0 1px rgba(0,0,0,0.35)',
      }}>
        The Atlanta Gleaner.
      </h1>
      <p style={{
        ...T.nav,
        fontSize: '16px',
        letterSpacing: '0.30em',
        color: PALETTE.black,
        margin: '0 0 28px 0',
        textAlign: 'center',
      }}>
        Testing Testing Testing
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        onError={() => setImgSrc(WIKIPEDIA_FALLBACK)}
        alt="George Washington Statue at Federal Hall"
        style={{
          width: '520px',
          maxWidth: '90vw',
          display: 'block',
          objectFit: 'cover',
          objectPosition: 'center top',
        }}
      />
    </header>
  )
}
