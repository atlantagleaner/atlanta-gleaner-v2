'use client'

import React from 'react'
import { PALETTE, FONT, BOX_SHELL, ITEM_RULE } from '@/src/styles/tokens'

// SIZE_SM (10px): Metadata labels and values
function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value || value === "undefined") return null
  return (
    <div style={{ position: 'relative', paddingTop: '4px', paddingBottom: '4px', paddingLeft: '128px', ...ITEM_RULE }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', position: 'absolute', left: 0, top: '6px', width: '120px', fontWeight: 700 }}>{label}:</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', display: 'block', lineHeight: 1.4 }}>{value}</span>
    </div>
  )
}

export function DynamicCaseLawBox({ caseMeta, htmlContent }: { caseMeta: any, htmlContent: string }) {
  if (!caseMeta) return <div style={{ padding: '40px', fontFamily: 'var(--font-mono)' }}>LOADING...</div>;

  return (
    <div style={{ height: '100%', border: `1px solid ${PALETTE.black}`, background: '#EEEDEB', display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        
        {/* HEADER */}
        <div style={{ padding: '24px 24px 20px', background: '#EEEDEB' }}>
          <h3 style={{ ...FONT.serif, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, lineHeight: 1.05, color: '#000' }}>
            {caseMeta.title}
          </h3>
        </div>

        {/* 1. METADATA BLOCK (#EEEDEB) */}
        <div style={{ padding: '16px 24px', background: '#EEEDEB', borderTop: `1px solid ${PALETTE.black}`, borderBottom: `1px solid ${PALETTE.black}` }}>
          <MetaRow label="Court" value={caseMeta.court} />
          <MetaRow label="Date Decided" value={caseMeta.fullDate} />
          <MetaRow label="Docket No" value={caseMeta.docketNumber} />
          <MetaRow label="Citations" value={caseMeta.citation} />
          <MetaRow label="Judges" value={caseMeta.judges} />
          <MetaRow label="Disposition" value={caseMeta.disposition} />
          
          {/* Notice Line (10px) */}
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', margin: 0, color: '#000' }}>
              <strong>Notice:</strong> THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION.
            </p>
          </div>
        </div>

        {/* 12px SEPARATOR GAP */}
        <div style={{ height: '12px', background: '#EEEDEB' }} />

        {/* 2. EDITORIAL BLOCK (#EEEDEB) */}
        <div style={{ padding: '20px 24px', background: '#EEEDEB', borderTop: `1px solid ${PALETTE.black}`, borderBottom: `1px solid ${PALETTE.black}` }}>
          <div style={{ marginBottom: '16px' }}>
             <span style={{ background: '#000', color: '#fff', padding: '2px 6px', fontSize: '10px', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>CORE TERMS</span>
             <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500 }}>{caseMeta.coreTerms?.join(' · ')}</span>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, margin: '0 0 12px 0' }}><strong>Summary:</strong> {caseMeta.summary}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, margin: '0 0 12px 0' }}><strong>Holding:</strong> {caseMeta.holding}</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, margin: 0 }}><strong>Conclusion:</strong> {caseMeta.conclusion}</p>
        </div>

        {/* 3. OPINION BLOCK (#FFFFFF) */}
        <div style={{ padding: '40px 24px', background: '#FFFFFF' }}>
          <h4 style={{ ...FONT.serif, fontSize: '22px', fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: '12px', marginBottom: '32px' }}>
            Opinion
          </h4>
          <div 
            className="opinion-content" 
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />
        </div>

      </div>
    </div>
  )
}