'use client'

import { useEffect, useState } from 'react'
import { PALETTE } from '@/src/styles/tokens'
import { Banner } from './Banner'
import { NewsBox } from './NewsBox'
import CaseLawBox from './CaseLawBox'
import { FarSideBox } from './FarSideBox'
import { ResizablePanels } from './ResizablePanels'
import type { CaseLaw } from '@/src/data/types'

export function CasePageMain({ caseData }: { caseData: CaseLaw }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <main className="ag-case-main" style={{ minHeight: '100vh', background: PALETTE.warm, paddingTop: isMobile ? '100px' : '120px' }}>
      <Banner />
      <ResizablePanels
        left={{
          label: 'Latest News',
          node:  <NewsBox />,
        }}
        center={{
          label: 'Case Law Updates',
          node:  <CaseLawBox caseData={caseData} />,
        }}
        right={{
          label: 'The Far Side',
          node:  <FarSideBox />,
        }}
        mobileInitialOpen={{ 0: false, 1: true, 2: false }}
        mobileOrder={[2, 0, 1]}
      />
    </main>
  )
}
