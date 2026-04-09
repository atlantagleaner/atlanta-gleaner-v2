'use client'

import { useState, useRef, useEffect } from 'react'
import { PALETTE, T, SPACING } from '@/src/styles/tokens'
import { useMobileDetect } from '@/src/hooks'

const WIKIPEDIA_FALLBACK =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_Washington_Statue_Federal_Hall_NYC.jpg/400px-George_Washington_Statue_Federal_Hall_NYC.jpg'

// ── Theme cycling Easter egg ──────────────────────────────────────────────────
// Clicking the Washington logo cycles site-wide color palettes via the
// [data-theme] attribute on <html>. Resets on page refresh (ephemeral by design).

const THEMES = ['default', 'classical', 'matrix'] as const
type Theme = typeof THEMES[number]

const TAGLINE_STYLE = {
  ...T.nav,
  fontSize: 'clamp(0.85rem, 2.5vw, 1.2rem)',
  color: PALETTE.black,
  margin: 0,
  textAlign: 'center' as const,
}

export function Banner() {
  const [imgSrc,    setImgSrc]    = useState('/washington.png')
  const [logoHover, setLogoHover] = useState(false)
  const [isSaturn,  setIsSaturn]  = useState(false)
  const isMobile = useMobileDetect(768)
  const themeIdx = useRef(0)

  useEffect(() => {
    // Check if we're inside a Saturn page container
    const checkSaturn = () => {
      setIsSaturn(document.querySelector('[data-saturn]') !== null)
    }

    checkSaturn()

    // Listen for DOM changes that might add/remove the Saturn container
    const observer = new MutationObserver(checkSaturn)
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-saturn'] })

    return () => observer.disconnect()
  }, [])

  function cycleTheme() {
    // Don't cycle theme if we're on Saturn page
    if (document.querySelector('[data-saturn]')) return
    const html = document.documentElement

    themeIdx.current = (themeIdx.current + 1) % THEMES.length
    const next = THEMES[themeIdx.current]
    if (next === 'default') {
      html.removeAttribute('data-theme')
    } else {
      html.dataset.theme = next
    }
  }

  return (
    <header style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 'clamp(320px, 100vh - 200px, 600px)',
      padding: 'clamp(40px, 12vw, 113px) 24px clamp(40px, 12vw, 113px)',
    }}>
      <h1 style={{
        ...T.display,
        fontSize: 'clamp(3.22rem, 15.73vw, 8.58rem)',
        color: PALETTE.black,
        margin: '0 0 12px 0',
        textAlign: 'center',
        textShadow: '0 0 1px var(--palette-border)',
      }}>
        The Atlanta Gleaner.
      </h1>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: SPACING.sm,
        margin: `0 0 ${SPACING.xxl} 0`,
      }}>
        {isMobile ? (
          <>
            <p style={TAGLINE_STYLE}>Legal News &</p>
            <p style={TAGLINE_STYLE}>Georgia Case Law Updates</p>
          </>
        ) : (
          <p style={TAGLINE_STYLE}>Legal News & Georgia Case Law Updates</p>
        )}
        <p style={{
          ...T.nav,
          fontSize: 'clamp(0.85rem, 2.5vw, 1.2rem)',
          color: PALETTE.black,
          margin: 0,
          textAlign: 'center',
        }}>
          Edited By George Washington
        </p>
        <p style={{
          ...T.nav,
          fontSize: 'clamp(0.85rem, 2.5vw, 1.2rem)',
          color: PALETTE.black,
          margin: 0,
          textAlign: 'center',
        }}>
          (Testing in progress)
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        onError={() => setImgSrc(WIKIPEDIA_FALLBACK)}
        onClick={cycleTheme}
        onMouseEnter={() => setLogoHover(true)}
        onMouseLeave={() => setLogoHover(false)}
        alt="George Washington Statue at Federal Hall"
        style={{
          width:          '520px',
          maxWidth:       '90vw',
          display:        'block',
          objectFit:      'cover',
          objectPosition: 'center top',
          cursor:         'pointer',
          opacity:        isSaturn ? 0.75 : (logoHover ? 0.82 : 1),
          transition:     'opacity 0.15s',
        }}
      />
    </header>
  )
}