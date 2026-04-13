'use client'

import { usePathname } from 'next/navigation'
import { NavBar } from './NavBar'
import { AnalogShell } from './AnalogShell'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Isolated pages: orbital pages (landing/runway) and independent pages (about/vault)
  const isIsolatedPage = pathname === '/' || pathname === '/runway' || pathname.startsWith('/runway/') || pathname === '/about' || pathname === '/vault'

  if (isIsolatedPage) {
    return <>{children}</>
  }

  return (
    <>
      <NavBar />
      <AnalogShell>
        {children}
      </AnalogShell>
    </>
  )
}
