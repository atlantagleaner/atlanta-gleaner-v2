'use client'

import { useEffect, useState } from 'react'
import { SaturnNavbar } from './components/SaturnNavbar'
import SaturnScene from '../components/SaturnScene'

export default function SaturnPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [resetOrbit, setResetOrbit] = useState<(() => void) | null>(null)

  // Apply Saturn theme to document element for global CSS selectors
  useEffect(() => {
    document.documentElement.setAttribute('data-saturn', 'true')
    return () => document.documentElement.removeAttribute('data-saturn')
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div data-saturn="true" suppressHydrationWarning style={{ minHeight: '100vh', backgroundColor: '#0B0820', position: 'relative', overflowX: 'hidden' }}>
      {/* Saturn Navbar */}
      <SaturnNavbar onResetOrbit={resetOrbit || undefined} />

      {/* Interactive Saturn Simulation */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
      }}>
        <SaturnScene
          isInteractive={true}
          isMobile={isMobile}
          onSceneReady={(camera, orbReset) => setResetOrbit(() => orbReset)}
        />
      </div>
    </div>
  )
}
