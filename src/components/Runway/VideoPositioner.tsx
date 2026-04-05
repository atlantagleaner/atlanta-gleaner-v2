/**
 * Positions a video container at a specific stage location on the festival map
 * Or shows a placeholder if no video is assigned
 */

import { ReactNode } from 'react'
import { SPACING } from '@/src/styles/tokens'

interface VideoPositionerProps {
  stageName: string
  positionPercent: {
    left: string
    top: string
  }
  children?: ReactNode
  isPlaceholder?: boolean
  videoAspectRatio?: number // e.g., 16/9
}

/**
 * Absolutely positioned video container
 * Placed at its stage's coordinates on the festival map
 */
export function VideoPositioner({
  stageName,
  positionPercent,
  children,
  isPlaceholder = false,
  videoAspectRatio = 16 / 9,
}: VideoPositionerProps) {
  const videoSize = 140 // Base video size in pixels

  return (
    <div
      className="video-positioner"
      style={{
        position: 'absolute',
        left: positionPercent.left,
        top: positionPercent.top,
        transform: 'translate(-50%, -50%)', // Center on coordinate
        zIndex: 10,
      }}
      data-stage={stageName}
    >
      <div
        className={`video-container ${isPlaceholder ? 'placeholder' : ''}`}
        style={{
          position: 'relative',
          width: videoSize,
          aspectRatio: videoAspectRatio,
          backgroundColor: isPlaceholder ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
          border: isPlaceholder ? '2px dashed rgba(0, 0, 0, 0.2)' : 'none',
          borderRadius: SPACING.sm,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '0.65rem',
          color: 'rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          padding: SPACING.sm,
        }}
      >
        {isPlaceholder ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '1rem' }}>─</span>
            <span>{stageName}</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
