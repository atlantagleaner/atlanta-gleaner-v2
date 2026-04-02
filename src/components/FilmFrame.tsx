'use client'

// ─────────────────────────────────────────────────────────────────────────────
// FilmFrame — wraps a content box in microfiche film artifacts.
//   Each instance generates a unique set of:
//     • vertical drag-scratches (bright/dark, slightly wobbly)
//     • dust particles and hair strands
//     • exposure variation (hot-spot or shadow spot)
//     • mechanical tray shift (translate + micro-rotate)
//     • warm film tint
//   All values are seeded via LCG so they are stable after hydration.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, type ReactNode, type CSSProperties } from 'react'

// ── Deterministic LCG pseudo-random ──────────────────────────────────────────
function lcg(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return (s >>> 0) / 0xFFFFFFFF
  }
}

// ── Artifact types ────────────────────────────────────────────────────────────
interface Scratch {
  points: Array<{ x: number; y: number }>
  width: number
  opacity: number
  color: string   // bright (emulsion scraped) or dark (deposit)
}

interface Dust {
  x: number; y: number
  rx: number; ry: number
  angle: number; opacity: number
}

interface Hair {
  d: string
  width: number
  opacity: number
}

interface Artifacts {
  id: string
  shiftX: number; shiftY: number; rotate: number; blur: number
  spotX: number; spotY: number; spotBright: boolean; spotOpacity: number
  filmTint: number
  scratches: Scratch[]
  dust: Dust[]
  hairs: Hair[]
}

// ── Core generator ────────────────────────────────────────────────────────────
function generate(seed: number): Artifacts {
  const r   = lcg(seed)
  const id  = seed.toString(36)

  // Mechanical tray shift
  const shiftX = (r() - 0.5) * 2.8
  const shiftY = (r() - 0.5) * 1.8
  const rotate = (r() - 0.5) * 0.30
  const blur   = r() * 0.28          // max 0.28 px — keeps text legible

  // Film tint (warm cream)
  const filmTint = 0.015 + r() * 0.045

  // Exposure variation
  const spotX      = 12 + r() * 76
  const spotY      = 10 + r() * 80
  const spotBright = r() > 0.30       // mostly bright hotspots
  const spotOpacity = 0.04 + r() * 0.10

  // ── Vertical drag scratches ─────────────────────────────────────────────
  const scratchCount = Math.floor(r() * 3.8) + 1   // 1–4
  const scratches: Scratch[] = Array.from({ length: scratchCount }, () => {
    const x       = r() * 96 + 2
    const wobble  = 0.55
    const segs    = 7
    const points  = Array.from({ length: segs }, (_, i) => ({
      x: x + (r() - 0.5) * wobble,
      y: -4 + (i / (segs - 1)) * 108,
    }))
    return {
      points,
      width:   0.22 + r() * 0.68,
      opacity: 0.14 + r() * 0.32,
      color:   r() > 0.50 ? 'rgba(255,252,235,1)' : 'rgba(6,4,1,1)',
    }
  })

  // ── Dust particles ──────────────────────────────────────────────────────
  const dustCount = Math.floor(r() * 4.5) + 2   // 2–6
  const dust: Dust[] = Array.from({ length: dustCount }, () => ({
    x:       r() * 100,
    y:       r() * 100,
    rx:      0.35 + r() * 1.5,
    ry:      0.20 + r() * 0.80,
    angle:   r() * 180,
    opacity: 0.09 + r() * 0.22,
  }))

  // ── Hair strands ────────────────────────────────────────────────────────
  const hairCount = Math.floor(r() * 2.6)   // 0, 1, or 2
  const hairs: Hair[] = Array.from({ length: hairCount }, () => {
    const x1 = r() * 100, y1 = r() * 100
    const dx = (r() - 0.5) * 28, dy = (r() - 0.5) * 38
    const cx = x1 + dx * 0.5 + (r() - 0.5) * 14
    const cy = y1 + dy * 0.5 + (r() - 0.5) * 14
    return {
      d:       `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${(x1+dx).toFixed(1)} ${(y1+dy).toFixed(1)}`,
      width:   0.28 + r() * 0.52,
      opacity: 0.11 + r() * 0.24,
    }
  })

  return { id, shiftX, shiftY, rotate, blur, filmTint, spotX, spotY, spotBright, spotOpacity, scratches, dust, hairs }
}

// ── Component ─────────────────────────────────────────────────────────────────
interface FilmFrameProps {
  children: ReactNode
  style?: CSSProperties
}

export function FilmFrame({ children, style }: FilmFrameProps) {
  const [seed, setSeed] = useState<number | null>(null)

  // Randomise only after hydration — prevents SSR/client mismatch
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 999983))
  }, [])

  const a = useMemo(() => (seed !== null ? generate(seed) : null), [seed])

  return (
    <div
      style={{
        position: 'relative',
        height:   '100%',
        ...(a ? {
          transform: `translate(${a.shiftX}px, ${a.shiftY}px) rotate(${a.rotate}deg)`,
          filter:    a.blur > 0.05 ? `blur(${a.blur}px)` : undefined,
        } : {}),
        ...style,
      }}
    >
      {/* Warm film tint — multiply blend so it only tones, doesn't wash out */}
      {a && (
        <div style={{
          position:      'absolute',
          inset:         0,
          background:    `rgba(190, 160, 85, ${a.filmTint})`,
          pointerEvents: 'none',
          mixBlendMode:  'multiply',
          zIndex:        1,
        }} />
      )}

      {/* Content */}
      <div style={{ position: 'relative', height: '100%' }}>
        {children}
      </div>

      {/* ── SVG artifact overlay ── */}
      {a && (
        <svg
          aria-hidden="true"
          style={{
            position:      'absolute',
            inset:         0,
            width:         '100%',
            height:        '100%',
            pointerEvents: 'none',
            zIndex:        100,
            overflow:      'hidden',
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient
              id={`ag-spot-${a.id}`}
              cx={`${a.spotX}%`} cy={`${a.spotY}%`}
              r="48%"
              gradientUnits="objectBoundingBox"
            >
              <stop
                offset="0%"
                stopColor={a.spotBright ? '#fffbdc' : '#000000'}
                stopOpacity={a.spotOpacity}
              />
              <stop offset="100%"
                stopColor={a.spotBright ? '#fffbdc' : '#000000'}
                stopOpacity="0"
              />
            </radialGradient>
          </defs>

          {/* Exposure variation */}
          <rect width="100" height="100" fill={`url(#ag-spot-${a.id})`} />

          {/* Vertical drag scratches */}
          {a.scratches.map((s, i) => {
            const d = s.points
              .map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
              .join(' ')
            return (
              <path
                key={i}
                d={d}
                stroke={s.color}
                strokeWidth={s.width}
                fill="none"
                opacity={s.opacity}
                strokeLinecap="round"
              />
            )
          })}

          {/* Dust particles */}
          {a.dust.map((d, i) => (
            <ellipse
              key={i}
              cx={d.x} cy={d.y}
              rx={d.rx} ry={d.ry}
              transform={`rotate(${d.angle} ${d.x} ${d.y})`}
              fill="rgba(12,8,2,1)"
              opacity={d.opacity}
            />
          ))}

          {/* Hair strands */}
          {a.hairs.map((h, i) => (
            <path
              key={i}
              d={h.d}
              stroke="rgba(12,8,2,1)"
              strokeWidth={h.width}
              fill="none"
              opacity={h.opacity}
              strokeLinecap="round"
            />
          ))}
        </svg>
      )}
    </div>
  )
}