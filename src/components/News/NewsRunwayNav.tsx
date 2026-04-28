'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useDateTime } from '@/src/hooks'
import { SiteDropdownMenu } from '@/src/components/navigation/SiteDropdownMenu'
import { ANIMATION, PALETTE_CSS, SPACING, T } from '@/src/styles/tokens'

interface NewsRunwayNavProps {
  newsOpen: boolean
  onToggleNews: () => void
}

export function NewsRunwayNav({ newsOpen, onToggleNews }: NewsRunwayNavProps) {
  const { dateStr, timeStr, mounted } = useDateTime()
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!navRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isMenuOpen])

  const glassButton: CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px)',
    border: `1px solid rgba(255, 255, 255, 0.1)`,
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
    transition: `all ${ANIMATION.fast} ${ANIMATION.ease}`,
    userSelect: 'none',
  }

  const dropdownMenuStyle: CSSProperties = {
    position: 'absolute',
    top: '100%',
    marginTop: '8px',
    background: 'rgba(2, 1, 1, 0.95)',
    backdropFilter: 'blur(20px)',
    border: `1px solid rgba(255, 255, 255, 0.1)`,
    borderRadius: '8px',
    padding: '8px 0',
    color: '#FFF',
    fontSize: '11px',
    letterSpacing: '0.15em',
    fontFamily: 'monospace',
    zIndex: 1100,
    minWidth: '180px',
  }

  const dropdownItemStyle: CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease',
  }

  const navHrefStyle: CSSProperties = {
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  }

  const titleBlock = (
    <button
      onClick={() => setIsMenuOpen((value) => !value)}
      style={{ ...glassButton, border: `1px solid ${PALETTE_CSS.ruleMd}`, textAlign: 'left' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
        {mounted && dateStr ? (
          <>
            <span style={{ fontSize: '9px', opacity: 0.4 }}>{dateStr}</span>
            <span style={{ opacity: 0.4, fontSize: '9px' }}>{timeStr}</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '9px', opacity: 0.4 }}>—</span>
            <span style={{ opacity: 0.4, fontSize: '9px' }}>—:—:—</span>
          </>
        )}
      </div>

      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
        <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>THE ATLANTA GLEANER</span>
        <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>EDITED BY GEORGE WASHINGTON</span>
      </div>

      <div style={{ marginLeft: 'auto' }}>{isMenuOpen ? '−' : '+'}</div>
    </button>
  )

  return (
    <nav
      ref={navRef}
      style={{
        position: 'fixed',
        top: isMobile ? '15px' : '25px',
        left: isMobile ? '15px' : '25px',
        right: isMobile ? '15px' : '25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch', width: '100%' }}>
          <div style={{ position: 'relative' }}>
            {titleBlock}
            {isMenuOpen && (
              <div ref={dropdownRef}>
                <SiteDropdownMenu
                  open={isMenuOpen}
                  align="right"
                  variant="dark"
                  position="absolute"
                  onSelect={() => setIsMenuOpen(false)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={onToggleNews}
              style={{
                ...glassButton,
                background: newsOpen ? 'rgba(255, 165, 0, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: newsOpen ? 'rgba(255, 165, 0, 0.35)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              NEWS
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
            {titleBlock}
            {isMenuOpen && (
              <div ref={dropdownRef}>
                <SiteDropdownMenu
                  open={isMenuOpen}
                  align="left"
                  variant="dark"
                  position="absolute"
                  onSelect={() => setIsMenuOpen(false)}
                />
              </div>
            )}
            </div>

            <button
              onClick={onToggleNews}
              style={{
                ...glassButton,
                background: newsOpen ? 'rgba(255, 165, 0, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: newsOpen ? 'rgba(255, 165, 0, 0.35)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              NEWS
            </button>
          </div>

          <a href="/runway" style={{ ...navHrefStyle, color: '#FFF' }}>
            <span style={{ ...T.nav, opacity: 0.5 }}>RUNWAY</span>
          </a>
        </>
      )}
    </nav>
  )
}
