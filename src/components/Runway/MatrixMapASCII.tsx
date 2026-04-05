/**
 * ASCII art topographic map overlay for matrix theme
 * Shows Piedmont Park geography (boundary and lake Clara Meer)
 * No festival infrastructure - just the park's natural features
 * Only visible when data-theme="matrix"
 */

import festivalsRaw from '@/src/data/piedmont-park-festival.geojson.json'
import type { ParkBounds } from '@/src/data/types'
import { calculateParkBounds, projectCoordinates } from '@/src/lib/coordinateProjection'
import { PALETTE } from '@/src/styles/tokens'

interface MatrixMapASCIIProps {
  bounds: ParkBounds
  width: number
  height: number
  className?: string
}

/**
 * Generate ASCII art map grid based on park bounds
 * Uses Unicode box-drawing characters for retro IBM BASIC aesthetic
 */
export function MatrixMapASCII({ bounds, width, height, className = '' }: MatrixMapASCIIProps) {
  const geojson = festivalsRaw as any

  // Create a character grid to represent the map
  const gridWidth = Math.floor(width / 8) // Each char is ~8px wide
  const gridHeight = Math.floor(height / 12) // Each char is ~12px tall

  // Initialize empty grid
  const grid: string[][] = Array(gridHeight)
    .fill(null)
    .map(() => Array(gridWidth).fill(' '))

  // Helper to plot ASCII character at normalized coordinates
  const plotChar = (lon: number, lat: number, char: string) => {
    const { x, y } = projectCoordinates(lon, lat, bounds)
    const gridX = Math.floor(x * (gridWidth - 1))
    const gridY = Math.floor(y * (gridHeight - 1))

    if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
      grid[gridY][gridX] = char
    }
  }

  // Helper to draw a line between two points
  const plotLine = (lon1: number, lat1: number, lon2: number, lat2: number, char: string) => {
    const { x: x1, y: y1 } = projectCoordinates(lon1, lat1, bounds)
    const { x: x2, y: y2 } = projectCoordinates(lon2, lat2, bounds)

    const gx1 = Math.floor(x1 * (gridWidth - 1))
    const gy1 = Math.floor(y1 * (gridHeight - 1))
    const gx2 = Math.floor(x2 * (gridWidth - 1))
    const gy2 = Math.floor(y2 * (gridHeight - 1))

    // Simple line drawing using Bresenham-like approach
    const dx = Math.abs(gx2 - gx1)
    const dy = Math.abs(gy2 - gy1)
    const sx = gx1 < gx2 ? 1 : -1
    const sy = gy1 < gy2 ? 1 : -1
    let err = dx - dy

    let x = gx1
    let y = gy1

    while (true) {
      if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
        grid[y][x] = char
      }

      if (x === gx2 && y === gy2) break

      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x += sx
      }
      if (e2 < dx) {
        err += dx
        y += sy
      }
    }
  }

  // Draw park boundary (topographic outline)
  const boundary = geojson.features.find((f: any) => (f.properties as any)?.id === 'park-boundary')
  if (boundary && boundary.geometry?.type === 'Polygon') {
    const coords = (boundary.geometry as any).coordinates[0]
    // Draw lines between consecutive boundary points
    for (let i = 0; i < coords.length - 1; i++) {
      const [lon1, lat1] = coords[i] as [number, number]
      const [lon2, lat2] = coords[i + 1] as [number, number]
      plotLine(lon1, lat1, lon2, lat2, '─')
    }
  }

  // Draw lake Clara Meer (water feature)
  const lake = geojson.features.find((f: any) => (f.properties as any)?.id === 'lake-clara-meer')
  if (lake && lake.geometry?.type === 'Polygon') {
    const coords = (lake.geometry as any).coordinates[0]
    // Draw lake outline with water symbol
    for (let i = 0; i < coords.length - 1; i++) {
      const [lon1, lat1] = coords[i] as [number, number]
      const [lon2, lat2] = coords[i + 1] as [number, number]
      plotLine(lon1, lat1, lon2, lat2, '~')
    }
  }

  // Convert grid to string with proper line breaks
  const mapText = grid.map(row => row.join('')).join('\n')

  return (
    <pre
      className={`matrix-map-ascii ${className}`}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.65rem',
        lineHeight: '1.2',
        color: PALETTE.black,
        whiteSpace: 'pre',
        overflow: 'hidden',
        pointerEvents: 'none',
        margin: 0,
        padding: 0,
      }}
    >
      {mapText}
    </pre>
  )
}
