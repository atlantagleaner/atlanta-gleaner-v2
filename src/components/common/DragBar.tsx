'use client'

import { type ReactNode } from 'react'
import { PALETTE, T, SPACING, ANIMATION, PALETTE_CSS } from '@/src/styles/tokens'

interface DragBarProps {
  label: string
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
  isDragging: boolean
}

/**
 * Draggable header bar for columns.
 * Shows visual feedback when dragging and displays the column label.
 */
export function DragBar({ label, onPointerDown, isDragging }: DragBarProps) {
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: `${SPACING.sm} ${SPACING.md}`,
        background: isDragging ? 'var(--palette-warm)' : PALETTE.white,
        borderBottom: `1px solid ${PALETTE_CSS.ruleMd}`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transition: `background ${ANIMATION.fast} ${ANIMATION.ease}`,
      }}
    >
      {/* Grab handle dots */}
      <div style={{ display: 'flex', gap: '3px', opacity: 0.4 }}>
        {[0, 1].map(col => (
          <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {[0, 1, 2].map(row => (
              <div
                key={row}
                style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  background: PALETTE.black,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <span style={{ ...T.label, color: PALETTE.black }}>
        {label}
      </span>
    </div>
  )
}
