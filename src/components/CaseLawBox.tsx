'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CaseLawBox — Roll-B panel. Each instance is a specific published case.
//
// ── OPINION FORMATTING + FIDELITY SPEC ───────────────────────────────────────
//
// FIDELITY (non-negotiable):
//   · Opinion text is reproduced verbatim from the official slip opinion.
//   · No word, punctuation mark, or capitalization may be altered.
//   · Footnotes are preserved as footnotes — never inlined or dropped.
//   · Footnote markers in the body ({fn:N}) become bidirectional <sup> links:
//       body marker  →  anchor #[id]-fn-N  (jumps to footnote)
//       footnote num →  anchor #[id]-ref-N (jumps back to citation in text)
//   · Asterisk notices (UNCORRECTED, etc.) are shown at the top, NOT bolded.
//
// STRUCTURE (top to bottom):
//   [warm] Notice banner — T.micro, left-border, no bold weight
//   [white] Header — BOX_HEADER label + serif case title
//   [warm] Metadata — Court · Date · Docket · Citations · Judges · Disposition
//   [warm] Editorial — Core Terms + Case Summary + Holding + Conclusion
//   [white] Opinion — "Opinion" serif header · author line · paragraphs
//          · footnote list (if any) · Load Full Opinion button
//
// TYPOGRAPHY:
//   Case title:      FONT.serif, clamp(1.6rem, 3.5vw, 2.6rem), weight 700
//   Notice text:     T.micro — weight 600 (label tracking), NOT bold
//   Metadata label:  T.micro, minWidth 120px
//   Metadata value:  FONT.sans 12px, weight 400
//   Core terms:      FONT.sans 12px, label chip on PALETTE.warm
//   Summary header:  T.micro
//   Summary prose:   T.prose
//   Holding:         T.prose weight 600, border-left 3px black
//   Opinion header:  FONT.serif 24px weight 700
//   Author line:     T.label
//   Paragraphs:      T.prose, lineHeight 1.72
//   Block quotes:    FONT.serif italic, border-left 3px, paddingLeft 16px
//   Footnote marks:  <sup> T.micro, links to #fn anchor
//   Footnote list:   T.micro label + FONT.sans 12px text, back-link to #ref
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react'
import { FEATURED_CASE, type CaseLaw } from '@/src/data/cases'
import { PALETTE, FONT, T, BOX_SHELL, BOX_HEADER, ITEM_RULE } from '@/src/styles/tokens'

// ─── MetaRow ──────────────────────────────────────────────────────────────────
// label  — T.micro, minWidth 120px
// value  — FONT.sans 12px, always weight 400 (never bolded)
// notice — applies warm background tint + left border accent; no weight change
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
      display: 'flex', flexDirection: 'row', alignItems: 'baseline',
      padding: '6px 0', ...ITEM_RULE, gap: '8px', flexWrap: 'wrap',
    }}>
      <span style={{ ...T.micro, color: PALETTE.black, minWidth: '120px', flexShrink: 0 }}>
        {label}:
      </span>
      <span style={{
        ...FONT.sans,
        fontSize:    '12px',
        color:       PALETTE.black,
        fontWeight:  400,            // always regular — never bolded
        background:  'transparent',
        lineHeight:  1.4,
        borderLeft:  notice ? `2px solid ${PALETTE.black}` : 'none',
        paddingLeft: notice ? '7px' : '0',
      }}>
        {value}
      </span>
    </div>
  )
}

