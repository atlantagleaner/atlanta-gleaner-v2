import { useState, useEffect } from 'react'

/**
 * Hook that detects if viewport is in mobile mode based on a breakpoint.
 * Updates on window resize and immediately on mount.
 * Returns both isMobile state and mounted flag to defer rendering until after hydration.
 *
 * @param breakpoint - Pixel width threshold for mobile detection. Defaults to 768px.
 * @returns Object with isMobile (boolean) and mounted (boolean for hydration tracking)
 */
export function useMobileDetect(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return { isMobile, mounted }
}
