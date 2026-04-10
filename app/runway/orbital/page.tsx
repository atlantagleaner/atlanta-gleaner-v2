'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import EventHorizonScene from '@/src/components/EventHorizonScene'

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

export default function OrbitalPage() {
  const [showMenu, setShowMenu] = useState(false)

  const handleVideoSelect = (videoId: string) => {
    const event = new CustomEvent('flyTo', { detail: { targetId: videoId } })
    document.dispatchEvent(event)
  }

  // Button styling for the top nav
  const navButtonStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(238, 237, 235, 0.15)',
    color: '#FFFFFF',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  }

  const iconButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#FFFFFF',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '24px',
    transition: 'opacity 0.2s',
  }

  return (
    <>
      {/* Custom Top Navigation */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(2, 1, 1, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(238, 237, 235, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 1000,
        }}
      >
        {/* Time button - goes to landing page */}
        <Link
          href="/"
          style={{
            ...navButtonStyle,
            display: 'inline-block',
            textDecoration: 'none',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(238, 237, 235, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          ← Back
        </Link>

        {/* Track controls - center */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flex: 1,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => handleVideoSelect('overview')}
            style={{
              ...navButtonStyle,
              padding: '8px 12px',
              fontSize: '11px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Event Horizon
          </button>

          {ORBITAL_VIDEOS.map((video) => (
            <button
              key={video.id}
              onClick={() => handleVideoSelect(video.id)}
              style={{
                ...navButtonStyle,
                padding: '8px 12px',
                fontSize: '11px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {video.title}
            </button>
          ))}
        </div>

        {/* Menu button - right */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={iconButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          +
        </button>
      </nav>

      {/* 3D Scene - below nav */}
      <div
        style={{
          marginTop: '60px',
          flex: 1,
          width: '100%',
          height: 'calc(100vh - 60px)',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <EventHorizonScene videos={ORBITAL_VIDEOS} showTitles={true} onVideoSelect={handleVideoSelect} />
      </div>

      {/* Site Menu - TODO: implement menu content */}
      {showMenu && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            right: '20px',
            background: 'rgba(2, 1, 1, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(238, 237, 235, 0.1)',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '200px',
            zIndex: 999,
            color: '#EEEDEB',
          }}
        >
          <p style={{ margin: 0, opacity: 0.6, fontSize: '12px' }}>Site Menu</p>
        </div>
      )}
    </>
  )
}
