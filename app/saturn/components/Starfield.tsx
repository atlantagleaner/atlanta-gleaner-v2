'use client'

import React, { useEffect, useState } from 'react'

const generateStars = (count: number) => {
  let boxShadow = ''
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 100)
    const y = Math.floor(Math.random() * 100)
    boxShadow += `${x}vw ${y}vh #FFF`
    if (i < count - 1) boxShadow += ', '
  }
  return boxShadow
}

export default function Starfield() {
  const [smallStars, setSmallStars] = useState('')
  const [mediumStars, setMediumStars] = useState('')
  const [largeStars, setLargeStars] = useState('')

  // Generate fresh random stars on client after hydration
  useEffect(() => {
    setSmallStars(generateStars(150))
    setMediumStars(generateStars(50))
    setLargeStars(generateStars(20))
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <style>{`
        .star-layer-1 { width: 1px; height: 1px; background: transparent; box-shadow: ${smallStars}; }
        .star-layer-2 { width: 2px; height: 2px; background: transparent; box-shadow: ${mediumStars}; }
        .star-layer-3 { width: 3px; height: 3px; background: transparent; box-shadow: ${largeStars}; }
      `}</style>
      <div className="star-layer-1" />
      <div className="star-layer-2" />
      <div className="star-layer-3" />
    </div>
  )
}
