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
        ? new Date(publishedDate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      )
    : ''

  const timeStr = now
    ? now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    : ''

  return { dateStr, timeStr, now, mounted }
}
