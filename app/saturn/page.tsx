'use client'

import { useEffect } from 'react'
import { TarotModule } from './components/TarotModule'
import { AstrologyModule } from './components/AstrologyModule'
import SaturnScene from '../components/SaturnScene'
import { Banner } from '@/src/components/Banner'
import {
  T, PALETTE_CSS, PAGE_MAX_W, SPACING,
  PAGE_BOTTOM_PADDING_DESKTOP, PAGE_BOTTOM_PADDING_MOBILE,
} from '@/src/styles/tokens'

export default function SaturnPage() {
  // Apply Saturn theme to document element for global CSS selectors
  useEffect(() => {
    document.documentElement.setAttribute('data-saturn', 'true')
    return () => document.documentElement.removeAttribute('data-saturn')
  }, [])

  return (
    <div data-saturn="true" suppressHydrationWarning style={{ minHeight: '100vh', backgroundColor: '#0B0820', position: 'relative', overflowX: 'hidden' }}>
      {/* Interactive Saturn Simulation - Full Background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
      }}>
        <SaturnScene isInteractive={true} isMobile={typeof window !== 'undefined' && window.innerWidth < 768} />
      </div>

      <style>{`
        @media (max-width: 767px)  { .saturn-bottom { padding-bottom: ${PAGE_BOTTOM_PADDING_MOBILE}; } }
        @media (min-width: 768px)  { .saturn-bottom { padding-bottom: ${PAGE_BOTTOM_PADDING_DESKTOP}; } }
      `}</style>

      <Banner />

      {/* Page title block */}
      <div style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: `0 ${SPACING.lg}`, position: 'relative', zIndex: 5 }}>
        <div style={{
          borderBottom: '1px solid rgba(184,134,11,0.20)',
          padding: `${SPACING.xl} 0 ${SPACING.lg}`,
          marginBottom: SPACING.xxl,
        }}>
          <h1 style={{
            ...T.pageTitle,
            color: '#B8860B',
            margin: 0,
            letterSpacing: '0.20em',
            textShadow: '0 0 16px rgba(184,134,11,0.50), 0 0 32px rgba(184,134,11,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '1ch',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" style={{ display: 'inline-block', flexShrink: 0 }}>
              <defs>
                <filter id="saturn-glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Rings */}
              <ellipse cx="16" cy="16" rx="20" ry="6" fill="none" stroke="#B8860B" strokeWidth="1.5" opacity="0.7" filter="url(#saturn-glow)" />
              {/* Planet */}
              <circle cx="16" cy="16" r="10" fill="#B8860B" opacity="0.9" filter="url(#saturn-glow)" />
            </svg>
            Saturn
          </h1>
        </div>
      </div>

      {/* Game modules - simple grid layout */}
      <div className="saturn-modules-container" style={{ position: 'relative', zIndex: 5 }}>
        <div className="saturn-module">
          <TarotModule />
        </div>
        <div className="saturn-module">
          <AstrologyModule />
        </div>
      </div>

      {/* Layout styles */}
      <style>{`
        .saturn-modules-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 120px 32px ${PAGE_BOTTOM_PADDING_DESKTOP};
          max-width: 1400px;
          margin: 0 auto;
        }

        .saturn-module {
          border: 1px solid rgba(184,134,11,0.20);
          background: #1A1A2E;
          box-shadow: inset 0 0 40px rgba(11,8,32,0.6);
          overflow: hidden;
          display: flex;
          flex-direction: column;
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
            padding: 120px 12px ${PAGE_BOTTOM_PADDING_MOBILE};
          }

          .saturn-module {
            width: 100%;
            max-height: 100vh;
          }
        }
      `}</style>
    </div>
  )
}
