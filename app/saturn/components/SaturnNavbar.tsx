'use client'

import React, { useEffect, useState } from 'react'
import { useDateTime } from '@/src/hooks'

interface SaturnNavbarProps {
  onResetOrbit?: () => void
  onGameSelected?: (gameName: string) => void
}

export function SaturnNavbar({ onResetOrbit, onGameSelected }: SaturnNavbarProps) {
  const { dateStr, timeStr } = useDateTime()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    userSelect: 'none',
    textDecoration: 'none',
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
    minWidth: '180px',
  }

  const dropdownItemStyle: React.CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease',
  }

  const gameMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: '0',
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
    minWidth: '160px',
  }

  const gameOptionStyle: React.CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease',
    display: 'block',
    color: '#FFF',
    textDecoration: 'none',
    borderBottom: '1px solid rgba(184, 134, 11, 0.2)',
  }

  const handleGameSelect = (gameName: string) => {
    onGameSelected?.(gameName)
    if (gameName === 'orbit') {
      onResetOrbit?.()
    }
    setIsGameMenuOpen(false)
  }

  const gameOptions = [
    { key: 'orbit', label: 'Orbit' },
    { key: 'blackjack', label: 'Blackjack' },
    { key: 'tarot', label: 'Tarot' },
    { key: 'oracle', label: 'Oracle' },
    { key: 'flight', label: 'Flight' },
  ] as const

  const renderGameOptions = (mobile: boolean) =>
    gameOptions.map((option, index) => {
      const isFirst = index === 0
      const isLast = index === gameOptions.length - 1

      return (
        <div
          key={option.key}
          style={{
            ...gameOptionStyle,
            ...(mobile && isFirst ? { borderBottomLeftRadius: '8px', borderTopLeftRadius: '8px' } : {}),
            ...(mobile && isLast ? { borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' } : {}),
            ...(isLast ? { borderBottom: 'none' } : {}),
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          onClick={() => handleGameSelect(option.key)}
        >
          {option.label}
        </div>
      )
    })

  return (
    <>
      {isMobile ? (
        <nav
          style={{
            position: 'fixed',
            top: '15px',
            left: '15px',
            right: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1100,
          }}
        >
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ ...navItemStyle, textDecoration: 'none' } as React.CSSProperties}
            >
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontSize: '9px', opacity: 0.4 }}>{dateStr}</span>
                <span style={{ opacity: 0.4, fontSize: '9px' }}>{timeStr}</span>
              </div>

              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 800, color: '#B8860B', fontSize: '12px' }}>THE ATLANTA GLEANER</span>
                <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>EDITED BY GEORGE WASHINGTON</span>
              </div>

              <div style={{ marginLeft: 'auto' }}>{isMenuOpen ? '-' : '+'}</div>
            </button>
            {isMenuOpen && (
              <div style={{ ...dropdownMenuStyle, right: '0', marginTop: '8px' }}>
                <a
                  href="/archive"
                  style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  ARCHIVE
                </a>
                <a
                  href="/"
                  style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  RUNWAY
                </a>
                <a
                  href="/saturn"
                  style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  SATURN
                </a>
                <a
                  href="/vault"
                  style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  VAULT
                </a>
                <a
                  href="/about"
                  style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  ABOUT
                </a>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsGameMenuOpen(!isGameMenuOpen)}
              style={{
                ...navItemStyle,
                background: 'rgba(184, 134, 11, 0.1)',
                borderColor: 'rgba(184, 134, 11, 0.3)',
              } as React.CSSProperties}
            >
              SATURN
            </button>
            {isGameMenuOpen && <div style={{ ...gameMenuStyle, left: '0' }}>{renderGameOptions(true)}</div>}
          </div>
        </nav>
      ) : (
        <nav
          style={{
            position: 'fixed',
            top: '25px',
            left: '25px',
            right: '25px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 1100,
          }}
        >
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ ...navItemStyle, textDecoration: 'none' } as React.CSSProperties}
              >
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                  <span style={{ fontSize: '9px', opacity: 0.4 }}>{dateStr}</span>
                  <span style={{ opacity: 0.4, fontSize: '9px' }}>{timeStr}</span>
                </div>

                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                  <span style={{ fontWeight: 800, color: '#B8860B', fontSize: '12px' }}>THE ATLANTA GLEANER</span>
                  <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>EDITED BY GEORGE WASHINGTON</span>
                </div>

                <div style={{ marginLeft: 'auto' }}>{isMenuOpen ? '-' : '+'}</div>
              </button>
              {isMenuOpen && (
                <div style={{ ...dropdownMenuStyle, left: '0', marginTop: '8px' }}>
                  <a
                    href="/archive"
                    style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    ARCHIVE
                  </a>
                  <a
                    href="/"
                    style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    RUNWAY
                  </a>
                  <a
                    href="/saturn"
                    style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    SATURN
                  </a>
                  <a
                    href="/vault"
                    style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    VAULT
                  </a>
                  <a
                    href="/about"
                    style={{ ...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184, 134, 11, 0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    ABOUT
                  </a>
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsGameMenuOpen(!isGameMenuOpen)}
                style={{
                  ...navItemStyle,
                  background: 'rgba(184, 134, 11, 0.1)',
                  borderColor: 'rgba(184, 134, 11, 0.3)',
                } as React.CSSProperties}
            >
              SATURN
            </button>
              {isGameMenuOpen && <div style={gameMenuStyle}>{renderGameOptions(false)}</div>}
            </div>
          </div>
        </nav>
      )}
    </>
  )
}
