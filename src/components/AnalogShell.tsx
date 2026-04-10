'use client'

import { type ReactNode } from 'react'
import { PALETTE } from '@/src/styles/tokens'
import { usePathname } from 'next/navigation'

export function AnalogShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  
  // Routes that manage their own full-screen isolation
  const isIsolated = pathname === '/saturn' || pathname === '/runway/orbital'
  if (isIsolated) return <>{children}</>

  return (
    <div className="ag-analog-shell" style={{ flex: 1, overflow: 'auto', background: PALETTE.warm }}>
      {children}
    </div>
  )
}
