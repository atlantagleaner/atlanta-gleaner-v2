// ─────────────────────────────────────────────────────────────────────────────
// CaseLawBox — Atlanta Gleaner
//
// Renders one judicial opinion with full fidelity:
//   1. Case title banner    (white, serif title + "Notable Decisions" label)
//   2. Metadata box         (warm surface — court, docket, date, judges,
//                            disposition, and notice if present)
//   3. White spacer
//   4. Editorial box        (warm surface — core terms + summary)
//   5. Verbatim opinion     (white, HTML body, bidirectional footnotes)
//
// Accepts the CaseLaw interface directly (src/data/types.ts).
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import type { CSSProperties } from 'react'
import {
  PALETTE, FONT, T,
  BOX_SHELL, BOX_HEADER, BOX_PADDING, ITEM_RULE,
} from '@/src/styles/tokens'
import type { CaseLaw } from '@/src/data/types'

// ── Bidirectional footnote renderer ──────────────────────────────────────────

/**
 * Replace {fn:N} markers in opinionText HTML with proper bidirectional anchors.
 * Footnote keys may start at 2 (mammoth artifact); we renumber sequentially.
 */
function renderOpinionHtml(
  opinionText: string,
  footnotes: Record<string, string> | undefined,
  slug: string,
): string {
  if (!footnotes || Object.keys(footnotes).length === 0) return opinionText

  const sortedKeys = Object.keys(footnotes).sort((a, b) => parseInt(a) - parseInt(b))
  const displayMap: Record<string, number> = {}
  sortedKeys.forEach((key, i) => { displayMap[key] = i + 1 })

  return opinionText.replace(/\{fn:(\d+)\}/g, (_, key) => {
    const n = displayMap[key] ?? key
    return (
      `<sup><a ` +
      `id="${slug}-ref-${key}" ` +
      `href="#${slug}-fn-${key}" ` +
      `class="fn-ref" ` +
      `style="font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;` +
      `color:#000;text-decoration:none;vertical-align:super;"` +
      `>${n}</a></sup>`
    )
  })
}

// ── Preamble stripper ─────────────────────────────────────────────────────────

/**
 * Strip repeated metadata preamble from the opinion body HTML.
 *
 * Some slip opinions (particularly Court of Appeals) embed a second copy of
 * the metadata block — "By [Author]", case name, court, date, "Opinion by:",
 * and a standalone "Opinion" heading — before the actual text begins.
 * extractBodyHtml removes the *first* "Opinion" header; this removes any
 * remaining standalone "Opinion" paragraphs and everything before the last one.
 *
 * The last standalone "Opinion" paragraph is replaced with a styled T.label
 * marker so the word fits the Gleaner mono-uppercase aesthetic.
 */
function stripOpinionPreamble(html: string): string {
  // Match standalone "Opinion" in a block element (p or heading), optionally
  // wrapped in bold/em/strong tags — but NOT "Opinion by:" lines.
  const re = /<(p|h[1-6])[^>]*>\s*(?:<(?:strong|em|b)>)?\s*Opinion\s*(?:<\/(?:strong|em|b)>)?\s*<\/(p|h[1-6])>/gi

  const matches: Array<{ index: number; end: number }> = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    matches.push({ index: m.index, end: m.index + m[0].length })
  }

  if (matches.length === 0) return html

  // Strip everything up to and including the last standalone "Opinion" block.
  // Replace it with a styled label so the word is present but minimal.
  const last = matches[matches.length - 1]
  const after = html.slice(last.end)
  const styledMarker = '<p class="opinion-section-header">Opinion</p>'
  return styledMarker + after
}

// ── Style constants ───────────────────────────────────────────────────────────

const warm:  CSSProperties = { background: PALETTE.warm }
const white: CSSProperties = { background: PALETTE.white }

const sectionBorder: CSSProperties = {
  borderTop: '1px solid rgba(0,0,0,0.08)',
}

const metadataRow: CSSProperties = {
  display:             'grid',
  gridTemplateColumns: '110px 1fr',
  gap:                 '0',
  ...ITEM_RULE,
  padding:             '7px 0',
  alignItems:          'baseline',
}

