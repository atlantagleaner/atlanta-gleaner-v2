'use client'

import React, { useMemo } from 'react'
import { PALETTE, FONT, T, BOX_SHELL, ITEM_RULE } from '@/src/styles/tokens'

function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value || value === "undefined") return null
  return (
    <div style={{ position: 'relative', padding: '4px 0', paddingLeft: '140px', ...ITEM_RULE }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', position: 'absolute', left: 0, width: '130px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}:
      </span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', lineHeight: 1.4, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

export function DynamicCaseLawBox({ caseMeta, htmlContent }: { caseMeta: any, htmlContent: string }) {
  if (!caseMeta) return <div style={{ padding: '40px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>LOADING RECORD...</div>;

  const processedHtml = useMemo(() => {
    if (!htmlContent) return '';
    return htmlContent
      .replace(/(\d+)\.\s*<a/g, '<a') 
      .replace(/id="footnote-ref-(\d+)"/g, 'id="fnref$1"')
      .replace(/href="#footnote-(\d+)"/g, 'href="#fn$1"');
  }, [htmlContent]);

  return (
    <div style={{ height: '100%', ...BOX_SHELL, border: `1px solid ${PALETTE.black}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        
        {/* HEADER BLOCK */}
        <div style={{ padding: '24px 20px', background: '#FFFFFF', borderBottom: `1px solid ${PALETTE.black}` }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 700, lineHeight: 1.05, color: PALETTE.black, margin: 0 }}>
            {caseMeta.title}
          </h3>
        </div>

        {/* METADATA BLOCK */}
        <div style={{ padding: '16px 20px', background: '#EEEDEB' }}>
          <MetaRow label="Court" value={caseMeta.court} />
          <MetaRow label="Date Decided" value={caseMeta.fullDate} />
          <MetaRow label="Docket No" value={caseMeta.docketNumber} />
          <MetaRow label="Citations" value={caseMeta.citation} />
          <MetaRow label="Judges" value={caseMeta.judges || "PENDING"} />
          <MetaRow label="Disposition" value={caseMeta.disposition} />
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 500, margin: 0 }}>
              Notice: THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION.
            </p>
          </div>
        </div>

        <div style={{ height: '12px', background: '#FFFFFF', borderTop: `1px solid ${PALETTE.black}`, borderBottom: `1px solid ${PALETTE.black}` }} />

        {/* EDITORIAL BLOCK */}
        <div style={{ padding: '20px', background: '#EEEDEB', borderBottom: `1px solid ${PALETTE.black}` }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500, margin: '0 0 12px 0' }}>
            <strong style={{ textTransform: 'uppercase', fontSize: '10px', display: 'block', marginBottom: '4px' }}>Case Summary:</strong>
            {caseMeta.snippet}
          </p>
        </div>

        {/* OPINION BLOCK */}
        <div style={{ padding: '32px 20px', background: '#FFFFFF' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, margin: '0 0 24px 0', textTransform: 'uppercase' }}>
             {caseMeta.opinionAuthor || "AUTHOR PENDING"}
          </p>
          <div 
            className="opinion-content"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 500, lineHeight: 1.72, color: PALETTE.black }}
            dangerouslySetInnerHTML={{ __html: processedHtml }} 
          />
        </div>

      </div>
    </div>
  )
}