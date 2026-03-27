// ─────────────────────────────────────────────────────────────────────────────
// Homepage — three resizable panels + masthead
// ─────────────────────────────────────────────────────────────────────────────

import { Banner } from '@/src/components/Banner'
import { DateClock } from '@/src/components/DateClock'
import { NewsBox } from '@/src/components/NewsBox'
import { CaseLawBox } from '@/src/components/CaseLawBox'
import { FarSideBox } from '@/src/components/FarSideBox'
import { ResizablePanels } from '@/src/components/ResizablePanels'

export default function HomePage() {
  return (
    <>
      {/* Masthead */}
      <Banner />

      {/* Date + live clock */}
      <DateClock />

      {/* Three resizable content panels */}
      <div style={{ paddingTop: '24px' }}>
        <ResizablePanels
          left={{
            label: 'Roll-A · News',
            node: <NewsBox />,
          }}
          center={{
            label: 'Roll-B · Case Law',
            node: <CaseLawBox />,
          }}
          right={{
            label: 'Roll-C · The Far Side',
            node: <FarSideBox publishedDate="March 25, 2026" />,
          }}
        />
      </div>
    </>
  )
}
