'use client'

import React from 'react'

// Deterministic star generation using seeded random
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

const generateDeterministicStars = (count: number, seedStart: number) => {
  let boxShadow = ''
  let seed = seedStart
  for (let i = 0; i < count; i++) {
    const x = Math.floor(seededRandom(seed++) * 100)
    const y = Math.floor(seededRandom(seed++) * 100)
    boxShadow += `${x}vw ${y}vh #FFF`
    if (i < count - 1) boxShadow += ', '
  }
  return boxShadow
}

// Pre-generate deterministic star patterns (consistent across server and client)
const SMALL_STARS = generateDeterministicStars(150, 1001)
const MEDIUM_STARS = generateDeterministicStars(50, 2001)
const LARGE_STARS = generateDeterministicStars(20, 3001)

export default function Starfield() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <style>{`
        .star-layer-1 { width: 1px; height: 1px; background: transparent; box-shadow: ${SMALL_STARS}; }
        .star-layer-2 { width: 2px; height: 2px; background: transparent; box-shadow: ${MEDIUM_STARS}; }
        .star-layer-3 { width: 3px; height: 3px; background: transparent; box-shadow: ${LARGE_STARS}; }
      `}</style>
      <div className="star-layer-1" />
      <div className="star-layer-2" />
      <div className="star-layer-3" />
    </div>
  )
}
