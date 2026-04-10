'use client'

import { SPACING, SIZE_SM, FONT } from '@/src/styles/tokens'

interface Video {
  id: string
  title: string
  youtubeId: string
  angle: number
}

interface OrbitalControlsProps {
  videos: Video[]
  onVideoSelect: (videoId: string) => void
}

export default function OrbitalControls({ videos, onVideoSelect }: OrbitalControlsProps) {
  const buttonStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(238, 237, 235, 0.15)',
    color: '#FFFFFF',
    padding: `${SPACING.sm} ${SPACING.lg}`,
    borderRadius: '20px',
    fontSize: SIZE_SM,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    whiteSpace: 'nowrap',
  }

  const buttonHoverStyle = {
    background: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(238, 237, 235, 0.4)',
    boxShadow: '0 8px 16px rgba(238, 237, 235, 0.1)',
    transform: 'translateY(-2px) scale(1.05)',
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    Object.assign(e.currentTarget.style, buttonHoverStyle)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    Object.keys(buttonHoverStyle).forEach(key => {
      e.currentTarget.style.removeProperty(
        key.replace(/([A-Z])/g, '-$1').toLowerCase()
      )
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'rgba(2, 1, 1, 0.7)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(238, 237, 235, 0.08)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
        padding: `0 ${SPACING.lg}`,
        zIndex: 100,
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={() => onVideoSelect('overview')}
        style={buttonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        Event Horizon
      </button>

      {videos.map(video => (
        <button
          key={video.id}
          onClick={() => onVideoSelect(video.id)}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {video.title}
        </button>
      ))}
    </div>
  )
}
