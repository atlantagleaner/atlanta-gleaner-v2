'use client'

import React, { useState, useEffect } from 'react'

export interface VideoOverlayProps {
  videos: Array<{ id: string; youtubeId: string; title: string }>
  selectedVideoId: string | null
  onSelectVideo?: (videoId: string) => void
}

export function VideoOverlay({ videos, selectedVideoId, onSelectVideo }: VideoOverlayProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <>
      {/* Video Grid Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          pointerEvents: 'auto',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '16px',
          padding: '140px 40px 40px 40px',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: 'rgba(2, 1, 1, 0.65)',
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-in'
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @media (max-width: 1024px) {
            [data-grid] {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
        `}</style>

        {videos.map((video) => (
          <div
            key={video.id}
            style={{
              position: 'relative',
              aspectRatio: '16 / 9',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FFB347'
              e.currentTarget.style.transform = 'scale(1.02)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 179, 71, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?modestbranding=1`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#FFF',
                fontFamily: 'monospace',
                pointerEvents: 'none'
              }}
            >
              {video.title}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
