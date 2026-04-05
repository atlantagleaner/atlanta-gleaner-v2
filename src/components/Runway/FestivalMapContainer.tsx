'use client'

/**
 * Festival map container for Runway page
 * Positions videos spatially at their stage locations
 * Desktop: spatial layout with SVG map background
 * Mobile: linear stack with no map
 */

import { useMemo } from 'react'
import festivalsRaw from '@/src/data/piedmont-park-festival.geojson.json'
import type { ParkBounds } from '@/src/data/types'
import { calculateParkBounds, projectCoordinates, normalizedToPercentage } from '@/src/lib/coordinateProjection'
import { useMobileDetect } from '@/src/hooks/useMobileDetect'
import { FestivalMapSVG } from './FestivalMapSVG'
import { MatrixMapASCII } from './MatrixMapASCII'
import { VideoPositioner } from './VideoPositioner'
import { SPACING, PALETTE } from '@/src/styles/tokens'
import { useThemeDetection } from '@/src/hooks/useThemeDetection'
import { BaseBox } from '@/src/components/common/BaseBox'

interface FestivalMapContainerProps {
  videos: Array<{
    id: string
    title: string
    artist: string
    youtubeId: string
  }>
  videoComponent: (video: any) => React.ReactNode
}

// Stage order for sequential video assignment
const STAGE_ORDER = [
  { id: 'stage-salesforce', name: 'Salesforce Stage', coords: [-84.372154, 33.788002] as [number, number] },
  { id: 'stage-oakheart', name: 'Oakheart Stage', coords: [-84.377723, 33.784896] as [number, number] },
  { id: 'stage-cotton-club', name: 'Cotton Club Stage', coords: [-84.374200, 33.781850] as [number, number] },
  { id: 'stage-verizon', name: 'Verizon Stage', coords: [-84.380000, 33.783000] as [number, number] },
]

/**
 * Main festival map container component
 * Maps videos to stage locations and renders spatial or stacked layout
 */
export function FestivalMapContainer({
  videos,
  videoComponent: VideoComponent,
}: FestivalMapContainerProps) {
  const isMobile = useMobileDetect(768)
  const currentTheme = (useThemeDetection() || 'default') as string

  // Calculate park bounds once
  const bounds: ParkBounds = useMemo(() => {
    const geojson = festivalsRaw as any
    return calculateParkBounds(geojson.features as any)
  }, [])

  // Create video-stage pairs with positions
  const stagePairs = useMemo(() => {
    return STAGE_ORDER.map((stage, index) => {
      const video = videos[index] || null
      const projected = projectCoordinates(stage.coords[0], stage.coords[1], bounds)
      const { left, top } = normalizedToPercentage(projected.x, projected.y)
      return {
        stage,
        video,
        position: { left, top },
      }
    })
  }, [videos, bounds])

  // Render desktop spatial layout
  const renderSpatialLayout = () => {
    const containerWidth = 900
    const containerHeight = Math.round(containerWidth / bounds.aspectRatio)

    return (
      <div
        className="festival-map-spatial"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: containerWidth,
          aspectRatio: bounds.aspectRatio,
          margin: `${SPACING.xl} auto`,
          border: `1px solid ${PALETTE.black}20`,
          borderRadius: '4px',
          background: PALETTE.white,
          overflow: 'visible',
        }}
      >
        {/* SVG map background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <FestivalMapSVG theme={currentTheme} />
        </div>

        {/* ASCII overlay (matrix theme only) */}
        {currentTheme === 'matrix' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              opacity: 0.12,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            <MatrixMapASCII bounds={bounds} width={containerWidth} height={containerHeight} />
          </div>
        )}

        {/* Videos layer */}
        <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 2 }}>
          {stagePairs.map(({ stage, video, position }) => (
            <VideoPositioner
              key={stage.id}
              stageName={stage.name}
              positionPercent={position}
              isPlaceholder={!video}
            >
              {video ? VideoComponent(video) : null}
            </VideoPositioner>
          ))}
        </div>
      </div>
    )
  }

  // Render mobile stacked layout
  const renderStackedLayout = () => {
    return (
      <div
        className="festival-map-stacked"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xl,
          padding: `0 ${SPACING.lg}`,
        }}
      >
        {stagePairs.map(({ stage, video }) => (
          <div key={stage.id}>
            {/* Stage label */}
            <div
              style={{
                fontSize: '0.75rem',
                fontFamily: 'IBM Plex Mono, monospace',
                color: PALETTE.black,
                opacity: 0.5,
                marginBottom: SPACING.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {stage.name}
            </div>
            {/* Video or placeholder */}
            <div
              style={{
                aspectRatio: '16 / 9',
                backgroundColor: video ? PALETTE.white : PALETTE.warm,
                border: !video ? `1px dashed ${PALETTE.black}20` : 'none',
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {video ? (
                VideoComponent(video)
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    fontFamily: 'IBM Plex Mono, monospace',
                    color: PALETTE.black,
                    opacity: 0.25,
                  }}
                >
                  [ No Video ]
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Render appropriate layout based on screen size
  if (isMobile) {
    return (
      <div style={{ marginTop: SPACING.xl }}>
        {renderStackedLayout()}
      </div>
    )
  }

  return <div style={{ marginTop: SPACING.xl }}>{renderSpatialLayout()}</div>
}
