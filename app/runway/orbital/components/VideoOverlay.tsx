'use client'

import React, { useState, useEffect } from 'react'

export interface VideoOverlayProps {
  videos: Array<{ id: string; youtubeId: string; title: string }>
  selectedVideoId: string | null
  onSelectVideo?: (videoId: string) => void
}

export function VideoOverlay({ videos, selectedVideoId, onSelectVideo }: VideoOverlayProps) {
  const [theaterVideoId, setTheaterVideoId] = useState<string | null>(null)
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

  const handleVideoClick = (videoId: string) => {
    setTheaterVideoId(videoId)
    onSelectVideo?.(videoId)
  }

  const closeTheater = () => {
    setTheaterVideoId(null)
  }

  const selectedVideo = videos.find(v => v.id === theaterVideoId)

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
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '16px',
          padding: '140px 40px 40px 40px',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: 'rgba(2, 1, 1, 0.95)',
          backdropFilter: 'blur(10px)',
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
            onClick={() => handleVideoClick(video.id)}
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

      {/* Theater Mode Modal */}
      {theaterVideoId && selectedVideo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '40px',
            animation: 'fadeIn 0.3s ease-in'
          }}
          onClick={closeTheater}
        >
          {/* Close button */}
          <button
            onClick={closeTheater}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFF',
              padding: '8px 16px',
              borderRadius: '100px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'monospace',
              zIndex: 51,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 165, 0, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(255, 165, 0, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            ESC / CLOSE
          </button>

          {/* Theater iframe container */}
          <div
            style={{
              width: '90vw',
              maxWidth: '1400px',
              aspectRatio: '16 / 9',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 0 60px rgba(255, 179, 71, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              key={theaterVideoId}
              src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&modestbranding=1`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  )
}
