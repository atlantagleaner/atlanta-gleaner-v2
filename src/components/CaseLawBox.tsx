'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CaseLawBox — Roll-B panel. Each instance is a specific published case.
// Future Solito: portable (inline styles only)
// Future Supabase: accept `caseData` prop fetched server-side per page
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react'
import { FEATURED_CASE, type CaseLaw } from '@/src/data/cases'
import { PALETTE, FONT, T, BOX_SHELL, BOX_HEADER, ITEM_RULE } from '@/src/styles/tokens'

function MetaRow({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'row', alignItems: 'baseline',
      padding: '6px 0', ...ITEM_RULE, gap: '8px', flexWrap: 'wrap',
    }}>
      {/* Label — T.micro */}
      <span style={{ ...T.micro, color: PALETTE.black, minWidth: '120px', flexShrink: 0 }}>
        {label}:
      </span>
      {/* Value — 12px sans */}
      <span style={{
        ...FONT.sans,
        fontSize:   '12px',
        color:      PALETTE.black,
        fontWeight: alert ? 600 : 400,
        background: alert ? PALETTE.warm : 'transparent',
        padding:    alert ? '1px 5px' : '0',
        lineHeight: 1.4,
      }}>
        {value}
      </span>
    </div>
  )
}

interface CaseLawBoxProps {
  caseData?: CaseLaw
  style?: CSSProperties
}

export function CaseLawBox({ caseData = FEATURED_CASE, style }: CaseLawBoxProps) {
  const [opinionOpen, setOpinionOpen] = useState(false)
  const [btnHovered,  setBtnHovered]  = useState(false)

  return (
    <div style={{ height: '100%', ...style }}>
      <div style={BOX_SHELL}>
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Header + case title */}
          <div style={{ padding: '20px 20px 16px' }}>
            <h2 style={{ ...BOX_HEADER, margin: '0 0 16px 0' }}>Case Law Updates</h2>
            <h3 style={{
              ...FONT.serif,
              fontSize:   'clamp(1.6rem, 3.5vw, 2.6rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              color:      PALETTE.black,
              margin:     0,
              textShadow: '0 0 1px rgba(0,0,0,0.2)',
            }}>
              {caseData.title}
            </h3>
          </div>

          {/* Metadata block — warm background */}
          <div style={{ padding: '12px 20px', ...ITEM_RULE, background: PALETTE.warm }}>
            <MetaRow label="Court"        value={caseData.court} />
            <MetaRow label="Date Decided" value={caseData.dateDecided} />
            <MetaRow label="Docket No"    value={caseData.docketNumber} />
            <MetaRow label="Citations"    value={caseData.citations} />
            <MetaRow label="Judges"       value={caseData.judges} />
            <MetaRow label="Disposition"  value={caseData.disposition} />
            {caseData.noticeText && (
              <MetaRow label="Notice" value={caseData.noticeText} alert />
            )}
          </div>

          {/* Summary block */}
          <div style={{ padding: '16px 20px', ...ITEM_RULE }}>
            {/* Core terms badge */}
            <p style={{ ...FONT.sans, fontSize: '12px', color: PALETTE.black, margin: '0 0 12px 0' }}>
              <span style={{
                ...T.micro,
                background:   PALETTE.warm,
                padding:      '1px 6px',
                marginRight:  '6px',
                letterSpacing: '0.08em',
              }}>
                Core Terms:
              </span>
              {caseData.coreTerms.join(' · ')}
            </p>
            {/* "Case Summary" subheader — T.micro */}
            <p style={{
              ...T.micro,
              color:         PALETTE.black,
              margin:        '12px 0 8px',
              paddingBottom: '6px',
              ...ITEM_RULE,
            }}>
              Case Summary
            </p>
            {/* Summary prose — T.prose */}
            <p style={{ ...T.prose, color: PALETTE.black, margin: '0 0 12px 0' }}>
              {caseData.summary}
            </p>
            {/* Holding — T.prose bold with left border */}
            <p style={{
              ...T.prose,
              fontWeight:  600,
              borderLeft:  `3px solid ${PALETTE.black}`,
              paddingLeft: '12px',
              margin:      '14px 0',
              color:       PALETTE.black,
            }}>
              {caseData.holdingBold}
            </p>
            {/* Conclusion — T.prose */}
            <p style={{ ...T.prose, color: PALETTE.black, margin: 0 }}>
              {caseData.conclusionText}
            </p>
          </div>

          {/* Opinion block */}
          <div style={{ padding: '18px 20px 24px' }}>
            {/* Opinion display header — 24px serif */}
            <h4 style={{
              ...FONT.serif,
              fontSize:      '24px',
              fontWeight:    700,
              margin:        '0 0 8px 0',
              borderBottom:  '1px solid rgba(0,0,0,0.10)',
              paddingBottom: '8px',
            }}>
              Opinion
            </h4>
            {/* Author — T.label */}
            <p style={{ ...T.label, color: PALETTE.black, margin: '0 0 14px 0' }}>
              {caseData.opinionAuthor}
            </p>
            {/* Opinion paragraphs — T.prose, slightly looser leading */}
            {caseData.opinionExcerpt.split('\n\n').map((para, i) => (
              <p key={i} style={{ ...T.prose, lineHeight: 1.7, color: PALETTE.black, margin: '0 0 14px 0' }}>
                {para}
              </p>
            ))}

            {!opinionOpen ? (
              <button
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                onClick={() => setOpinionOpen(true)}
                style={{
                  width:      '100%',
                  padding:    '13px 0',
                  marginTop:  '6px',
                  border:     `2px solid ${PALETTE.black}`,
                  background: btnHovered ? PALETTE.black : 'transparent',
                  color:      btnHovered ? PALETTE.white : PALETTE.black,
                  ...T.nav,
                  fontWeight: 700,
                  cursor:     'pointer',
                  transition: 'all 0.18s',
                }}
              >
                [ Load Full Opinion ]
              </button>
            ) : (
              <p style={{ ...T.micro, color: PALETTE.black, textAlign: 'center', margin: '6px 0 0' }}>
                [ Full opinion · Supabase integration pending ]
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
