'use client'

import { useState, type ReactNode } from 'react'
import { PALETTE, T, SPACING, ANIMATION, PALETTE_CSS } from '@/src/styles/tokens'

interface MobilePanelProps {
  label: string
  children: ReactNode
  initialOpen?: boolean
}

/**
 * Mobile accordion panel — used for collapsing content on small screens.
 * Renders a black header button with chevron and toggleable content area.
 */
export function MobilePanel({ label, children, initialOpen = true }: MobilePanelProps) {
  const [open, setOpen] = useState(initialOpen)

  return (
    <div style={{ marginBottom: SPACING.md }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          background: PALETTE.black,
          border: 'none',
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <span style={{ ...T.nav, color: PALETTE.white }}>
          {label}
        </span>
        <span
          style={{
            ...T.label,
            color: PALETTE.white,
            transition: `transform ${ANIMATION.base} ${ANIMATION.ease}`,
            display: 'inline-block',
            transform: open ? 'rotate(90deg)' : 'rotate(0)',
          }}
        >
          ▶
        </span>
      </button>
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? '99999px' : '0',
          transition: `max-height ${ANIMATION.base} ${ANIMATION.ease}`,
          background: PALETTE.white,
          border: `1px solid ${PALETTE_CSS.ruleMd}`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
