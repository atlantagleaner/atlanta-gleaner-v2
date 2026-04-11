'use client'

import React, { useState, useEffect, useRef } from 'react'

export interface VideoOverlayProps {
  videos: Array<{ id: string; youtubeId: string; title: string }>
  selectedVideoId: string | null
  onSelectVideo?: (videoId: string) => void
}

export function VideoOverlay({ videos, selectedVideoId, onSelectVideo }: VideoOverlayProps) {
  const [theaterVideoId, setTheaterVideoId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Close theater when overlay is hidden (handled by parent)
  useEffect(() => {
    setTheaterVideoId(null)
  }, [])

  // Detect layout mode (mobile/desktop, portrait/landscape)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsPortrait(window.innerWidth < window.innerHeight)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  const handleVideoClick = (videoId: string) => {
    setTheaterVideoId(videoId)
    onSelectVideo?.(videoId)
  }

  const closeTheater = () => {
    setTheaterVideoId(null)
  }

  const selectedVideo = videos.find(v => v.id === selectedVideoId)

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return
    const scrollAmount = isMobile ? 150 : 400
    const scrollDirection = direction === 'left' ? -scrollAmount : scrollAmount
    carouselRef.current.scrollBy({ left: scrollDirection, behavior: 'smooth' })
  }

  // Navbar button style (matching orbital navbar)
  const navBarButtonStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    color: '#FFF',
    fontSize: '18px',
    fontFamily: 'monospace',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    userSelect: 'none',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  }

  // Determine carousel layout based on viewport
  const getContainerStyle = (): React.CSSProperties => {
    if (isMobile && isPortrait) {
      // Portrait mobile: vertical carousel with 3 visible
      return {
        position: 'fixed',
        inset: 0,
        pointerEvents: 'auto',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
        padding: '140px 40px 40px 40px',
        gap: '16px',
        animation: 'fadeIn 0.3s ease-in'
      }
    } else if (isMobile && !isPortrait) {
      // Landscape mobile: horizontal carousel with 1-2 visible
      return {
        position: 'fixed',
        inset: 0,
        pointerEvents: 'auto',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        scrollBehavior: 'smooth',
        padding: '40px 20px',
        gap: '16px',
        animation: 'fadeIn 0.3s ease-in'
      }
    } else {
      // Desktop: horizontal carousel with 3 visible
      return {
        position: 'fixed',
        inset: 0,
        pointerEvents: 'auto',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        scrollBehavior: 'smooth',
        padding: '140px 40px 40px 40px',
        gap: '16px',
        alignItems: 'center',
        animation: 'fadeIn 0.3s ease-in'
      }
    }
  }

  // Determine video card size based on layout
  const getVideoCardStyle = (): React.CSSProperties => {
    if (isMobile && isPortrait) {
      // Portrait: height-based sizing for 3 visible
      return {
        position: 'relative',
        flex: '0 0 auto',
        height: 'calc((100vh - 220px) / 3.2)',
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        border:
          selectedVideoId ? '3px solid #FFB347' : '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease',
        boxShadow: selectedVideoId ? '0 0 20px rgba(255, 179, 71, 0.4)' : 'none',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always'
      }
    } else if (isMobile && !isPortrait) {
      // Landscape: full-viewport width for 1-2 visible
      return {
        position: 'relative',
        flex: '0 0 90vw',
        aspectRatio: '16 / 9',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        border:
          selectedVideoId ? '3px solid #FFB347' : '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease',
        boxShadow: selectedVideoId ? '0 0 20px rgba(255, 179, 71, 0.4)' : 'none',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always'
      }
    } else {
      // Desktop: width-based sizing for 3 visible
      return {
        position: 'relative',
        flex: '0 0 auto',
        width: 'calc((100vw - 120px) / 3.2)',
        aspectRatio: '16 / 9',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        border:
          selectedVideoId ? '3px solid #FFB347' : '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease',
        boxShadow: selectedVideoId ? '0 0 20px rgba(255, 179, 71, 0.4)' : 'none',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always'
      }
    }
  }

  return (
    <>
      {/* Arrow Button Controls */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9 }}>
        {/* Left Arrow */}
        <button
          onClick={() => scrollCarousel('left')}
          style={{
            position: 'fixed',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'auto',
            ...navBarButtonStyle
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
          ←
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scrollCarousel('right')}
          style={{
            position: 'fixed',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'auto',
            ...navBarButtonStyle
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
          →
        </button>
      </div>

      {/* Video Carousel Overlay */}
      <div ref={carouselRef} style={getContainerStyle()}>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>

        {videos.map((video) => {
          const baseStyle = getVideoCardStyle()
          const isSelected = selectedVideoId === video.id

          return (
          <div
            key={video.id}
            onClick={() => handleVideoClick(video.id)}
            style={{
              ...baseStyle,
              borderColor: isSelected ? '#FFB347' : 'rgba(255, 255, 255, 0.2)',
              borderWidth: isSelected ? '3px' : '1px',
              boxShadow: isSelected ? '0 0 20px rgba(255, 179, 71, 0.4)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FFB347'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor =
                selectedVideoId === video.id
                  ? '#FFB347'
                  : 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1)'
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
        )
        })}
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
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFF',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'monospace',
              zIndex: 51,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
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
