'use client'

import { useEffect } from 'react'
import { DraggableModuleWrapper } from './components/DraggableModuleWrapper'
import Starfield from './components/Starfield'
import { Banner }           from '@/src/components/Banner'
import {
  T, PALETTE_CSS, PAGE_MAX_W, SPACING,
  PAGE_BOTTOM_PADDING_DESKTOP, PAGE_BOTTOM_PADDING_MOBILE,
} from '@/src/styles/tokens'

export default function SaturnPage() {
  // Apply Saturn theme to entire document (including navbar)
  useEffect(() => {
    document.documentElement.setAttribute('data-saturn', 'true')
    return () => document.documentElement.removeAttribute('data-saturn')
  }, [])
  return (
    <div data-saturn="true" style={{ minHeight: '100vh', backgroundColor: '#0B0820', position: 'relative', overflowX: 'hidden' }}>
      {/* Space background with pulsing nebula effect */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        {/* Starfield with box-shadow pattern */}
        {/* <Starfield /> */}
        {/* Animated nebula/space gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(139,69,19,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(70,130,180,0.12) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(75,0,130,0.10) 0%, transparent 50%)
          `,
          animation: 'saturn-nebula-drift 45s ease-in-out infinite, saturn-nebula-pulse 8s ease-in-out infinite',
        }} />
        {/* Nebula animations */}
        <style>{`
          @keyframes saturn-nebula-drift {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-20px, 15px); }
          }
          @keyframes saturn-nebula-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
        `}</style>
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

      {/* Draggable modules container */}
      <DraggableModuleWrapper />
    </div>
  )
}
