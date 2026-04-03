'use client'

import { useEffect, type ReactNode } from 'react'

/**
 * Auto-scroll wrapper for case law pages
 * Scrolls to the case law box on mount for better mobile UX when arriving from archive
 */
export function CasePageLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const target = document.getElementById('case-law-box')
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [])

  return <>{children}</>
}
