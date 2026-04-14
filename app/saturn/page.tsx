'use client'

import { useEffect, useState } from 'react'
import { TarotModule } from './components/TarotModule'
import { AstrologyModule } from './components/AstrologyModule'
import { SaturnNavbar } from './components/SaturnNavbar'
import SaturnScene from '../components/SaturnScene'
import {
  T, PALETTE_CSS, PAGE_MAX_W, SPACING,
  PAGE_BOTTOM_PADDING_DESKTOP, PAGE_BOTTOM_PADDING_MOBILE,
} from '@/src/styles/tokens'

export default function SaturnPage() {
  const [showModules, setShowModules] = useState(true)
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
      {/* Saturn Navbar */}
      <SaturnNavbar onRunwayClick={() => setShowModules(!showModules)} />

      {/* Interactive Saturn Simulation - Full Background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
      }}>
        <SaturnScene isInteractive={!showModules} isMobile={isMobile} />
      </div>

      <style>{`
        @media (max-width: 767px)  { .saturn-bottom { padding-bottom: ${PAGE_BOTTOM_PADDING_MOBILE}; } }
        @media (min-width: 768px)  { .saturn-bottom { padding-bottom: ${PAGE_BOTTOM_PADDING_DESKTOP}; } }
      `}</style>

      {/* Game modules - toggle with Saturn button */}
      {showModules && (
        <div className="saturn-modules-container" style={{ position: 'relative', zIndex: 5 }}>
          <div className="saturn-module">
            <TarotModule />
          </div>
          <div className="saturn-module">
            <AstrologyModule />
          </div>
        </div>
      )}

      {/* Layout styles */}
      <style>{`
        .saturn-modules-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 80px 32px ${PAGE_BOTTOM_PADDING_DESKTOP};
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 5;
          justify-items: center;
          align-items: center;
        }

        .saturn-module {
          border: 1px solid rgba(184,134,11,0.20);
          background: #1A1A2E;
          box-shadow: inset 0 0 40px rgba(11,8,32,0.6);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 500px;
        }

        .saturn-module > * {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* Mobile layout */
        @media (max-width: 767px) {
          .saturn-modules-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 80px 12px ${PAGE_BOTTOM_PADDING_MOBILE};
            max-height: calc(100vh - 100px);
            overflow-y: auto;
            justify-content: center;
            align-items: center;
          }

          .saturn-module {
            width: 100%;
            min-height: 400px;
            flex-shrink: 0;
          }
        }
      `}</style>
    </div>
  )
}
