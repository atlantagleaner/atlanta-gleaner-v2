'use client'

import { useEffect } from 'react'
import { TarotModule } from './TarotModule'
import { AstrologyModule } from './AstrologyModule'
import { CrystalBallModule } from './CrystalBallModule'
import { BlackjackModule } from './BlackjackModule'
import { DraggableModule } from './DraggableModule'
import { SPACING, PAGE_BOTTOM_PADDING_DESKTOP } from '@/src/styles/tokens'

export function DraggableModuleWrapper() {
  // Force Saturn theme on this page
  useEffect(() => {
    const html = document.documentElement
    html.dataset.theme = 'saturn'
  }, [])

  return (
    <div
      className="saturn-bottom"
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '800px',
        maxWidth: '100vw',
        padding: `0 ${SPACING.lg} ${PAGE_BOTTOM_PADDING_DESKTOP}`,
      }}
    >
      <DraggableModule
        id="tarot"
        label="I. The Cards"
        defaultX={32}
        defaultY={120}
        defaultWidth={340}
        defaultHeight={460}
        minWidth={280}
        minHeight={360}
      >
        <TarotModule />
      </DraggableModule>

      <DraggableModule
        id="astrology"
        label="II. The Wheel"
        defaultX={420}
        defaultY={140}
        defaultWidth={320}
        defaultHeight={420}
        minWidth={260}
        minHeight={340}
      >
        <AstrologyModule />
      </DraggableModule>

      <DraggableModule
        id="crystal"
        label="III. The Sphere"
        defaultX={780}
        defaultY={160}
        defaultWidth={300}
        defaultHeight={400}
        minWidth={240}
        minHeight={320}
      >
        <CrystalBallModule />
      </DraggableModule>

      <DraggableModule
        id="blackjack"
        label="IV. The Accounting"
        defaultX={160}
        defaultY={620}
        defaultWidth={360}
        defaultHeight={520}
        minWidth={300}
        minHeight={420}
      >
        <BlackjackModule />
      </DraggableModule>
    </div>
  )
}
