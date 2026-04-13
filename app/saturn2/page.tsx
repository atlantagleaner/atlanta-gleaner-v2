'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameHub } from '../components/GameHub'
import SaturnScene from '../components/SaturnScene'

const games = [
  { id: 'tarot', name: 'TAROT READING', description: 'Past, Present, Future' },
  { id: 'astrology', name: 'ASTROLOGY', description: 'Daily Reading' },
  { id: 'sphere', name: 'CRYSTAL SPHERE', description: 'Fortunes' },
  { id: 'blackjack', name: 'BLACKJACK', description: 'Card Game' },
]

export default function Saturn2Page() {
  const [time, setTime] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)
  const [isGameHubOpen, setIsGameHubOpen] = useState(true)
  const [isGameHubPlaying, setIsGameHubPlaying] = useState(false)
  const [activeGame, setActiveGame] = useState(games[0])
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSceneReady = (camera: THREE.PerspectiveCamera) => {
    cameraRef.current = camera
  }

  const navItemStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px)',
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
    fontFamily: 'monospace',
    transition: 'all 0.2s ease',
    userSelect: 'none'
  }

  const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    marginTop: '8px',
    background: 'rgba(2, 1, 1, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 0',
    color: '#FFF',
    fontSize: '11px',
    letterSpacing: '0.15em',
    fontFamily: 'monospace',
    zIndex: 1100,
    minWidth: '180px'
  }

  const dropdownItemStyle: React.CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease',
  }

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#020101', overflow: 'auto', position: 'relative' }}>
      {/* Orbital Navbar - Identical to Runway */}
      {isMobile ? (
        // Mobile navbar - two rows
        <nav style={{
          position: 'fixed', top: '15px', left: '15px', right: '15px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1000,
        }}>
          {/* Row 1: Date/Time + The Atlanta Gleaner + Plus Button (merged) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {}}
              style={{ ...navItemStyle, textDecoration: 'none', border: 'none' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 600 }}>{time.toLocaleString('en-US', { month: 'short' }).toUpperCase()} {time.getDate()}</span>
                <span style={{ opacity: 0.4, fontSize: '9px' }}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>

              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>THE ATLANTA GLEANER</span>
                <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>EDITED BY GEORGE WASHINGTON</span>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                +
              </div>
            </button>
          </div>

          {/* Row 2: Game Hub Toggle */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => setIsGameHubOpen(!isGameHubOpen)} style={{ ...navItemStyle, background: 'rgba(255, 165, 0, 0.1)', borderColor: 'rgba(255, 165, 0, 0.3)' }}>
              GAME HUB
            </button>
          </div>
        </nav>
      ) : (
        // Desktop navbar
        <nav style={{
          position: 'fixed', top: '25px', left: '25px', right: '25px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000,
        }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Date/Time + Title + Plus Button (merged) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {}}
              style={{ ...navItemStyle, textDecoration: 'none', border: 'none' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 600 }}>{time.toLocaleString('en-US', { month: 'short' }).toUpperCase()} {time.getDate()}</span>
                <span style={{ opacity: 0.4, fontSize: '9px' }}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>

              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>THE ATLANTA GLEANER</span>
                <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>EDITED BY GEORGE WASHINGTON</span>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                +
              </div>
            </button>
          </div>

          <button onClick={() => setIsGameHubOpen(!isGameHubOpen)} style={{ ...navItemStyle, background: 'rgba(255, 165, 0, 0.1)', borderColor: 'rgba(255, 165, 0, 0.3)' }}>
            GAME HUB
          </button>
        </div>
      </nav>
      )}

      {/* 3D Scene Container */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <SaturnScene onSceneReady={handleSceneReady} isRadioHubOpen={isGameHubOpen} />
      </div>

      {/* Game Hub - Always mounted */}
      {isGameHubOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: isMobile ? '80px' : '0',
            animation: 'fadeIn 0.3s ease-out',
            pointerEvents: 'none'
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
          <div
            style={{
              maxWidth: isMobile ? '90vw' : '900px',
              width: '100%',
              maxHeight: isMobile ? '70vh' : '85vh',
              borderRadius: '32px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
              pointerEvents: 'auto'
            }}
          >
            <GameHub
              isMobile={isMobile}
              isUIVisible={true}
              isPlaying={isGameHubPlaying}
              activeGame={activeGame}
              onPlayToggle={() => setIsGameHubPlaying(!isGameHubPlaying)}
              onGameChange={setActiveGame}
            />
          </div>
        </div>
      )}

      {/* Aesthetic Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 6,
          background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.6) 100%)'
        }}
      />
    </div>
  )
}
