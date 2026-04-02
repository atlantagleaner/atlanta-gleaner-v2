'use client'

import { useState, useEffect } from 'react'
import { PALETTE, T, SIZE_SM, SIZE_MD, PAGE_MAX_W, PAGE_TITLE_BLOCK } from '@/src/styles/tokens'

export function DateClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateStr = now
    ? now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  const timeStr = now
    ? now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    : ''

  return (
    <div style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: '0 20px' }}>
      <div style={PAGE_TITLE_BLOCK}>
        <h1 style={{ ...T.pageTitle, fontSize: SIZE_MD, color: PALETTE.black, margin: '0 0 6px 0' }}>
          {dateStr}
        </h1>
        <span style={{
          ...T.nav,
          fontSize: SIZE_SM,
          color: PALETTE.black,
          opacity: 0.45,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {timeStr}
        </span>
      </div>
    </div>
  )
}