import { useState, useEffect } from 'react'

/**
 * Hook that detects if viewport is in mobile mode based on a breakpoint.
 * Updates on window resize and immediately on mount.
 *
 * @param breakpoint - Pixel width threshold for mobile detection. Defaults to 768px.
 * @returns Boolean: true if viewport width is less than breakpoint
 */
export function useMobileDetect(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}
