'use client'

import { useEffect, useState } from 'react'
import { SaturnNavbar } from './components/SaturnNavbar'
import SaturnScene from '../components/SaturnScene'

export default function SaturnPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [resetOrbit, setResetOrbit] = useState<(() => void) | null>(null)
  const [isGamePortalOpen, setIsGamePortalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const iframeRef = useState<HTMLIFrameElement | null>(null)[1]

  // Apply Saturn theme to document element for global CSS selectors
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
      // Close the overlay, return to default Saturn view
      setIsGamePortalOpen(false)
      setSelectedGame(null)
    } else {
      // Open the overlay with the selected game (iframe src will update automatically)
      setSelectedGame(gameName)
      setIsGamePortalOpen(true)
    }
  }

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
          iframe {
            width: 333px !important;
            height: 600px !important;
          }
        }
      `}</style>
      <div data-saturn="true" suppressHydrationWarning style={{ minHeight: '100vh', backgroundColor: '#0B0820', position: 'relative', overflowX: 'hidden', paddingBottom: isMobile ? '550px' : '600px' }}>
      {/* Saturn Navbar */}
      <SaturnNavbar onResetOrbit={resetOrbit || undefined} onGameSelected={handleGameSelected} />

      {/* Interactive Saturn Simulation */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
      }}>
        <SaturnScene
          isInteractive={true}
          isMobile={isMobile}
          isGamePortalOpen={isGamePortalOpen}
          onSceneReady={(camera, orbReset) => setResetOrbit(() => orbReset)}
        />
      </div>

      {/* Game Portal Modal Stacked Below Navbar */}
      {isGamePortalOpen && (
        <div style={{
          position: 'fixed',
          top: '140px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'auto',
          background: 'transparent'
        }}>
          <iframe
            src={selectedGame === 'oracle' ? '/oracle-portal.html' : '/game-portal.html'}
            style={{
              width: '500px',
              height: '500px',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
              display: 'block',
              overflow: 'hidden'
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
