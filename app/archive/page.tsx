'use client'

import { useEffect, useState, useMemo } from 'react'
import { Banner } from '@/src/components/Banner'
import { FourResizablePanels } from '@/src/components/FourResizablePanels'
import { VolumeBox, type CaseData } from '@/src/components/VolumeBox'
import { PAGE_TITLE_BLOCK, PALETTE, T } from '@/src/styles/tokens'

export default function ArchivePage() {
  const [allCases, setAllCases] = useState<CaseData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/search-index.json').then(res => res.json()).then(data => setAllCases(data));
  }, []);

  const filtered = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return allCases.filter(c => 
      [c.title, c.citation, c.fullDate, ...(c.coreTerms || [])].join(' ').toLowerCase().includes(lower)
    );
  }, [allCases, searchTerm]);

  const vol1 = useMemo(() => filtered.filter(c => ['2022', '2023'].includes(c.year)), [filtered]);
  const vol2 = useMemo(() => filtered.filter(c => c.year === '2024'), [filtered]);
  const vol3 = useMemo(() => filtered.filter(c => c.year === '2025'), [filtered]);
  const vol4 = useMemo(() => filtered.filter(c => c.year === '2026'), [filtered]);

  return (
    <>
      <Banner />
      <main style={{ padding: '0 20px 80px', maxWidth: '1800px', margin: '0 auto' }}>
        <div style={PAGE_TITLE_BLOCK}><h1 style={{ ...T.pageTitle, margin: 0 }}>Archive</h1></div>

        <div style={{ marginBottom: '32px', maxWidth: '480px' }}>
          <input 
            type="text" 
            placeholder="SEARCH RECORDS..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', border: `1px solid ${PALETTE.black}`, fontFamily: 'var(--font-mono)', fontSize: '11px' }} 
          />
        </div>

        <div style={{ paddingTop: '8px' }}>
          <FourResizablePanels
            col1={{ label: 'Roll-A · Volume IV', node: <VolumeBox label="Volume IV: 2026" cases={vol4} /> }}
            col2={{ label: 'Roll-B · Volume III', node: <VolumeBox label="Volume III: 2025" cases={vol3} /> }}
            col3={{ label: 'Roll-C · Volume II', node: <VolumeBox label="Volume II: 2024" cases={vol2} /> }}
            col4={{ label: 'Roll-D · Volume I', node: <VolumeBox label="Volume I: 2022-2023" cases={vol1} /> }}
          />
        </div>
      </main>
    </>
  )
}