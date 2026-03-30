'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { T, PALETTE, BOX_SHELL, BOX_HEADER, FONT } from '@/src/styles/tokens'

export interface CaseData {
  id: string; title: string; citation: string; url: string; snippet: string; coreTerms?: string[];
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function VolumeBox({ label, cases }: { label: string, cases: CaseData[] }) {
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const groupedCases = useMemo(() => {
    return cases.reduce((acc, c) => {
      const foundMonth = MONTHS.find(m => c.snippet.includes(m)) || "Undated";
      if (!acc[foundMonth]) acc[foundMonth] = [];
      acc[foundMonth].push(c);
      return acc;
    }, {} as Record<string, CaseData[]>);
  }, [cases]);

  return (
    <div style={{ ...BOX_SHELL, height: '100%', border: `1px solid ${PALETTE.black}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', background: PALETTE.black }}>
        <h2 style={{ ...BOX_HEADER, color: PALETTE.white, margin: 0 }}>{label}</h2>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {Object.entries(groupedCases).map(([month, monthCases]) => (
          <div key={month} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            <button 
              onClick={() => setOpenMonth(openMonth === month ? null : month)}
              style={{
                width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                background: openMonth === month ? '#fcfcfc' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left'
              }}
            >
              <span style={{ ...T.micro, fontWeight: 700, letterSpacing: '0.12em', color: PALETTE.black }}>{month.toUpperCase()}</span>
              <span style={{ fontSize: '12px', color: PALETTE.black }}>{openMonth === month ? '−' : '+'}</span>
            </button>

            {openMonth === month && (
              <div style={{ padding: '0 16px 16px' }}>
                {monthCases.map(c => (
                  <div key={c.id} style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Link href={c.url} style={{ textDecoration: 'none', color: PALETTE.black }}>
                      <h4 style={{ ...FONT.serif, fontSize: '18px', margin: '0 0 2px 0', fontWeight: 700 }}>{c.title}</h4>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', margin: '0 0 10px 0' }}>{c.citation}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {c.coreTerms?.map(term => (
                          <span key={term} style={{ fontSize: '9px', padding: '2px 5px', background: '#000', color: '#fff', borderRadius: '1px', textTransform: 'uppercase' }}>{term}</span>
                        ))}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}