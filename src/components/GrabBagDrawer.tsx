'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Grab Bag Video Scroll Drawer
// ─────────────────────────────────────────────────────────────────────────────
// Classical newspaper archive aesthetic video carousel.
// Single scrollable unit: video player + caption together.
// Controlled via arrow buttons with smooth scroll animation.
//
// Design: flat, no gradients, newspaper-first typography, mobile-optimized.
// Styling: CSS variables only (supports all themes automatically).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from 'react'
import { SPACING, ANIMATION } from '@/src/styles/tokens'
import styles from './GrabBagDrawer.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

interface GrabBagEpisode {
  title: string
  source: string
  channelHandle?: string
  publishedAt: string
  type: 'video' | 'audio'
  videoId?: string
  spotifyId?: string
  thumbnailUrl: string
}

interface GrabBagDrawerProps {
  episodes: GrabBagEpisode[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GrabBagDrawer({ episodes }: GrabBagDrawerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const videoCardsRef = useRef<(HTMLDivElement | null)[]>([])

  // Format relative time (e.g., "2 days ago")
  const formatTime = (publishedAt: string): string => {
    const now = new Date()
    const published = new Date(publishedAt)
    const diffMs = now.getTime() - published.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return months === 1 ? '1 month ago' : `${months} months ago`
    }
    return `${Math.floor(diffDays / 365)} years ago`
  }

  // Scroll to a specific video card centered in viewport
  const scrollToCard = useCallback((index: number) => {
    const card = videoCardsRef.current[index]
    if (card && scrollContainerRef.current) {
      card.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      setCurrentIndex(index)
    }
  }, [])

  // Scroll to next video
  const handleNext = useCallback(() => {
    const nextIndex = Math.min(currentIndex + 1, episodes.length - 1)
    scrollToCard(nextIndex)
  }, [currentIndex, episodes.length, scrollToCard])

  // Scroll to previous video
  const handlePrev = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0)
    scrollToCard(prevIndex)
  }, [currentIndex, scrollToCard])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        handleNext()
        event.preventDefault()
      } else if (event.key === 'ArrowUp') {
        handlePrev()
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev])

  if (episodes.length === 0) {
    return null
  }

  const canScrollUp = currentIndex > 0
  const canScrollDown = currentIndex < episodes.length - 1

  return (
    <div className={styles.grabBagWrapper}>
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className={styles.scrollContainer}
      >
        {episodes.map((episode, index) => (
          <div
            key={index}
            ref={(el) => {
              videoCardsRef.current[index] = el
            }}
            className={styles.videoCard}
          >
            {/* Video Player */}
            <div className={styles.videoPlayer}>
              {episode.videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${episode.videoId}`}
                  title={episode.title}
                  allowFullScreen
                  className={styles.playerFrame}
                />
              ) : episode.spotifyId ? (
                <iframe
                  src={`https://open.spotify.com/embed/episode/${episode.spotifyId}`}
                  className={styles.playerFrame}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                />
              ) : (
                <div className={styles.playerPlaceholder}>
                  {episode.thumbnailUrl && (
                    <img
                      src={episode.thumbnailUrl}
                      alt={episode.title}
                      className={styles.thumbnailImage}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Caption Block */}
            <div className={styles.caption}>
              <h3 className={styles.captionTitle}>{episode.title}</h3>
              <p className={styles.captionMetadata}>
                {episode.source}
                {episode.channelHandle && ` • @${episode.channelHandle}`}
                {' • '}
                {formatTime(episode.publishedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll Controls */}
      <div className={styles.scrollControls}>
        <button
          className={`${styles.scrollBtn} ${
            !canScrollUp ? styles.disabled : ''
          }`}
          onClick={handlePrev}
          aria-label="Previous video"
          disabled={!canScrollUp}
        >
          ↑
        </button>
        <button
          className={`${styles.scrollBtn} ${
            !canScrollDown ? styles.disabled : ''
          }`}
          onClick={handleNext}
          aria-label="Next video"
          disabled={!canScrollDown}
        >
          ↓
        </button>
      </div>
    </div>
  )
}
