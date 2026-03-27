'use client'

import { type ReactNode } from 'react'
import { PALETTE } from '@/src/styles/tokens'

export function AnalogShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', width: '100%', background: PALETTE.warm }}>
      {children}
    </div>
  )
}
