// ─────────────────────────────────────────────────────────────────────────────
// Individual Case Page
// Layout: Banner · ResizablePanels [NewsBox | Opinion | FarSideBox]
//
// ── OPINION FORMATTING + FIDELITY RULES ──────────────────────────────────────
//
// FIDELITY (non-negotiable):
//   · Opinion text is reproduced verbatim from the official slip opinion.
//   · No word, punctuation mark, or capitalization may be altered.
//   · Footnotes are preserved as footnotes — never inlined or dropped.
//   · Footnote markers in the body ({fn:N}) become bidirectional <sup> links:
//       body marker  →  jumps to #[caseId]-fn-N  (bottom of opinion)
//       footnote num →  links back to #[caseId]-ref-N (citation in text)
//   · Asterisk notices (UNCORRECTED, etc.) shown at top, regular weight.
//   · Case citation names (e.g. Smith v. Phillips) are italicized per Bluebook.
//
// STRUCTURE (top to bottom):
//   [warm] Notice banner — T.micro, left-border accent, weight 400
//   [white] Header — BOX_HEADER + serif case title
//   [warm] Metadata — Court · Date · Docket · Citations · Judges · Disposition
//   [warm] Editorial — Core Terms · Case Summary · Holding · Conclusion
//   [white] Opinion — header · author · paragraphs · footnote list
//
// TYPOGRAPHY:
//   Case title:       FONT.serif, clamp(2rem, 5vw, 3.5rem), weight 700
//   Notice text:      T.micro, weight 400 (never bold), warm bg, left-border
//   Metadata label:   T.micro, minWidth 120px
//   Metadata value:   FONT.sans 12px, weight 400
//   Core terms label: T.micro inverted chip (black bg, white text)
//   Summary prose:    T.prose
//   Holding:          T.prose weight 600, border-left 3px black
//   Opinion header:   FONT.serif 24px weight 700
//   Author line:      T.label
//   Paragraphs:       T.prose, lineHeight 1.72, margin 0 0 1.1em
//   Block quotes:     FONT.serif italic 15px, border-left 3px, paddingLeft 16px
//   Citation names:   <em> (italic) per Bluebook — "Smith v. Phillips"
//   Footnote marks:   <sup><a> T.micro weight 700, color black, no underline
//   Footnote list:    T.micro number (back-link) + FONT.sans 12px text
// ─────────────────────────────────────────────────────────────────────────────

import { notFound }       from 'next/navigation'
import type { ReactNode } from 'react'
import { Banner }         from '@/src/components/Banner'
import { NewsBox }        from '@/src/components/NewsBox'
import { FarSideBox }     from '@/src/components/FarSideBox'
import { ResizablePanels} from '@/src/components/ResizablePanels'
import { getCaseBySlug, ALL_CASES, type CaseLaw } from '@/src/data/cases'
import {
  PALETTE, FONT, T,
  BOX_SHELL, BOX_HEADER, ITEM_RULE,
} from '@/src/styles/tokens'

export function generateStaticParams() {
  return ALL_CASES.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const c = getCaseBySlug(params.slug)
  if (!c) return { title: 'Case Not Found — The Atlanta Gleaner' }
  return {
    title:       `${c.shortTitle} — The Atlanta Gleaner`,
    description: c.summary,
  }
}

function MetaRow({
  label, value, notice = false,
}: {
  label:   string
  value:   string
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
        fontWeight:  400,
        lineHeight:  1.4,
        borderLeft:  notice ? `2px solid ${PALETTE.black}` : 'none',
        paddingLeft: notice ? '7px' : '0',
      }}>
        {value}
      </span>
    </div>
  )
}

// ─── Citation name italicizer ─────────────────────────────────────────────────
// Per Bluebook Rule 10.2: case names in citations are always italicized.
// Detects "Name v. Name" patterns (handles multi-word names, prepositions).
// E.g. "Smith v. Phillips", "City of Atlanta v. Williams", "Watkins v. State"
const CITE_RX =
  /((?:[A-Z][A-Za-z'\u2019\-]+)(?:\s+(?:[A-Z][A-Za-z'\u2019\-]+|of|the|a|an|in|for|at|by|de|La|Los|Las|El))*\s+v\.\s+(?:[A-Z][A-Za-z'\u2019\-]+)(?:\s+(?:[A-Z][A-Za-z'\u2019\-]+|of|the|a|an|in|for|at|by|de|La|Los|Las|El))*)/

