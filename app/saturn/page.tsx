'use client'

import { useCallback, useEffect, useState } from 'react'
import * as THREE from 'three'
import { SaturnNavbar } from './components/SaturnNavbar'
import SaturnScene from '../components/SaturnScene'
import FlightControls from '../components/FlightControls'

export default function SaturnPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [resetOrbit, setResetOrbit] = useState<(() => void) | null>(null)
  const [isGamePortalOpen, setIsGamePortalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<'orbit' | 'flight'>('orbit')

  useEffect(() => {
    document.documentElement.setAttribute('data-saturn', 'true')
    return () => document.documentElement.removeAttribute('data-saturn')
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleGameSelected = (gameName: string) => {
    if (gameName === 'orbit') {
      setActiveMode('orbit')
      setIsGamePortalOpen(false)
      setSelectedGame(null)
    } else if (gameName === 'flight') {
      setActiveMode('flight')
      setIsGamePortalOpen(false)
      setSelectedGame(null)
    } else {
      setActiveMode('orbit')
      setSelectedGame(gameName)
      setIsGamePortalOpen(true)
    }
  }

  const handleSceneReady = useCallback((_: THREE.PerspectiveCamera, orbReset: () => void) => {
    setResetOrbit(() => orbReset)
  }, [])

  return (
    <>
      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
        html, body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 600px) {
          iframe[title="Game Portal"] {
            width: 333px !important;
            height: 600px !important;
          }
        }
        @media (min-width: 601px) and (max-width: 999px) {
          iframe[title="Game Portal"] {
            width: 333px !important;
            height: 600px !important;
          }
        }
        @media (min-width: 1000px) {
          iframe[title="Game Portal"] {
            width: 333px !important;
            height: 600px !important;
          }
        }
      `}</style>
      <div
        data-saturn="true"
        suppressHydrationWarning
        style={{
          minHeight: '100vh',
          backgroundColor: '#0B0820',
          position: 'relative',
          overflowX: 'hidden',
          paddingBottom: isMobile && activeMode !== 'flight' ? '550px' : '0',
        }}
      >
        <SaturnNavbar onResetOrbit={resetOrbit || undefined} onGameSelected={handleGameSelected} />

        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <SaturnScene
            mode={activeMode}
            isInteractive={true}
            isMobile={isMobile}
            isGamePortalOpen={isGamePortalOpen}
            onSceneReady={handleSceneReady}
          />
        </div>

        {activeMode === 'flight' && <FlightControls isMobile={isMobile} />}

        {isGamePortalOpen && (
          <div
            style={{
              position: 'fixed',
              top: '140px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'auto',
              background: 'transparent',
            }}
          >
            <iframe
              src={selectedGame === 'oracle' ? '/oracle-portal.html' : selectedGame === 'tarot' ? '/game-model.html' : '/game-portal.html'}
              style={{
                width: selectedGame === 'tarot' ? '333px' : '500px',
                height: selectedGame === 'tarot' ? '600px' : '500px',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
                display: 'block',
                overflow: 'hidden',
              }}
              frameBorder="0"
              title="Game Portal"
              key={selectedGame}
            />
          </div>
        )}
      </div>
    </>
  )
}
