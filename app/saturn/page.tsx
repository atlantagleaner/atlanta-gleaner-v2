'use client'

import { useEffect, useState, useRef } from 'react'
import { SaturnNavbar } from './components/SaturnNavbar'
import SaturnScene from '../components/SaturnScene'
import {
  T, PALETTE_CSS, PAGE_MAX_W, SPACING,
  PAGE_BOTTOM_PADDING_DESKTOP, PAGE_BOTTOM_PADDING_MOBILE,
} from '@/src/styles/tokens'

const GAME_MODULES = [
  { id: 'soul-stakes', label: 'SOUL STAKES' }
]

export default function SaturnPage() {
  const [isGameOverlayOpen, setIsGameOverlayOpen] = useState(false)
  const [selectedGameModule, setSelectedGameModule] = useState<'soul-stakes' | null>(null)
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const gameMenuRef = useRef<HTMLDivElement>(null)

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

  // Click outside to close game menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gameMenuRef.current && !gameMenuRef.current.contains(e.target as Node)) {
        setIsGameMenuOpen(false)
      }
    }
    if (isGameMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isGameMenuOpen])

  const handleSelectGame = (moduleId: 'soul-stakes') => {
    setSelectedGameModule(moduleId)
    setIsGameOverlayOpen(true)
    setIsGameMenuOpen(false)
  }

  const handleCloseGameOverlay = () => {
    setIsGameOverlayOpen(false)
    setSelectedGameModule(null)
  }

  const pillButtonStyle: React.CSSProperties = {
    background: selectedGameModule ? 'rgba(184, 134, 11, 0.15)' : 'transparent',
    border: selectedGameModule ? '1px solid rgba(184, 134, 11, 0.45)' : '1px solid rgba(184, 134, 11, 0.20)',
    borderRadius: '100px',
    padding: '10px 20px',
    color: selectedGameModule ? '#B8860B' : 'rgba(245, 241, 232, 0.45)',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none' as const,
  }

  const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '8px',
    background: 'rgba(2, 1, 1, 0.8)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 0',
    zIndex: 1100,
    minWidth: '200px',
  }

  const dropdownItemStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 16px',
    border: 'none',
    background: 'transparent',
    color: '#FFF',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textAlign: 'left',
    fontFamily: 'monospace',
    transition: 'background 0.2s ease',
  }

  return (
    <div data-saturn="true" suppressHydrationWarning style={{ minHeight: '100vh', backgroundColor: '#0B0820', position: 'relative', overflowX: 'hidden' }}>
      {/* Saturn Navbar */}
      <SaturnNavbar onRunwayClick={() => handleCloseGameOverlay()} />

      {/* Interactive Saturn Simulation - Full Background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
      }}>
        <SaturnScene isInteractive={true} isMobile={isMobile} />
      </div>

      {/* Game Module Selector Pill Button */}
      {!isGameOverlayOpen && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '80px' : '50px',
          left: isMobile ? '12px' : 'calc(50% - 450px)',
          zIndex: 1005,
        }}>
          <button
            onClick={() => setIsGameMenuOpen(!isGameMenuOpen)}
            onMouseEnter={(e) => {
              if (!selectedGameModule) {
                e.currentTarget.style.background = 'rgba(184, 134, 11, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.35)'
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedGameModule) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.20)'
              }
            }}
            style={pillButtonStyle}
          >
            STATION {selectedGameModule ? ` - ${selectedGameModule.replace('-', ' ')}` : ''}
          </button>
        </div>
      )}

      {/* Game Menu Dropdown */}
      {isGameMenuOpen && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '120px' : '90px',
          left: isMobile ? '12px' : 'calc(50% - 450px)',
          zIndex: 1005,
        }} ref={gameMenuRef}>
          <div style={dropdownMenuStyle}>
            {GAME_MODULES.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelectGame(game.id as 'soul-stakes')}
                style={dropdownItemStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {game.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game Iframe Overlay */}
      {isGameOverlayOpen && selectedGameModule === 'soul-stakes' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1001,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Game Module Selector Pill (visible over overlay) */}
          <div style={{
            position: 'fixed',
            top: isMobile ? '80px' : '50px',
            left: isMobile ? '12px' : 'calc(50% - 450px)',
            zIndex: 1002,
          }}>
            <button
              onClick={() => setIsGameMenuOpen(!isGameMenuOpen)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(184, 134, 11, 0.2)'
                e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(184, 134, 11, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(184, 134, 11, 0.45)'
              }}
              style={{
                ...pillButtonStyle,
                background: 'rgba(184, 134, 11, 0.15)',
                borderColor: 'rgba(184, 134, 11, 0.45)',
                color: '#B8860B',
              }}
            >
              STATION {selectedGameModule ? ` - ${selectedGameModule.replace('-', ' ')}` : ''}
            </button>
          </div>

          {/* Game Menu Dropdown (visible over overlay) */}
          {isGameMenuOpen && (
            <div style={{
              position: 'fixed',
              top: isMobile ? '160px' : '120px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1003,
            }} ref={gameMenuRef}>
              <div style={dropdownMenuStyle}>
                {GAME_MODULES.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGame(game.id as 'soul-stakes')}
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {game.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Iframe Container - Fixed Viewport */}
          <div style={{
            position: 'relative',
            width: isMobile ? 'calc(100vw - 24px)' : '900px',
            height: isMobile ? 'calc(100vh - 180px)' : '700px',
            backgroundColor: '#05050a',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid rgba(94, 45, 138, 0.4)',
            zIndex: 1001,
            flexShrink: 0,
          }}>
            <iframe
              src="/the-soul-stakes-pro.html"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '4px',
                display: 'block',
              }}
              title="The Soul Stakes Game"
            />
          </div>
        </div>
      )}
    </div>
  )
}
