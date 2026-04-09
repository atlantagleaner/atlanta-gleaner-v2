'use client'

import { type ReactNode } from 'react'
import { PALETTE } from '@/src/styles/tokens'

export function AnalogShell({ children }: { children: ReactNode }) {
  return (
    <div className="ag-analog-shell" style={{ flex: 1, overflow: 'auto', background: PALETTE.warm }}>
      {children}
    </div>
  )
}