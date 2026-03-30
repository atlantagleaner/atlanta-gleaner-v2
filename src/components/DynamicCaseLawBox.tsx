'use client'

import React from 'react'
import { PALETTE, FONT, T, BOX_SHELL, ITEM_RULE } from '@/src/styles/tokens'

function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div style={{ position: 'relative', paddingTop: '6px', paddingBottom: '6px', paddingLeft: '128px', ...ITEM_RULE }}>
      <span style={{ ...T.micro, position: 'absolute', left: 0, top: '6px', width: '120px' }}>{label}:</span>
      <span style={{ ...FONT.sans, display: 'block', fontSize: '12px', lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}

export function DynamicCaseLawBox({ caseMeta, htmlContent }: { caseMeta: any, htmlContent: string }) {
  if (!caseMeta) return <div style={{ padding: '40px', fontFamily: 'var(--font-mono)' }}>LOADING...</div>;

  return (
    <div style={{ height: '100%', ...BOX_SHELL, border: `1px solid ${PALETTE.black}`, background: PALETTE.white }}>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '20px 20px 16px' }}>
          <h3 style={{ ...FONT.serif, fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', fontWeight: 700, lineHeight: 1.05 }}>
            {caseMeta.title}
          </h3>
        </div>

        <div style={{ padding: '12px 20px', ...ITEM_RULE, background: PALETTE.warm || '#f9f9f9' }}>
          <MetaRow label="Court" value="PENDING" />
          <MetaRow label="Date Decided" value={caseMeta.fullDate} />
          <MetaRow label="Citations" value={caseMeta.citation} />
          <MetaRow label="Disposition" value="PENDING" />
        </div>

        <div style={{ padding: '14px 20px', ...ITEM_RULE, background: PALETTE.warm || '#f9f9f9', marginTop: '12px' }}>
          <p style={{ ...T.micro, margin: '0 0 8px 0', paddingBottom: '6px', ...ITEM_RULE }}>Case Summary</p>
          <p style={{ ...T.prose, margin: 0, fontStyle: 'italic' }}>"{caseMeta.snippet}"</p>
        </div>

        <div style={{ padding: '20px' }}>
          <h4 style={{ ...FONT.serif, fontSize: '24px', fontWeight: 700, borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Opinion</h4>
          <div 
            style={{ ...T.prose, lineHeight: 1.72, marginTop: '20px' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        </div>
      </div>
    </div>
  )
}