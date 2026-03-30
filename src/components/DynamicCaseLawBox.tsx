'use client'

import React from 'react'
import { PALETTE, FONT } from '@/src/styles/tokens'

export function DynamicCaseLawBox({ caseMeta, htmlContent }: { caseMeta: any, htmlContent: string }) {
  if (!caseMeta) {
    return <div style={{ padding: '40px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>LOADING OPINION...</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: PALETTE.white, border: `1px solid ${PALETTE.black}` }}>
      
      {/* Scrollable Reading Pane */}
      <div style={{ padding: '32px 24px', overflowY: 'auto', flex: 1 }}>
        
        {/* 1. Case Title */}
        <h2 style={{ ...FONT.serif, fontSize: '32px', fontWeight: 700, margin: '0 0 16px 0', color: PALETTE.black, lineHeight: 1.1 }}>
          {caseMeta.title}
        </h2>

        {/* 2. Grey Metadata Boxes */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: '#EEEDEB', padding: '6px 10px', fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: PALETTE.black }}>
            {caseMeta.citation}
          </div>
          <div style={{ background: '#EEEDEB', padding: '6px 10px', fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: PALETTE.black }}>
            {caseMeta.fullDate}
          </div>
        </div>

        {/* 3. Black Core Term Boxes */}
        {caseMeta.coreTerms && caseMeta.coreTerms.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {caseMeta.coreTerms.map((term: string) => (
              <div key={term} style={{ background: PALETTE.black, color: PALETTE.white, padding: '4px 8px', fontSize: '9px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {term}
              </div>
            ))}
          </div>
        )}

        {/* 4. The Summary Block */}
        <div style={{ marginBottom: '40px', padding: '16px 20px', borderLeft: `4px solid ${PALETTE.black}`, background: '#fcfcfc' }}>
          <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px 0', color: '#666' }}>
            Automated Snippet
          </h4>
          <p style={{ ...FONT.serif, fontSize: '15px', lineHeight: 1.6, margin: 0, color: PALETTE.black, opacity: 0.9 }}>
            {caseMeta.snippet}...
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #E5E5E5', marginBottom: '40px' }} />

        {/* 5. The Actual Opinion Text */}
        <div 
          style={{ ...FONT.serif, fontSize: '16px', lineHeight: 1.8, color: PALETTE.black }}
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
        
      </div>
    </div>
  )
}