'use client'

import { useEffect, useState, useMemo } from 'react'
import { Banner } from '@/src/components/Banner'
import { FourResizablePanels } from '@/src/components/FourResizablePanels'
import { VolumeBox, type CaseData } from '@/src/components/VolumeBox'
import { PAGE_TITLE_BLOCK, PALETTE, T } from '@/src/styles/tokens'

export default function ArchivePage() {
  const [allCases, setAllCases] = useState<CaseData[]>([]);

  // OPTIMIZATION: Fetch the data exactly ONE time when the page loads.
  useEffect(() => {
    fetch('/search-index.json')
      .then(res => res.json())
      .then(data => setAllCases(data));
  }, []);

  // OPTIMIZATION: Quickly sort the master list into the 4 volumes using useMemo
  const vol1Cases = useMemo(() => allCases.filter(c => c.snippet.includes('2022') || c.snippet.includes('2023')), [allCases]);
  const vol2Cases = useMemo(() => allCases.filter(c => c.snippet.includes('2024')), [allCases]);
  const vol3Cases = useMemo(() => allCases.filter(c => c.snippet.includes('2025')), [allCases]);
  const vol4Cases = useMemo(() => allCases.filter(c => c.snippet.includes('2026')), [allCases]);

  return (
    <>
      <Banner />

      <main style={{ padding: '0 20px 80px', maxWidth: '1800px', margin: '0 auto' }}>
        
        <div style={PAGE_TITLE_BLOCK}>
          <h1 style={{ ...T.pageTitle, color: PALETTE.black, margin: 0 }}>
            Archive
          </h1>
        </div>

        <div style={{ paddingTop: '24px' }}>
          <FourResizablePanels
            col1={{
              label: 'Roll-A · Volume I',
              node: <VolumeBox label="Volume I: 2022-2023" cases={vol1Cases} />
            }}
            col2={{
              label: 'Roll-B · Volume II',
              node: <VolumeBox label="Volume II: 2024" cases={vol2Cases} />
            }}
            col3={{
              label: 'Roll-C · Volume III',
              node: <VolumeBox label="Volume III: 2025" cases={vol3Cases} />
            }}
            col4={{
              label: 'Roll-D · Volume IV',
              node: <VolumeBox label="Volume IV: 2026" cases={vol4Cases} />
            }}
          />
        </div>

      </main>
    </>
  )
}