'use client'

import { useEffect, useState } from 'react'
import { SaturnNavbar } from './components/SaturnNavbar'
import SaturnScene from '../components/SaturnScene'
import GameContainer from '../components/GameContainer'
import {
  T, PALETTE_CSS, PAGE_MAX_W, SPACING,
  PAGE_BOTTOM_PADDING_DESKTOP, PAGE_BOTTOM_PADDING_MOBILE,
} from '@/src/styles/tokens'

export default function SaturnPage() {
  const [isGameContainerOpen, setIsGameContainerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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


  return (
    <div data-saturn="true" suppressHydrationWarning style={{ minHeight: '100vh', backgroundColor: '#0B0820', position: 'relative', overflowX: 'hidden' }}>
      {/* Saturn Navbar - Always interactive */}
      <SaturnNavbar onRunwayClick={() => setIsGameContainerOpen(!isGameContainerOpen)} />
      {/* Interactive Saturn Simulation - Always interactive */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
      }}>
        <SaturnScene isInteractive={true} isMobile={isMobile} />
      </div>

      {/* Game Container Overlay */}
      <GameContainer
        isOpen={isGameContainerOpen}
        onClose={() => setIsGameContainerOpen(false)}
      />
    </div>
  )
}
