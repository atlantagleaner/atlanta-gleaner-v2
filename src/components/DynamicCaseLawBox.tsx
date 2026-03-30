'use client'

import React from 'react'
import { PALETTE, FONT, T, BOX_SHELL, BOX_HEADER, ITEM_RULE } from '@/src/styles/tokens'

// 1. Restore the original MetaRow component
function MetaRow({ label, value, notice = false }: { label: string; value: string; notice?: boolean }) {
  if (!value) return null
  return (
    <div style={{
      position:      'relative',
      paddingTop:    '6px',
      paddingBottom: '6px',
      paddingLeft:   '128px',        // 120px label + 8px gap
      paddingRight:  '0',
      ...ITEM_RULE,
    }}>
      <span style={{
        ...T.micro,
        color:    PALETTE.black,
        position: 'absolute',
        left:     0,
        top:      '6px',
        width:    '120px',
      }}>
        {label}:
      </span>
      <span style={{
        ...FONT.sans,
        display:     'block',
        fontSize:    '12px',
        color:       PALETTE.black,
        fontWeight:  400,
        background:  'transparent',
        lineHeight:  1.4,
        borderLeft:  notice ? `2px solid ${PALETTE.black}` : 'none',
        paddingLeft: notice ? '7px' : '0',
        wordBreak:   'break-word',
      }}>
        {value}
      </span>
    </div>
  )
}

// 2. The Main Component
export function DynamicCaseLawBox({ caseMeta, htmlContent }: { caseMeta: any, htmlContent: string }) {
  if (!caseMeta) {
    return <div style={{ padding: '40px', fontFamily: 'var(--font-mono)' }}>LOADING RECORD...</div>;
  }

  return (
    <div style={{ height: '100%' }}>
      <div style={{ ...BOX_SHELL, border: `1px solid ${PALETTE.black}` }}>
        <div style={{ overflowY: 'auto', flex: 1, background: PALETTE.white }}>
          
          {/* HEADER & TITLE */}
          <div style={{ padding: '20px 20px 16px' }}>
            <h2 style={{ ...BOX_HEADER, margin: '0 0 16px 0', color: PALETTE.black }}>Case Law Updates</h2>
            <h3 style={{
              ...FONT.serif,
              fontSize:   'clamp(1.6rem, 3.5vw, 2.6rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              color:      PALETTE.black,
              margin:     0,
              textShadow: '0 0 1px rgba(0,0,0,0.2)',
            }}>
              {caseMeta.title}
            </h3>
          </div>

          {/* THE METADATA ROWS (Warm Background) */}
          <div style={{ padding: '12px 20px', ...ITEM_RULE, background: PALETTE.warm || '#f9f9f9' }}>
            <MetaRow label="Court"        value="PENDING" />
            <MetaRow label="Date Decided" value={caseMeta.fullDate || 'PENDING'} />
            <MetaRow label="Docket No"    value="PENDING" />
            <MetaRow label="Citations"    value={caseMeta.citation || 'PENDING'} />
            <MetaRow label="Judges"       value="PENDING" />
            <MetaRow label="Disposition"  value="PENDING" />
          </div>

          <div style={{ height: '12px' }} />

          {/* CORE TERMS & SUMMARY */}
          <div style={{ padding: '14px 20px', ...ITEM_RULE, background: PALETTE.warm || '#f9f9f9' }}>
            {caseMeta.coreTerms && caseMeta.coreTerms.length > 0 && (
              <p style={{ ...FONT.sans, fontSize: '12px', color: PALETTE.black, margin: '0 0 14px 0' }}>
                <span style={{
                  ...T.micro,
                  background:    PALETTE.black,
                  color:         PALETTE.white,
                  padding:       '1px 6px',
                  marginRight:   '8px',
                  letterSpacing: '0.08em',
                }}>
                  Core Terms
                </span>
                {caseMeta.coreTerms.join(' · ')}
              </p>
            )}
            
            <p style={{
              ...T.micro,
              color:         PALETTE.black,
              margin:        '0 0 8px 0',
              paddingBottom: '6px',
              ...ITEM_RULE,
            }}>
              Case Summary
            </p>
            <p style={{ ...T.prose, color: PALETTE.black, margin: '0 0 12px 0' }}>
              {caseMeta.snippet || "Editorial summary pending review."}
            </p>
          </div>

          {/* THE OPINION SECTION */}
          <div style={{ padding: '20px 20px 28px' }}>
            <h4 style={{
              ...FONT.serif,
              fontSize:      '24px',
              fontWeight:    700,
              margin:        '0 0 8px 0',
              borderBottom:  '1px solid rgba(0,0,0,0.10)',
              paddingBottom: '8px',
              color:         PALETTE.black
            }}>
              Opinion
            </h4>
            
            <p style={{ ...T.label, color: PALETTE.black, margin: '0 0 16px 0' }}>
              AUTHOR PENDING
            </p>

            {/* Injects the HTML from the Word Document directly into the original opinion styling */}
            <div 
              className="opinion-content"
              style={{ ...T.prose, lineHeight: 1.72, color: PALETTE.black, margin: '0 0 1.1em 0' }}
              dangerouslySetInnerHTML={{ __html: htmlContent }} 
            />
          </div>

        </div>
      </div>
    </div>
  )
}