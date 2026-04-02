'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { T, PALETTE, BOX_SHELL, BOX_HEADER, FONT } from '@/src/styles/tokens'

export interface CaseData {
  id: string;
  title: string;
  citation: string;
  fullDate: string;
  url: string;
  month: string;
  year: string;
  snippet: string;
  coreTerms?: string[];
}

const MONTH_ORDER = ["December", "November", "October", "September", "August", "July", "June", "May", "April", "March", "February", "January", "Undated"];

export function VolumeBox({ label, cases }: { label: string, cases: CaseData[] }) {
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const groupedCases = useMemo(() => {
    const groups = cases.reduce((acc, c) => {
      const m = c.month || "Undated";
      if (!acc[m]) acc[m] = [];
      acc[m].push(c);
      return acc;
    }, {} as Record<string, CaseData[]>);
    
    return Object.keys(groups)
      .sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b))
      .reduce((acc, key) => { acc[key] = groups[key]; return acc; }, {} as Record<string, CaseData[]>);
  }, [cases]);

  return (
    <div style={{ ...BOX_SHELL, height: '100%', border: `1px solid ${PALETTE.black}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', background: PALETTE.black }}>
        <h2 style={{ ...BOX_HEADER, color: PALETTE.white, margin: 0 }}>{label}</h2>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, background: PALETTE.white }}>
        {Object.entries(groupedCases).map(([month, monthCases]) => (
          <div key={month} style={{ borderBottom: '1px solid var(--palette-rule-md)' }}>
            <button 
              onClick={() => setOpenMonth(openMonth === month ? null : month)}
              style={{
                width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
                background: openMonth === month ? '#F7F7F7' : 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left'
              }}
            >
              <span style={{ ...T.micro, fontWeight: 700, letterSpacing: '0.12em', color: PALETTE.black }}>{month.toUpperCase()}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>{openMonth === month ? '−' : '+'}</span>
            </button>

            {openMonth === month && (
              <div style={{ padding: '0 16px 16px' }}>
                {monthCases.map(c => (
                  <div key={c.id} style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Link href={c.url} style={{ textDecoration: 'none', color: PALETTE.black, display: 'block' }}>
                      <h4 style={{ ...FONT.serif, fontSize: '18px', margin: '0 0 4px 0', fontWeight: 700 }}>{c.title}</h4>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#666', margin: '0' }}>
                        {c.citation} · {c.fullDate}
                      </p>
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