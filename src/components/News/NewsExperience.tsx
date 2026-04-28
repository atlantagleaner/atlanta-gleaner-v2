'use client'

import { useState } from 'react'
import { BlackHoleSimulation } from '@/src/components/News/BlackHoleSimulation'
import { NewsPanel } from '@/src/components/News/NewsPanel'
import { NewsRunwayNav } from '@/src/components/News/NewsRunwayNav'

export function NewsExperience() {
  const [newsOpen, setNewsOpen] = useState(false)

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#020101', overflow: 'hidden', position: 'relative' }}>
      <NewsRunwayNav newsOpen={newsOpen} onToggleNews={() => setNewsOpen((value) => !value)} />

      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <BlackHoleSimulation controlsEnabled={!newsOpen} />
      </div>

      <NewsPanel open={newsOpen} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 6,
          background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.6) 100%)',
        }}
      />
    </div>
  )
}