const metaLabel: CSSProperties = {
  ...T.micro,
  color:    'rgba(0,0,0,0.45)',
  minWidth: '110px',
}

const metaValue: CSSProperties = {
  ...FONT.sans,
  fontSize:   '12px',
  fontWeight: 400,
  lineHeight: 1.4,
  color:      PALETTE.black,
}

const termChip: CSSProperties = {
  ...T.micro,
  background:    PALETTE.black,
  color:         PALETTE.white,
  padding:       '2px 8px',
  letterSpacing: '0.10em',
  lineHeight:    '18px',
  display:       'inline-block',
  marginRight:   '5px',
  marginBottom:  '5px',
}

const pendingChip: CSSProperties = {
  ...T.micro,
  background:    'rgba(0,0,0,0.09)',
  color:         'rgba(0,0,0,0.35)',
  padding:       '2px 10px',
  letterSpacing: '0.10em',
  lineHeight:    '18px',
  display:       'inline-block',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CaseLawBoxProps {
  /** Full CaseLaw record (from cases.json / types.ts) */
  caseData: CaseLaw
  /** Label shown in the header tab — defaults to "Notable Decisions" */
  label?: string
}

export default function CaseLawBox({ caseData, label = 'Notable Decisions' }: CaseLawBoxProps) {
  if (!caseData) return null

  const {
    slug,
    title,
    court,
    docketNumber,
    dateDecided,
    citations,
    judges,
    disposition,
    coreTerms,
    summary,
    opinionAuthor,
    opinionText,
    footnotes,
    noticeText,
  } = caseData

  const sortedFnKeys = Object.keys(footnotes ?? {}).sort((a, b) => parseInt(a) - parseInt(b))
  const fnDisplayMap: Record<string, number> = {}
  sortedFnKeys.forEach((key, i) => { fnDisplayMap[key] = i + 1 })

  // Strip preamble, then inject footnote anchors
  const strippedHtml      = stripOpinionPreamble(opinionText ?? '')
  const renderedOpinionHtml = renderOpinionHtml(strippedHtml, footnotes, slug)

  const hasCoreTerms = coreTerms && coreTerms.length > 0
  const hasSummary   = summary && summary.trim() && summary.trim() !== 'Summary pending.'

  return (
    <article style={{ ...BOX_SHELL, width: '100%' }}>

      {/* ── 1. Case title banner ──────────────────────────────────────────── */}
      {/* Background matches the opinion text (white) per design spec.        */}
      <header style={{ ...white, padding: '20px 24px 18px', ...sectionBorder }}>
        <div style={{ ...BOX_HEADER, marginBottom: '14px', display: 'inline-block' }}>
          {label}
        </div>
        <h1 style={{
          ...FONT.serif,
          fontSize:      'clamp(1.4rem, 3.2vw, 2.2rem)',
          fontWeight:    700,
          lineHeight:    1.08,
          letterSpacing: '-0.01em',
          margin:        0,
          color:         PALETTE.black,
        }}>
          {title}
        </h1>
      </header>

      {/* ── 2. Metadata box ──────────────────────────────────────────────── */}
      <section style={{ ...warm, padding: '16px 24px', ...sectionBorder }}>
        {court && (
          <div style={metadataRow}>
            <span style={metaLabel}>Court</span>
            <span style={metaValue}>{court}</span>
          </div>
        )}
        {docketNumber && (
          <div style={metadataRow}>
            <span style={metaLabel}>Docket No.</span>
            <span style={metaValue}>{docketNumber}</span>
          </div>
        )}
        {dateDecided && (
          <div style={metadataRow}>
            <span style={metaLabel}>Decided</span>
            <span style={metaValue}>{dateDecided}</span>
          </div>
        )}
        {citations && (
          <div style={{ ...metadataRow, borderBottom: 'none' }}>
            <span style={metaLabel}>Citations</span>
            <span style={metaValue}>{citations}</span>
          </div>
        )}
        {judges && (
          <div style={{
            ...metadataRow,
            marginTop: '6px', paddingTop: '8px',
            borderTop: '1px solid rgba(0,0,0,0.07)', borderBottom: 'none',
          }}>
            <span style={metaLabel}>Judges</span>
            <span style={metaValue}>{judges}</span>
          </div>
        )}
        {disposition && (
          <div style={{ ...metadataRow, marginTop: '2px', borderBottom: 'none' }}>
            <span style={metaLabel}>Disposition</span>
            <span style={metaValue}>{disposition}</span>
          </div>
        )}
        {/* Notice text lives in metadata, below disposition */}
        {noticeText && (
          <div style={{ ...metadataRow, marginTop: '2px', borderBottom: 'none' }}>
            <span style={metaLabel}>Notice</span>
            <span style={{ ...metaValue, fontStyle: 'italic', color: 'rgba(0,0,0,0.55)' }}>
              {noticeText}
            </span>
          </div>
        )}
      </section>

      {/* ── 3. White spacer ──────────────────────────────────────────────── */}
      <div style={{ ...white, height: '16px', ...sectionBorder }} />

      {/* ── 4. Editorial box (core terms + summary) ──────────────────────── */}
      <section style={{ ...warm, padding: '16px 24px', ...sectionBorder }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...BOX_HEADER, marginBottom: '10px', display: 'block' }}>
            Core Terms
          </div>
          {hasCoreTerms ? (
            <div>
              {coreTerms!.map((term) => (
                <span key={term} style={termChip}>{term}</span>
              ))}
            </div>
          ) : (
            <span style={pendingChip}>Pending</span>
          )}
        </div>

        <div>
          <div style={{ ...BOX_HEADER, marginBottom: '10px', display: 'block' }}>
            Case Summary
          </div>
          {hasSummary ? (
            <p style={{ ...T.prose, margin: 0, color: PALETTE.black }}>
              {summary}
            </p>
          ) : (
            <p style={{ ...T.prose, margin: 0, color: 'rgba(0,0,0,0.35)', fontStyle: 'italic' }}>
              Summary pending.
            </p>
          )}
        </div>
      </section>

      {/* ── 5. Verbatim opinion ──────────────────────────────────────────── */}
      <section style={{
        ...white,
        padding:   '28px 24px 40px',
        borderTop: '2px solid #000000',
      }}>
        {/* Verbatim opinion body — preamble stripped, footnote anchors injected */}
        <div
          className="opinion-body"
          dangerouslySetInnerHTML={{ __html: renderedOpinionHtml }}
        />

        {/* ── Bidirectional footnote list ─────────────────────────────── */}
        {sortedFnKeys.length > 0 && (
          <footer style={{
            marginTop:  '56px',
            paddingTop: '24px',
            borderTop:  '1px solid rgba(0,0,0,0.12)',
          }}>
            <div style={{ ...BOX_HEADER, marginBottom: '16px', display: 'block' }}>
              Footnotes
            </div>
            {sortedFnKeys.map((key) => {
              const displayNum = fnDisplayMap[key]
              const text       = footnotes![key] ?? ''
              return (
                <div
                  key={key}
                  id={`${slug}-fn-${key}`}
                  style={{
                    display:       'flex',
                    gap:           '12px',
                    marginBottom:  '10px',
                    alignItems:    'baseline',
                    ...ITEM_RULE,
                    paddingBottom: '10px',
                  }}
                >
                  <a
                    href={`#${slug}-ref-${key}`}
                    style={{
                      ...FONT.mono,
                      fontSize:       '9px',
                      fontWeight:     700,
                      color:          PALETTE.black,
                      textDecoration: 'none',
                      flexShrink:     0,
                      minWidth:       '18px',
                      lineHeight:     1.5,
                    }}
                    title="Back to text"
                  >
                    {displayNum}↑
                  </a>
                  <span style={{
                    ...FONT.sans,
                    fontSize:   '12px',
                    lineHeight: 1.55,
                    color:      PALETTE.black,
                  }}>
                    {text}
                  </span>
                </div>
              )
            })}
          </footer>
        )}
      </section>

    </article>
  )
}

export type { CaseLawBoxProps }
