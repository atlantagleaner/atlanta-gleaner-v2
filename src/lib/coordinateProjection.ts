/**
 * Coordinate projection utilities for Piedmont Park festival map
 * Converts geographic (lat/lon) to normalized screen space (0–1)
 */

import type { ParkBounds } from '@/src/data/types'

/**
 * Project a geographic coordinate to normalized space (0–1)
 * @param lon Longitude
 * @param lat Latitude
 * @param bounds Park bounding box
 * @returns Object with normalized x (0–1) and y (0–1) coordinates
 */
export function projectCoordinates(
  lon: number,
  lat: number,
  bounds: ParkBounds
): { x: number; y: number } {
  const x = (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)
  const y = (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat) // Inverted (lat increases downward in pixels)
  return { x, y }
}

/**
 * Calculate bounding box and aspect ratio from GeoJSON FeatureCollection
 * @param features Array of GeoJSON features
 * @returns Park bounds object for coordinate projection
 */
export function calculateParkBounds(
  features: Array<{ geometry?: { coordinates?: number[][] | number[] | number } }>
): ParkBounds {
  let minLon = Infinity
  let maxLon = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  features.forEach(feature => {
    if (!feature.geometry) return

    const coords = feature.geometry.coordinates as any

    if (!coords) return

    // Handle Point (single [lon, lat])
    if (typeof coords[0] === 'number') {
      const [lon, lat] = coords as [number, number]
      minLon = Math.min(minLon, lon)
      maxLon = Math.max(maxLon, lon)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }

    // Handle LineString or Polygon outer ring (array of [lon, lat])
    if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
      const ring = coords as [number, number][]
      ring.forEach(([lon, lat]) => {
        minLon = Math.min(minLon, lon)
        maxLon = Math.max(maxLon, lon)
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
      })
    }

    // Handle Polygon (array of rings)
    if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      const rings = coords as [number, number][][]
      rings.forEach(ring => {
        ring.forEach(([lon, lat]) => {
          minLon = Math.min(minLon, lon)
          maxLon = Math.max(maxLon, lon)
          minLat = Math.min(minLat, lat)
          maxLat = Math.max(maxLat, lat)
        })
      })
    }
  })

  const width = maxLon - minLon
  const height = maxLat - minLat
  const aspectRatio = width / height

  return {
    minLon,
    maxLon,
    minLat,
    maxLat,
    aspectRatio,
  }
}

/**
 * Convert normalized coordinates (0–1) to CSS percentages
 * @param x Normalized x coordinate (0–1)
 * @param y Normalized y coordinate (0–1)
 * @returns Object with left and top CSS percentage strings
 */
export function normalizedToPercentage(
  x: number,
  y: number
): { left: string; top: string } {
  return {
    left: `${Math.round(x * 100)}%`,
    top: `${Math.round(y * 100)}%`,
  }
}
