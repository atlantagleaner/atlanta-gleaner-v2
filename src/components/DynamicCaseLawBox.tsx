'use client'

import React from 'react'
import { PALETTE, FONT, T, BOX_SHELL, ITEM_RULE } from '@/src/styles/tokens'

function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value || value === "undefined") return null
  return (
    <div style={{ position: 'relative', paddingTop: '8px', paddingBottom: '8px', paddingLeft: '160px', ...ITEM_RULE }}>
      <span style={{ ...T.micro, position: 'absolute', left: 0, top: '10px', width: '140px', fontWeight: 700 }}>{label.toUpperCase()}:</span>
      <span style={{ ...FONT.sans, display: 'block', fontSize: '13px', lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}

export function DynamicCaseLawBox({ caseMeta, htmlContent }: { caseMeta: any, htmlContent: string }) {
  if (!caseMeta) return <div style={{ padding: '40px', fontFamily: 'var(--font-mono)' }}>LOADING...</div>;

  return (
    <div style={{ height: '100%', ...BOX_SHELL, border: `1px solid ${PALETTE.black}`, background: PALETTE.white }}>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '24px 24px 20px' }}>
          <h3 style={{ ...FONT.serif, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, lineHeight: 1.05 }}>{caseMeta.title}</h3>
        </div>
        <div style={{ padding: '16px 24px', background: '#F5F5F3', borderTop: `1px solid ${PALETTE.black}`, borderBottom: `1px solid ${PALETTE.black}` }}>
          <MetaRow label="Court" value={caseMeta.court} />
          <MetaRow label="Date Decided" value={caseMeta.fullDate} />
          <MetaRow label="Citations" value={caseMeta.citation} />
          <MetaRow label="Docket No" value={caseMeta.docketNumber} />
          <MetaRow label="Disposition" value={caseMeta.disposition} />
        </div>
        <div style={{ padding: '32px 24px' }}>
          <h4 style={{ ...FONT.serif, fontSize: '22px', fontWeight: 700, borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '24px' }}>Opinion</h4>
          <div className="opinion-content" style={{ ...T.prose, color: PALETTE.black }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    </div>
  )
}