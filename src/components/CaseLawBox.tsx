'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CaseLawBox — Roll-B panel. Each instance is a specific published case.
//
// FIDELITY (non-negotiable):
//   · Opinion text is reproduced verbatim from the official slip opinion.
//   · Footnote markers ({fn:N}) become bidirectional <sup> links.
//   · Case citation names italicized per Bluebook Rule 10.2.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, type CSSProperties } from 'react'
import { FEATURED_CASE, type CaseLaw } from '@/src/data/cases'
import { PALETTE, FONT, T, BOX_SHELL, BOX_HEADER, ITEM_RULE } from '@/src/styles/tokens'

function MetaRow({
  label, value, notice = false,
}: {
  label: string
  value: string
  notice?: boolean
}) {
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
        top:      '6px',             // match parent padding-top
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

const CITE_RX =
  /((?:[A-Z][A-Za-z'\u2019\-]+)(?:\s+(?:[A-Z][A-Za-z'\u2019\-]+|of|the|a|an|in|for|at|by|de|La|Los|Las|El))*\s+v\.\s+(?:[A-Z][A-Za-z'\u2019\-]+)(?:\s+(?:[A-Z][A-Za-z'\u2019\-]+|of|the|a|an|in|for|at|by|de|La|Los|Las|El))*)/

function withCiteItalics(text: string, keyPrefix: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  const parts = text.split(CITE_RX)
  parts.forEach((part, i) => {
    if (!part) return
    if (i % 2 === 1) {
      result.push(<em key={`${keyPrefix}-cite-${i}`} style={{ fontStyle: 'italic' }}>{part}</em>)
    } else {
      result.push(part)
    }
  })
  return result
}

function renderOpinionParagraph(
  para:    string,
  caseId:  string,
  paraKey: number,
) {
  const trimmed = para.trim()
  const isBlockQuote =
    trimmed.startsWith('\u201c') ||
    trimmed.startsWith('"')

  const fnParts = para.split(/\{fn:(\d+)\}/g)
  const nodes: React.ReactNode[] = []

  fnParts.forEach((part, i) => {
    if (i % 2 === 1) {
      nodes.push(
        <sup key={`fn-mark-${i}`}>
          <a
            id={`${caseId}-ref-${part}`}
            href={`#${caseId}-fn-${part}`}
            style={{
              ...T.micro,
              color:          PALETTE.black,
              textDecoration: 'none',
              fontWeight:     700,
              fontSize:       '9px',
            }}
          >
            {part}
          </a>
        </sup>
      )
    } else {
      withCiteItalics(part, `${paraKey}-${i}`).forEach(n => nodes.push(n))
    }
  })

  if (isBlockQuote) {
    return (
      <blockquote key={paraKey} style={{
        ...T.prose,
        fontStyle:   'italic',
        lineHeight:  1.65,
        color:       PALETTE.black,
        margin:      '0 0 1.1em 0',
      }}>
        {nodes}
      </blockquote>
    )
  }

  return (
    <p key={paraKey} style={{
      ...T.prose,
      lineHeight: 1.72,
      color:      PALETTE.black,
      margin:     '0 0 1.1em 0',
    }}>
      {nodes}
    </p>
  )
}

function FootnoteList({
  footnotes,
  caseId,
}: {
  footnotes: Record<string, string>
  caseId:    string
}) {
  const entries = Object.entries(footnotes)
    .filter(([, text]) => text.trim() !== '')
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
  if (entries.length === 0) return null
  return (
    <div style={{
      borderTop:  '1px solid rgba(0,0,0,0.12)',
      marginTop:  '24px',
      paddingTop: '16px',
    }}>
      <p style={{ ...T.micro, color: PALETTE.black, margin: '0 0 12px 0' }}>
        Footnotes
      </p>
      {entries.map(([num, text]) => (
        <div key={num} id={`${caseId}-fn-${num}`} style={{
          display:      'flex',
          gap:          '8px',
          marginBottom: '8px',
          alignItems:   'baseline',
        }}>
          <a
            href={`#${caseId}-ref-${num}`}
            style={{
              ...T.micro,
              color:          PALETTE.black,
              textDecoration: 'none',
              flexShrink:     0,
            }}
          >
            {num}.
          </a>
          <span style={{ ...FONT.sans, fontSize: '12px', color: PALETTE.black, lineHeight: 1.55 }}>
            {withCiteItalics(text, `fn-${num}`)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface CaseLawBoxProps {
  caseData?: CaseLaw
  style?:    CSSProperties
}

export function CaseLawBox({ caseData = FEATURED_CASE, style }: CaseLawBoxProps) {
  const [opinionOpen, setOpinionOpen] = useState(false)
  const [btnHovered,  setBtnHovered]  = useState(false)

  const paragraphs = caseData.opinionText.split('\n\n').filter(Boolean)

  return (
    <div style={{ height: '100%', ...style }}>
      <div style={BOX_SHELL}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
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
          <div style={{ padding: '12px 20px', ...ITEM_RULE, background: PALETTE.warm }}>
            <MetaRow label="Court"        value={caseData.court} />
            <MetaRow label="Date Decided" value={caseData.dateDecided} />
            <MetaRow label="Docket No"    value={caseData.docketNumber} />
            <MetaRow label="Citations"    value={caseData.citations} />
            <MetaRow label="Judges"       value={caseData.judges} />
            <MetaRow label="Disposition"  value={caseData.disposition} />
            {caseData.noticeText && <MetaRow label="Notice" value={caseData.noticeText} />}
          </div>
          <div style={{ height: '12px' }} />
          <div style={{ padding: '14px 20px', ...ITEM_RULE, background: PALETTE.warm }}>
            {caseData.coreTerms.length > 0 && (
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
                {caseData.coreTerms.join(' · ')}
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
              {caseData.summary}
            </p>
            <p style={{ ...T.prose, color: PALETTE.black, margin: '0 0 12px 0' }}>
              {caseData.holdingBold}
            </p>
            <p style={{ ...T.prose, color: PALETTE.black, margin: 0 }}>
              {caseData.conclusionText}
            </p>
          </div>
          <div style={{ padding: '20px 20px 28px' }}>
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
            <p style={{ ...T.label, color: PALETTE.black, margin: '0 0 16px 0' }}>
              {caseData.opinionAuthor}
            </p>
            {paragraphs.map((para, i) =>
              renderOpinionParagraph(para, caseData.id, i)
            )}
            {caseData.footnotes && (
              <FootnoteList footnotes={caseData.footnotes} caseId={caseData.id} />
            )}
            {!opinionOpen ? (
              <button
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                onClick={() => setOpinionOpen(true)}
                style={{
                  width:      '100%',
                  padding:    '13px 0',
                  marginTop:  '18px',
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
              <p style={{ ...T.micro, color: PALETTE.black, textAlign: 'center', margin: '18px 0 0' }}>
                [ Full opinion · Supabase integration pending ]
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
