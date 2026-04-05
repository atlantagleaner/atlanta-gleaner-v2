'use client'

import { PALETTE, T, SIZE_SM, SIZE_MD, PAGE_MAX_W, PAGE_TITLE_BLOCK } from '@/src/styles/tokens'
import { useDateTime } from '@/src/hooks'

export function DateClock() {
  const { dateStr, timeStr } = useDateTime()

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