// ─── Footnote-aware paragraph renderer ───────────────────────────────────────
// Parses {fn:N} markers in opinion text into bidirectional <sup> links.
// Also detects paragraphs that are pure block quotes (start + end with ").
function renderOpinionParagraph(
  para:    string,
  caseId:  string,
  paraKey: number,
) {
  // Block quote detection
  const trimmed = para.trim()
  const isBlockQuote =
    trimmed.startsWith('\u201c') || // left double-quote
    trimmed.startsWith('"')

  // Split on {fn:N} markers
  const parts = para.split(/\{fn:(\d+)\}/g)
  const nodes = parts.map((part, i) => {
    if (i % 2 === 1) {
      // Odd indices are the captured footnote numbers
      return (
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
    }
    return part
  })

  if (isBlockQuote) {
    return (
      <blockquote key={paraKey} style={{
        ...FONT.serif,
        fontSize:    '15px',
        fontStyle:   'italic',
        fontWeight:  500,
        lineHeight:  1.65,
        color:       PALETTE.black,
        borderLeft:  `3px solid ${PALETTE.black}`,
        paddingLeft: '16px',
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

// ─── Footnote list ─────────────────────────────────────────────────────────────
// Renders at the bottom of the opinion. Each footnote number links back to its
// citation in the body text (#[caseId]-ref-N).
function FootnoteList({
  footnotes,
  caseId,
}: {
  footnotes: Record<string, string>
  caseId:    string
}) {
  const entries = Object.entries(footnotes)
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
          {/* Back-link to body citation */}
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
            {text}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── CaseLawBox ───────────────────────────────────────────────────────────────
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

          {/* ── Header: label + case title ─────────────────────────────────── */}
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

          {/* ── Metadata block — warm background ───────────────────────────── */}
          <div style={{ padding: '12px 20px', ...ITEM_RULE, background: PALETTE.warm }}>
            <MetaRow label="Court"        value={caseData.court} />
            <MetaRow label="Date Decided" value={caseData.dateDecided} />
            <MetaRow label="Docket No"    value={caseData.docketNumber} />
            <MetaRow label="Citations"    value={caseData.citations} />
            <MetaRow label="Judges"       value={caseData.judges} />
            <MetaRow label="Disposition"  value={caseData.disposition} />
            {caseData.noticeText && <MetaRow label="Notice" value={caseData.noticeText} />}
          </div>

          {/* Line space separator */}
          <div style={{ height: '12px' }} />

          {/* ── Editorial block — Core Terms + Summary + Holding + Conclusion ─ */}
          <div style={{ padding: '14px 20px', ...ITEM_RULE, background: PALETTE.warm }}>

            {/* Core terms */}
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

            {/* Summary subheader */}
            <p style={{
              ...T.micro,
              color:         PALETTE.black,
              margin:        '0 0 8px 0',
              paddingBottom: '6px',
              ...ITEM_RULE,
            }}>
              Case Summary
            </p>

            {/* Summary prose */}
            <p style={{ ...T.prose, color: PALETTE.black, margin: '0 0 12px 0' }}>
              {caseData.summary}
            </p>

            {/* Holding — left-border accent */}
            <p style={{
              ...T.prose,
              fontWeight:  600,
              borderLeft:  `3px solid ${PALETTE.black}`,
              paddingLeft: '12px',
              margin:      '0 0 12px 0',
              color:       PALETTE.black,
            }}>
              {caseData.holdingBold}
            </p>

            {/* Conclusion */}
            <p style={{ ...T.prose, color: PALETTE.black, margin: 0 }}>
              {caseData.conclusionText}
            </p>
          </div>

          {/* ── Opinion block — white background ───────────────────────────── */}
          <div style={{ padding: '20px 20px 28px' }}>

            {/* Opinion section header */}
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

            {/* Author attribution */}
            <p style={{ ...T.label, color: PALETTE.black, margin: '0 0 16px 0' }}>
              {caseData.opinionAuthor}
            </p>

            {/* Opinion paragraphs with footnote markers */}
            {paragraphs.map((para, i) =>
              renderOpinionParagraph(para, caseData.id, i)
            )}

            {/* Bidirectional footnote list */}
            {caseData.footnotes && (
              <FootnoteList footnotes={caseData.footnotes} caseId={caseData.id} />
            )}

            {/* Load Full Opinion button */}
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
