'use client'

import { Banner } from '@/src/components/Banner'
import EventHorizonScene from '@/src/components/EventHorizonScene'
import {
  FONT, T, PALETTE, PALETTE_CSS, SPACING,
  SIZE_SM, SIZE_MD, SIZE_LG, PAGE_MAX_W, PAGE_TITLE_BLOCK
} from '@/src/styles/tokens'

// Videos for the orbital scene
const ORBITAL_VIDEOS = [
  {
    id: 'video0',
    title: 'Track 1',
    youtubeId: '-l6wrTvMcbY',
    angle: 0
  },
  {
    id: 'video1',
    title: 'Track 2',
    youtubeId: 'jtTjzDTpx8o',
    angle: 60
  },
  {
    id: 'video2',
    title: 'Track 3',
    youtubeId: 'Tg9cN2A7-cA',
    angle: 120
  },
  {
    id: 'video3',
    title: 'Track 4',
    youtubeId: '_GT9SmA1vlI',
    angle: 180
  },
  {
    id: 'video4',
    title: 'Track 5',
    youtubeId: '-W20dfeNCmI',
    angle: 240
  },
  {
    id: 'video5',
    title: 'Track 6',
    youtubeId: '9Y4wk-J3x7w',
    angle: 300
  }
]

export default function OrbitalRunwayPage() {
  const handleFlyTo = (targetId: string) => {
    // Will be called by buttons; scene component will handle navigation
    const event = new CustomEvent('flyTo', { detail: { targetId } })
    document.dispatchEvent(event)
  }

  return (
    <>
      <Banner />
      <div style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: `0 ${SPACING.lg}` }}>
        <div style={{ ...PAGE_TITLE_BLOCK, marginTop: 0 }}>
          <h1 style={{ ...T.pageTitle, paddingTop: SPACING.xl, color: PALETTE.black, margin: 0 }}>
            Orbital
          </h1>
        </div>
      </div>

      {/* 3D Scene Container */}
      <div style={{
        width: '100%',
        height: '70vh',
        position: 'relative',
        background: PALETTE.black,
        marginBottom: SPACING.xxxl
      }}>
        <EventHorizonScene videos={ORBITAL_VIDEOS} />
      </div>

      {/* Navigation Controls */}
      <div style={{
        display: 'flex',
        gap: SPACING.lg,
        justifyContent: 'center',
        padding: `${SPACING.xl} ${SPACING.lg}`,
        flexWrap: 'wrap',
        maxWidth: PAGE_MAX_W,
        margin: '0 auto'
      }}>
        <button
          onClick={() => handleFlyTo('overview')}
          style={{
            ...navigationButtonStyle(),
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => applyButtonHover(e.currentTarget, true)}
          onMouseLeave={(e) => applyButtonHover(e.currentTarget, false)}
        >
          Event Horizon
        </button>
        {ORBITAL_VIDEOS.map(video => (
          <button
            key={video.id}
            onClick={() => handleFlyTo(video.id)}
            style={{
              ...navigationButtonStyle(),
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => applyButtonHover(e.currentTarget, true)}
            onMouseLeave={(e) => applyButtonHover(e.currentTarget, false)}
          >
            {video.title}
          </button>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          [data-orbital-scene] {
            height: 60vh;
          }
        }
      `}} />
    </>
  )
}

// Helper function for button styles using design tokens
function navigationButtonStyle(): React.CSSProperties {
  return {
    background: `rgba(var(--color-warm-rgb, 238 237 235), 0.08)`,
    border: `1px solid rgba(var(--color-warm-rgb, 238 237 235), 0.2)`,
    color: PALETTE.white,
    padding: `${SPACING.md} ${SPACING.lg}`,
    borderRadius: '24px',
    fontSize: SIZE_SM,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 0 10px rgba(238, 237, 235, 0)',
  } as React.CSSProperties
}

function applyButtonHover(btn: HTMLButtonElement, isHovering: boolean) {
  if (isHovering) {
    btn.style.background = `rgba(var(--color-warm-rgb, 238 237 235), 0.2)`
    btn.style.borderColor = `rgba(var(--color-warm-rgb, 238 237 235), 0.6)`
    btn.style.transform = 'translateY(-3px) scale(1.05)'
    btn.style.boxShadow = '0 10px 20px rgba(238, 237, 235, 0.15)'
  } else {
    btn.style.background = `rgba(var(--color-warm-rgb, 238 237 235), 0.08)`
    btn.style.borderColor = `rgba(var(--color-warm-rgb, 238 237 235), 0.2)`
    btn.style.transform = 'translateY(0) scale(1)'
    btn.style.boxShadow = '0 0 10px rgba(238, 237, 235, 0)'
  }
}
