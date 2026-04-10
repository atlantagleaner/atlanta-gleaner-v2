'use client'

import React, { useEffect, useState } from 'react'
import EventHorizonScene, { OrbitalVideo } from '@/src/components/EventHorizonScene'

// --- Constants & Data ---

const ORBITAL_VIDEOS: OrbitalVideo[] = [
  { id: 'video0', title: 'Track 1', youtubeId: '-l6wrTvMcbY', angle: 0 },
  { id: 'video1', title: 'Track 2', youtubeId: 'jtTjzDTpx8o', angle: 60 },
  { id: 'video2', title: 'Track 3', youtubeId: 'Tg9cN2A7-cA', angle: 120 },
  { id: 'video3', title: 'Track 4', youtubeId: '_GT9SmA1vlI', angle: 180 },
  { id: 'video4', title: 'Track 5', youtubeId: '-W20dfeNCmI', angle: 240 },
  { id: 'video5', title: 'Track 6', youtubeId: '9Y4wk-J3x7w', angle: 300 }
]

// --- Main Orbital Page Component ---

export default function OrbitalPage() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatMonth = (date: Date) => date.toLocaleString('en-US', { month: 'long' }).toUpperCase()
  const formatDay = (date: Date) => date.getDate().toString().padStart(2, '0')
  const formatYear = (date: Date) => date.getFullYear()
  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' }).toUpperCase()

  const handleFlyTo = (id: string) => {
    document.dispatchEvent(new CustomEvent('flyTo', { detail: { targetId: id } }))
  }

  const navItemStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '100px',
    padding: '10px 24px',
    color: '#FFF',
    fontSize: '11px',
    letterSpacing: '0.15em',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    fontFamily: 'var(--font-mono), monospace'
  }

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#020101', overflow: 'hidden', position: 'relative' }}>
      {/* Orbital Nav Bar */}
      <nav style={{
        position: 'fixed',
        top: '25px',
        left: '25px',
        right: '25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Back/Metadata Hybrid Button */}
          <div style={navItemStyle} onClick={() => window.history.back()}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
              <span style={{ fontWeight: 600 }}>{formatMonth(time)} {formatDay(time)}, {formatYear(time)}</span>
              <span style={{ opacity: 0.4, fontSize: '9px' }}>{formatTime(time)}</span>
            </div>
            
            <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.2)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
              <span style={{ fontWeight: 800, color: '#ffb347' }}>ORBITAL — EVENT HORIZON</span>
              <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>THE ATLANTA GLEANER • EDITED BY GEORGE WASHINGTON</span>
            </div>
          </div>

          <button 
            onClick={() => handleFlyTo('overview')} 
            style={{ ...navItemStyle, background: 'rgba(255, 165, 0, 0.08)', borderColor: 'rgba(255, 165, 0, 0.2)' }}
          >
            RESET VIEW
          </button>
        </div>

        {/* Track Selectors */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {ORBITAL_VIDEOS.map((v, i) => (
            <button 
              key={v.id} 
              onClick={() => handleFlyTo(v.id)} 
              style={{ ...navItemStyle, padding: '10px 16px', minWidth: '42px', justifyContent: 'center' }}
            >
              {i + 1}
            </button>
          ))}
          <button style={{ ...navItemStyle, padding: '10px 16px', background: 'rgba(255,255,255,0.08)' }}>
            +
          </button>
        </div>
      </nav>

      {/* Main 3D Canvas Layer */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <EventHorizonScene videos={ORBITAL_VIDEOS} />
      </div>

      {/* Aesthetic Overlay: Subtle Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        zIndex: 5
      }} />
    </div>
  )
}
