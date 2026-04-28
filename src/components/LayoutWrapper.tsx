'use client'

import { usePathname } from 'next/navigation'
import { NavBar } from './NavBar'
import { OrbitalNavBar } from './OrbitalNavBar'
import { AnalogShell } from './AnalogShell'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Isolated pages: orbital pages (landing/runway) and independent pages (about/vault)
  const isIsolatedPage = pathname === '/' || pathname === '/runway' || pathname.startsWith('/runway/') || pathname === '/about' || pathname === '/vault' || pathname === '/saturn2'

  // Case law pages use OrbitalNavBar instead of standard NavBar
  const isCaselawPage = pathname.startsWith('/cases/')

  if (isIsolatedPage) {
    return <>{children}</>
  }

  return (
    <>
      {isCaselawPage ? <OrbitalNavBar /> : <NavBar />}
      <AnalogShell>
        {children}
      </AnalogShell>
    </>
  )
}
