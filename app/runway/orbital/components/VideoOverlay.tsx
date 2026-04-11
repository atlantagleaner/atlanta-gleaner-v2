'use client'

import React, { useState, useEffect, useRef } from 'react'

export interface VideoOverlayProps {
  videos: Array<{ id: string; youtubeId: string; title: string }>
  selectedVideoId: string | null
  onSelectVideo?: (videoId: string) => void
}

export function VideoOverlay({ videos, selectedVideoId, onSelectVideo }: VideoOverlayProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isScrollable, setIsScrollable] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      checkScrollability()
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollPosition(container.scrollTop)
      checkScrollability()
    }

    container.addEventListener('scroll', handleScroll)
    checkScrollability()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [videos])

  const checkScrollability = () => {
    if (!containerRef.current) return
    const container = containerRef.current
    const isScrollableContent = container.scrollHeight > container.clientHeight
    setIsScrollable(isScrollableContent)
  }

  // Calculate which videos are visible
  const videosPerRow = isMobile ? 1 : 3
  const visibleVideos = isMobile ? 2 : 6 // roughly how many fit on screen
  const currentVideoIndex = Math.floor(scrollPosition / 100) // rough estimate
  const startIndex = Math.max(0, Math.min(currentVideoIndex, videos.length - visibleVideos))
  const endIndex = Math.min(startIndex + visibleVideos, videos.length)

  return (
    <>
      {/* Video Grid Overlay */}
      <div
        ref={containerRef}
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
          gap: '12px',
          padding: '110px 30px 30px 30px',
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
              transition: 'all 0.3s ease',
              transform: 'scale(0.65)',
              transformOrigin: 'top left',
              width: '154%',
              height: 'auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FFB347'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 179, 71, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
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
                pointerEvents: 'none',
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {video.title}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll Indicator */}
      {isScrollable && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            padding: '8px 16px',
            borderRadius: '100px',
            color: '#FFF',
            fontSize: '11px',
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
            zIndex: 11,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            pointerEvents: 'none'
          }}
        >
          Videos {startIndex + 1}–{endIndex} of {videos.length}
        </div>
      )}
    </>
  )
}
