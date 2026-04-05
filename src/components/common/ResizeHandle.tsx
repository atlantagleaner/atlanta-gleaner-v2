'use client'

import { useState } from 'react'
import { PALETTE, ANIMATION } from '@/src/styles/tokens'

interface ResizeHandleProps {
  onMouseDown: () => void
}

/**
 * Draggable resize handle between columns.
 * Shows a hover state with increased width and visual feedback.
 */
export function ResizeHandle({ onMouseDown }: ResizeHandleProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Drag to resize"
      style={{
        width: hovered ? '6px' : '4px',
        cursor: 'col-resize',
        flexShrink: 0,
        background: hovered ? PALETTE.black : PALETTE.warm,
        transition: `all ${ANIMATION.fast} ${ANIMATION.ease}`,
        alignSelf: 'stretch',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '2px',
              height: '2px',
              borderRadius: '50%',
              background: PALETTE.black,
            }}
          />
        ))}
      </div>
    </div>
  )
}
