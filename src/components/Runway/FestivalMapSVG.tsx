/**
 * SVG map of Piedmont Park showing festival boundaries and key features
 * Renders park boundary, lake, stage locations, entrances, and food row
 */

import festivalsRaw from '@/src/data/piedmont-park-festival.geojson.json'
import type { ParkBounds } from '@/src/data/types'
import { calculateParkBounds, projectCoordinates } from '@/src/lib/coordinateProjection'
import { PALETTE } from '@/src/styles/tokens'

interface FestivalMapSVGProps {
  theme?: string
  className?: string
}

/**
 * SVG map rendering for Piedmont Park festival
 * Uses GeoJSON features to draw boundaries, water, stages, etc.
 */
export function FestivalMapSVG({ theme = 'default', className = '' }: FestivalMapSVGProps) {
  // Type assertion for GeoJSON
  const geojson = festivalsRaw as any

  // Calculate bounds from all features
  const bounds = calculateParkBounds(geojson.features as any)

  // SVG aspect ratio matches park bounds
  const svgWidth = 1000
  const svgHeight = svgWidth / bounds.aspectRatio

  // Feature extraction helpers
  const getFeaturesByType = (type: string) =>
    geojson.features.filter((f: any) => (f.properties as any)?.type === type)

  const getBoundaryPolygon = () => {
    const feature = geojson.features.find((f: any) => (f.properties as any)?.id === 'park-boundary')
    if (!feature || feature.geometry?.type !== 'Polygon') return null
    return feature
  }

  const getLakePolygon = () => {
    const feature = geojson.features.find((f: any) => (f.properties as any)?.id === 'lake-clara-meer')
    if (!feature || feature.geometry?.type !== 'Polygon') return null
    return feature
  }

  const getFoodRow = () => {
    const feature = geojson.features.find((f: any) => (f.properties as any)?.id === 'food-row')
    if (!feature || feature.geometry?.type !== 'LineString') return null
    return feature
  }

  const getStages = () => {
    return geojson.features.filter(
      (f: any) => (f.properties as any)?.type === 'stage' && f.geometry?.type === 'Point'
    )
  }

  // SVG path generators
  const polygonToPath = (coords: number[][][]): string => {
    if (!coords[0]) return ''
    const ring = coords[0]
    return ring
      .map(([lon, lat]: any, i: number) => {
        const { x, y } = projectCoordinates(lon, lat, bounds)
        const px = x * svgWidth
        const py = y * svgHeight
        return `${i === 0 ? 'M' : 'L'} ${px} ${py}`
      })
      .join(' ')
  }

  const linestringToPath = (coords: number[][]): string => {
    return coords
      .map(([lon, lat]: any, i: number) => {
        const { x, y } = projectCoordinates(lon, lat, bounds)
        const px = x * svgWidth
        const py = y * svgHeight
        return `${i === 0 ? 'M' : 'L'} ${px} ${py}`
      })
      .join(' ')
  }

  const pointToCircle = (coord: number[]): { cx: number; cy: number } => {
    const [lon, lat] = coord as [number, number]
    const { x, y } = projectCoordinates(lon, lat, bounds)
    return {
      cx: x * svgWidth,
      cy: y * svgHeight,
    }
  }

  // Get boundary styles (use design tokens for colors)
  const boundaryStroke = PALETTE.black
  const boundaryFill = `${PALETTE.white}20` // Subtle fill

  // Get theme-specific opacity
  const getOpacity = (): number => {
    if (theme === 'matrix') {
      return 0.15 // Very subtle for matrix theme (ASCII overlay takes over)
    }
    return 0.2 // Default theme opacity
  }

  const opacity = getOpacity()

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className={`festival-map-svg ${className}`}
      style={{
        width: '100%',
        height: 'auto',
        opacity,
      }}
      role="img"
      aria-label="Piedmont Park Festival Map"
    >
      {/* Park boundary */}
      {getBoundaryPolygon() && (
        <path
          d={polygonToPath((getBoundaryPolygon()?.geometry as any)?.coordinates)}
          stroke={boundaryStroke}
          strokeWidth={2}
          fill={boundaryFill}
          opacity={0.8}
        />
      )}

      {/* Lake Clara Meer */}
      {getLakePolygon() && (
        <path
          d={polygonToPath((getLakePolygon()?.geometry as any)?.coordinates)}
          stroke={`${PALETTE.black}40`}
          strokeWidth={1}
          fill={`${PALETTE.black}15`}
          opacity={0.6}
        />
      )}

      {/* Food truck row */}
      {getFoodRow() && (
        <path
          d={linestringToPath((getFoodRow()?.geometry as any)?.coordinates)}
          stroke={`${PALETTE.black}30`}
          strokeWidth={3}
          fill="none"
          strokeDasharray="5,5"
          opacity={0.5}
        />
      )}

      {/* Stage markers */}
      {getStages().map((stage: any) => {
        const coords = (stage.geometry as any).coordinates as [number, number]
        const props = stage.properties as any
        const { cx, cy } = pointToCircle(coords)
        const stageColor = `${PALETTE.black}40`

        return (
          <g key={props.id}>
            {/* Stage circle */}
            <circle cx={cx} cy={cy} r={8} fill={stageColor} opacity={0.7} />
            {/* Stage label */}
            <text
              x={cx}
              y={cy - 15}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill={PALETTE.black}
              opacity={0.5}
              fontFamily="IBM Plex Mono, monospace"
            >
              {props.name.split(' ')[0]}
            </text>
          </g>
        )
      })}

      {/* Entrance markers */}
      {geojson.features
        .filter((f: any) => (f.properties as any)?.type === 'entrance')
        .map((entrance: any) => {
          const coords = (entrance.geometry as any).coordinates as [number, number]
          const props = entrance.properties as any
          const { cx, cy } = pointToCircle(coords)

          return (
            <g key={props.id}>
              <rect
                x={cx - 5}
                y={cy - 5}
                width={10}
                height={10}
                fill={`${PALETTE.black}30`}
                opacity={0.5}
              />
            </g>
          )
        })}
    </svg>
  )
}