function withCiteItalics(text: string, keyPrefix: string): ReactNode[] {
  const result: ReactNode[] = []
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

// ─── Footnote-aware paragraph renderer ───────────────────────────────────────
// Handles {fn:N} markers (→ bidirectional superscript links) and citation
// name italicization. Block-quote paragraphs (start with " or ") are indented.
function renderParagraph(para: string, caseId: string, key: number): ReactNode {
  const trimmed = para.trim()
  const isBlockQuote =
    trimmed.startsWith('\u201c') ||
    trimmed.startsWith('"')

  // Split on {fn:N} markers; odd indices are the captured footnote numbers
  const fnParts = para.split(/\{fn:(\d+)\}/g)
  const nodes: ReactNode[] = []

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
      withCiteItalics(part, `${key}-${i}`).forEach(n => nodes.push(n))
    }
  })

  if (isBlockQuote) {
    return (
      <blockquote key={key} style={{
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
    <p key={key} style={{
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
// Skips empty entries (Word separator footnotes come in as empty strings).
// Renders footnote text with citation name italicization per Bluebook.
// Each footnote number is a back-link to its citation in the opinion body.
function FootnoteList({
  footnotes,
  caseId,
}: {
  footnotes: Record<string, string>
  caseId:    string
}) {
  const entries = Object.entries(footnotes)
    .filter(([, text]) => text.trim() !== '')   // skip empty separator entries
    .sort(([a], [b]) => parseInt(a) - parseInt(b))

  if (entries.length === 0) return null

  return (
    <div style={{
      borderTop:  '1px solid rgba(0,0,0,0.12)',
      marginTop:  '28px',
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
            {withCiteItalics(text, `fn-${num}`)}
          </span>
        </div>
      ))}
    </div>
  )
}

function OpinionPanel({ c }: { c: CaseLaw }) {
  const isPending  = c.opinionText === 'Full opinion text to be added.'
  const paragraphs = c.opinionText.split('\n\n').filter(Boolean)

  return (
    <div style={BOX_SHELL}>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {c.noticeText && (
          <div style={{
            ...T.micro,
            color:      PALETTE.black,
            background: PALETTE.warm,
            borderLeft: `3px solid ${PALETTE.black}`,
            padding:    '8px 14px',
          }}>
            {c.noticeText}
          </div>
        )}
        <div style={{ padding: '20px 20px 16px' }}>
          <h2 style={{ ...BOX_HEADER, margin: '0 0 16px 0' }}>Opinion</h2>
          <h1 style={{
            ...FONT.serif,
            fontSize:   'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            lineHeight: 1.05,
            color:      PALETTE.black,
            margin:     0,
          }}>
            {c.title}
          </h1>
        </div>
        <div style={{ padding: '12px 20px', ...ITEM_RULE, background: PALETTE.warm }}>
          <MetaRow label="Court"        value={c.court} />
          <MetaRow label="Date Decided" value={c.dateDecided} />
          <MetaRow label="Docket No"    value={c.docketNumber} />
          <MetaRow label="Citations"    value={c.citations} />
          <MetaRow label="Judges"       value={c.judges} />
          <MetaRow label="Disposition"  value={c.disposition} />
        </div>

        {/* ── Single line gap: metadata (official) → editorial (editorial) ── */}
        <div style={{ height: '12px' }} />

        {/* ── Editorial block — Core Terms + Summary, warm background ─────── */}
        {!isPending && (c.coreTerms.length > 0 || c.summary || c.holdingBold) && (
          <div style={{ padding: '14px 20px', ...ITEM_RULE, background: PALETTE.warm }}>
            {c.coreTerms.length > 0 && (
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
                {c.coreTerms.join(' · ')}
              </p>
            )}

            {c.summary && (
              <>
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
                  {c.summary}
                </p>
              </>
            )}

            {c.holdingBold && (
              <p style={{
                ...T.prose,
                fontWeight:  600,
                borderLeft:  `3px solid ${PALETTE.black}`,
                paddingLeft: '12px',
                margin:      '0 0 12px 0',
                color:       PALETTE.black,
              }}>
                {c.holdingBold}
              </p>
            )}

            {c.conclusionText && (
              <p style={{ ...T.prose, color: PALETTE.black, margin: 0 }}>
                {c.conclusionText}
              </p>
            )}
          </div>
        )}
        <div style={{