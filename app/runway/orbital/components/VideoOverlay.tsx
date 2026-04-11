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
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null)
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

  // Handle ESC key to close expanded video
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedVideoId(null)
      }
    }

    if (expandedVideoId) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [expandedVideoId])

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

  const expandedVideo = videos.find(v => v.id === expandedVideoId)

  const handleVideoClick = (videoId: string) => {
    setExpandedVideoId(expandedVideoId === videoId ? null : videoId)
  }

  const closeExpanded = () => {
    setExpandedVideoId(null)
  }

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
          zIndex: expandedVideoId ? 10 : 10,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '12px',
          padding: '110px 30px 30px 30px',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: expandedVideoId ? 'rgba(2, 1, 1, 0.85)' : 'rgba(2, 1, 1, 0.65)',
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-in',
          transition: 'background 0.3s ease'
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
              transition: 'all 0.3s ease',
              transform: 'scale(0.65)',
              transformOrigin: 'top left',
              width: '154%',
              height: 'auto',
              opacity: expandedVideoId && expandedVideoId !== video.id ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!expandedVideoId) {
                e.currentTarget.style.borderColor = '#FFB347'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 179, 71, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!expandedVideoId) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?modestbranding=1`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                pointerEvents: expandedVideoId ? 'none' : 'auto'
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

      {/* Expanded Video Overlay */}
      {expandedVideo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            pointerEvents: 'auto',
            animation: 'fadeIn 0.3s ease-in'
          }}
          onClick={closeExpanded}
        >
          {/* Expanded Video Container */}
          <div
            style={{
              position: 'relative',
              width: 'min(90vw, 1000px)',
              aspectRatio: '16 / 9',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '3px solid #FFB347',
              boxShadow: '0 0 60px rgba(255, 179, 71, 0.5)',
              backgroundColor: '#000',
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${expandedVideo.youtubeId}?modestbranding=1&autoplay=1`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Close Button */}
            <button
              onClick={closeExpanded}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFF',
                padding: '8px 16px',
                borderRadius: '100px',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'monospace',
                zIndex: 21,
                transition: 'all 0.2s ease',
                pointerEvents: 'auto'
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

            {/* Title */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#FFF',
                fontFamily: 'monospace',
                pointerEvents: 'none'
              }}
            >
              {expandedVideo.title}
            </div>
          </div>
        </div>
      )}

      {/* Scroll Indicator */}
      {isScrollable && !expandedVideoId && (
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
