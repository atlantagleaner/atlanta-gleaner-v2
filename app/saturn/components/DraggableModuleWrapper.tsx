'use client'

import { useEffect, useState } from 'react'
import { TarotModule } from './TarotModule'
import { AstrologyModule } from './AstrologyModule'
import { CrystalBallModule } from './CrystalBallModule'
import { BlackjackModule } from './BlackjackModule'
import { DraggableModule } from './DraggableModule'
import { SPACING, PAGE_BOTTOM_PADDING_DESKTOP, ANIMATION } from '@/src/styles/tokens'
import { useMobileDetect } from '@/src/hooks'

const MODULES = [
  { id: 'tarot',     label: 'Tarot',      defaultX: 32,  defaultY: 120, defaultWidth: 340, defaultHeight: 460, minWidth: 280, minHeight: 360, maxWidth: 850, maxHeight: 1150, Component: TarotModule },
  { id: 'astrology', label: 'The Wheel',  defaultX: 420, defaultY: 140, defaultWidth: 320, defaultHeight: 420, minWidth: 260, minHeight: 340, maxWidth: 800, maxHeight: 1050, Component: AstrologyModule },
  { id: 'crystal',   label: 'The Sphere', defaultX: 780, defaultY: 160, defaultWidth: 300, defaultHeight: 400, minWidth: 240, minHeight: 320, maxWidth: 750, maxHeight: 1000, Component: CrystalBallModule },
  { id: 'blackjack', label: 'The Bank',   defaultX: 160, defaultY: 620, defaultWidth: 360, defaultHeight: 520, minWidth: 300, minHeight: 420, maxWidth: 900, maxHeight: 1300, Component: BlackjackModule },
]

function SaturnMobilePanel({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ marginBottom: '12px' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          background: 'rgba(184,134,11,0.10)',
          border: '1px solid rgba(184,134,11,0.25)',
          borderBottom: open ? '1px solid rgba(184,134,11,0.15)' : '1px solid rgba(184,134,11,0.25)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.14em',
          color: '#B8860B',
          textShadow: '0 0 10px rgba(184,134,11,0.50)',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '12px',
          color: '#B8860B',
          display: 'inline-block',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: `transform 0.2s ease`,
        }}>
          ▶
        </span>
      </button>
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '9999px' : '0',
        transition: `max-height 0.3s ease`,
        background: '#1A1A2E',
        border: open ? '1px solid rgba(184,134,11,0.20)' : 'none',
        borderTop: 'none',
      }}>
        {children}
      </div>
    </div>
  )
}

export function DraggableModuleWrapper() {
  const isMobile = useMobileDetect(768)

  // Force Saturn theme on this page
  useEffect(() => {
    const html = document.documentElement
    html.dataset.theme = 'saturn'
  }, [])

  if (isMobile) {
    return (
      <div style={{ padding: `0 12px ${PAGE_BOTTOM_PADDING_DESKTOP}`, position: 'relative', zIndex: 10 }}>
        {MODULES.map(({ id, label, Component }) => (
          <SaturnMobilePanel key={id} label={label}>
            <Component />
          </SaturnMobilePanel>
        ))}
      </div>
    )
  }

  return (
    <div
      className="saturn-bottom"
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '1600px',
        maxWidth: '100vw',
        padding: `0 ${SPACING.lg} ${PAGE_BOTTOM_PADDING_DESKTOP}`,
      }}
    >
      {MODULES.map(({ id, label, defaultX, defaultY, defaultWidth, defaultHeight, minWidth, minHeight, maxWidth, maxHeight, Component }) => (
        <DraggableModule
          key={id}
          id={id}
          label={label}
          defaultX={defaultX}
          defaultY={defaultY}
          defaultWidth={defaultWidth}
          defaultHeight={defaultHeight}
          minWidth={minWidth}
          minHeight={minHeight}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
        >
          <Component />
        </DraggableModule>
      ))}
    </div>
  )
}
