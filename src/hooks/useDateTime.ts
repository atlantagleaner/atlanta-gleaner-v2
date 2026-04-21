import { useState, useEffect } from 'react'

/**
 * Hook that manages current date/time state and formats it for display.
 * Updates every second.
 *
 * @param publishedDate - Optional ISO date string (e.g., for case pages). If provided, uses this date instead of today.
 * @returns Object with dateStr, timeStr, now (raw Date object), and mounted (true after hydration)
 */
export function useDateTime(publishedDate?: string) {
  const [now, setNow] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateStr = now
    ? (publishedDate
        ? (() => {
            const d = new Date(publishedDate + 'T12:00:00')
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            const year = String(d.getFullYear()).slice(-2)
            return `${month}-${day}-${year}`
          })()
        : (() => {
            const month = String(now.getMonth() + 1).padStart(2, '0')
            const day = String(now.getDate()).padStart(2, '0')
            const year = String(now.getFullYear()).slice(-2)
            return `${month}-${day}-${year}`
          })()
      )
    : ''

  const timeStr = now
    ? now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    : ''

  return { dateStr, timeStr, now, mounted }
}
