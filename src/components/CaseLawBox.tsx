'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CaseLawBox — Atlanta Gleaner
//
// Renders one judicial opinion with full fidelity:
//   1. Case title banner    (white, serif title + "Case Law Updates" label)
//   2. Metadata box         (warm surface — court, docket, date, judges,
//                            disposition, and notice if present)
//   3. White spacer
//   4. Editorial box        (warm surface — core terms + summary)
//   5. Expand/collapse bar  (collapsed by default — opinion hidden)
//   6. Verbatim opinion     (white, HTML body, bidirectional footnotes)
//
// Accepts the CaseLaw interface directly (src/data/types.ts).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import type { CSSProperties } from 'react'
import {
  PALETTE, PALETTE_CSS, FONT, T,
  BOX_SHELL, BOX_HEADER, BOX_PADDING, ITEM_RULE, SPACING, ANIMATION,
} from '@/src/styles/tokens'
import type { CaseLaw, Party, Counsel, CounselStructured } from '@/src/data/types'
import { MetadataRow } from '@/src/components/common'

// ── Bidirectional footnote renderer ──────────────────────────────────────────

/**
 * Replace {fn:N} markers in opinionText HTML with proper bidirectional anchors.
 * Footnote keys may start at 2 (mammoth artifact); we renumber sequentially.
 */
function renderOpinionHtml(
  opinionText: string,
  footnotes: Record<string, string | undefined> | undefined,
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

// ── Metadata stripper ────────────────────────────────────────────────────────

/**
 * Strip embedded metadata and preamble blocks from the opinion body HTML.
 *
 * Slip opinions (especially from Court of Appeals) often include a second copy
 * of the complete metadata block within the opinion HTML itself:
 *   - Court information (e.g., "Court of Appeals of Georgia, First Division")
 *   - Date decided (e.g., "March 10, 2026, Decided")
 *   - Docket numbers and citations
 *   - Reporter citations
 *   - Case name (often in ALL CAPS)
 *   - Judge/author information (e.g., "Opinion by: BARNES")
 *   - Notice text (e.g., "UNCORRECTED AND SUBJECT TO REVISION")
 *   - Disposition (e.g., "Judgment reversed")
 *   - Standalone "Opinion" heading
 *
 * All of this is already displayed in the Metadata and Editorial sections
 * of the CaseLawBox JSX. This function strips it from the opinion body
 * so it doesn't appear twice, leaving only the actual opinion text.
 *
 * Strategy: Find the last standalone "Opinion" block, then strip everything
 * before it. This removes all preamble while preserving the actual text.
 */
function stripOpinionPreamble(html: string): string {
  // Match standalone "Opinion" in a block element (p or heading), optionally
  // wrapped in bold/em/strong tags — but NOT "Opinion by:" or "Opinion:" lines.
  // Uses negative lookbehind to exclude "by " or ":" immediately before Opinion
  const opinionHeaderRe = /<(p|h[1-6])[^>]*>(?:[^<]*?(?:<[^>]+>)*)*?\s*(?:Opinion)(?:\s*(?:by:|by))?[\s\S]*?<\/(p|h[1-6])>/gi

  // Simpler approach: find all block elements and look for ones containing standalone "Opinion"
  const blockRe = /<(p|h[1-6])[^>]*>([^<]*(?:<(?!p|h[1-6])[^>]*>[^<]*)*)<\/(p|h[1-6])>/gi

  const matches: Array<{ index: number; end: number; text: string }> = []
  let m: RegExpExecArray | null

  while ((m = blockRe.exec(html)) !== null) {
    const content = m[0]
    const text = m[2].replace(/<[^>]+>/g, '').trim()

    // Match "Opinion" as a standalone line (not "Opinion by:" or "Opinion:" as part of metadata)
    if (/^\s*Opinion\s*$/i.test(text) || /^\s*<[^>]*>\s*Opinion\s*<\/[^>]*>\s*$/i.test(content)) {
      matches.push({ index: m.index, end: m.index + content.length, text })
    }
  }

  if (matches.length === 0) return html

  // Strip everything up to and including the last standalone "Opinion" block.
  const last = matches[matches.length - 1]
  return html.slice(last.end)
}

// ── Pagination marker handler ───────────────────────────────────────────────

/**
 * Wrap pagination markers in <span class="star-pagination"> for toggle control.
 * Handles the spacing rules identified across all raw opinions:
 *
 * RULE 1 (99.8%): \xa0[MARKER]\xa0 → \xa0<span>[MARKER]</span>\xa0
 *   Example: "argues that it cannot \xa0[**722]\xa0 be held"
 *   → "argues that it cannot \xa0<span>[**722]</span>\xa0 be held"
 *
 * RULE 2 (0.2%): [MARKER]\xa0 → <span>[MARKER]</span>\xa0
 *   Example: "[*880]\xa0 The financial entanglement"
 *   → "<span>[*880]</span>\xa0 The financial entanglement"
 *
 * By default the spans have display: none (CSS), so markers are invisible
 * but properly handled in the HTML. When .show-pagination is active, they
 * become visible inline with proper spacing on both sides.
 */
function wrapPaginationMarkers(html: string): string {
  // RULE 1: Non-breaking space before and after (\xa0[MARKER]\xa0)
  html = html.replace(
    /\xa0(\[\*{1,3}\d+\])\xa0/g,
    '\xa0<span class="star-pagination">$1</span>\xa0'
  )

  // RULE 2: Non-breaking space after only ([MARKER]\xa0)
  html = html.replace(
    /(\[\*{1,3}\d+\])\xa0/g,
    '<span class="star-pagination">$1</span>\xa0'
  )

  return html
}

// ── Blockquote detector & formatter ──────────────────────────────────────────

/**
 * Detect and wrap block quotations based on Bluebook formatting characteristics.
 *
 * Legal opinions use block quotations (per Bluebook standards):
 *   - Indented block (visual separator)
 *   - No quotation marks
 *   - Same font and size
 *   - Often preceded by case names (e.g., "Smith v. Jones,")
 *   - Contain judicial language or statutes
 *
 * Since indentation is not preserved in HTML extraction, we use heuristics:
 *   - Paragraphs consisting entirely of quoted material (all-caps case names, citations)
 *   - Short standalone blocks that appear to be extracted quotations
 *   - Paragraphs following citation patterns
 *
 * This is applied via CSS class 'legal-blockquote' which is styled in globals.css.
 */
function detectAndWrapBlockquotes(html: string): string {
  // Match patterns that typically indicate blockquotes:
  // 1. All-caps case name pattern: "CASE NAME v. OTHER,"
  // 2. Statute citations: number followed by statute abbreviation
  // 3. Judicial quotations: paragraphs starting with "The court" or similar
  // 4. Short indented blocks after colons (typically introducing quotes)

  // For now, wrap <p> tags that contain only citations, case names, or appear isolated
  // Pattern: <p> containing ONLY uppercase text (potential case names/citations)
  const upperCaseOnlyRe = /<p[^>]*>[\s]*([A-Z][A-Z\s.,;():'0-9]+)[\s]*<\/p>/g

  let result = html
  let m: RegExpExecArray | null

  // Process matches in reverse to maintain indices
  const matches: Array<{ index: number; end: number }> = []
  while ((m = upperCaseOnlyRe.exec(html)) !== null) {
    // Only mark as blockquote if it looks like a case name or statute citation
    const text = m[1].trim()
    if (
      /\bv\.\s+/.test(text) || // Contains "v." (case name)
      /\b(U\.S\.|S\.Ct\.|L\.Ed|F\.[2-3]d|Ga\.|App\.)\b/.test(text) || // Citation
      (/^[0-9]/.test(text) && /[A-Z]{2,}/.test(text)) // Statute pattern
    ) {
      matches.push({ index: m.index, end: m.index + m[0].length })
    }
  }

  // Apply blockquote formatting to identified matches (in reverse order)
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    const original = html.slice(match.index, match.end)
    const wrapped = original
      .replace(/<p([^>]*)>/, '<p$1 class="legal-blockquote">')
    result = result.slice(0, match.index) + wrapped + result.slice(match.end)
  }

  return result
}

// ── Counsel formatter ───────────────────────────────────────────────────────

/**
 * Format counsel data as a single readable string.
 * Format: "Attorney Name, Law Firm (for Position); Attorney Name, Law Firm (for Position)"
 */
function formatCounselData(counsel: CounselStructured): string {
  if (!counsel.entries || counsel.entries.length === 0) return ''

  return counsel.entries
    .map((entry) => {
      const attorneys = entry.attorneys.join(', ')
      const firm = entry.law_firm ? `, ${entry.law_firm}` : ''
      return `${attorneys}${firm} (for ${entry.represents})`
    })
    .join('; ')
}

/**
 * Truncate text to approximately 2 lines (estimate ~90 chars per line at prose size).
 * Returns the truncated string and whether it was truncated.
 */
function truncateToTwoLines(text: string, charLimit: number = 180): { text: string; truncated: boolean } {
  if (text.length <= charLimit) {
    return { text, truncated: false }
  }
  // Truncate and add ellipsis, but try to break at a word boundary
  let truncated = text.slice(0, charLimit)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > charLimit * 0.8) {
    truncated = truncated.slice(0, lastSpace)
  }
  return { text: truncated + '…', truncated: true }
}

/**
 * Format subsequent history array into a single string.
 * Each entry is separated by semicolons.
 */
function formatSubsequentHistory(history: Array<{ full_citation?: string; action?: string }> | undefined): string {
  if (!history || history.length === 0) return ''
  return history
    .map(entry => entry.full_citation || entry.action || '')
    .filter(Boolean)
    .join('; ')
}

/**
 * Parse case title into plaintiff and defendant by splitting on ' v. ' (case-insensitive).
 * Returns { plaintiff, defendant } or { plaintiff: title, defendant: '' } if no 'v.' found.
 */
function parseCaseTitle(title: string): { plaintiff: string; defendant: string } {
  const vPattern = /\s+v\.\s+/i
  const match = title.match(vPattern)
  if (!match) {
    return { plaintiff: title, defendant: '' }
  }
  const parts = title.split(vPattern)
  return {
    plaintiff: parts[0].trim(),
    defendant: parts.slice(1).join(' v. ').trim(),
  }
}

// ── Style constants ───────────────────────────────────────────────────────────

const warm:  CSSProperties = { background: PALETTE.warm }
const white: CSSProperties = { background: PALETTE.white }

const sectionBorder: CSSProperties = {
  borderTop: `1px solid var(--palette-rule)`,
}

const metadataRow: CSSProperties = {
  display:             'grid',
  gridTemplateColumns: '110px 1fr',
  gap:                 '0',
  ...ITEM_RULE,
  padding:             `${SPACING.sm} 0`,
  alignItems:          'baseline',
  userSelect:          'text',
}

const metaLabel: CSSProperties = {
  ...T.micro,
  color:    PALETTE_CSS.meta,
  minWidth: '110px',
}

const metaValue: CSSProperties = {
  ...T.prose,               // SIZE_MD (14px), consistent with body copy
  fontWeight: 400,
  lineHeight: 1.4,
  color:      PALETTE.black,
}

const termChip: CSSProperties = {
  ...T.micro,               // letterSpacing 0.12em from token
  background:   PALETTE.black,
  color:        PALETTE.white,
  padding:      `2px ${SPACING.sm}`,
  lineHeight:   '18px',
  display:      'inline-block',
  marginRight:  SPACING.xs,
  marginBottom: SPACING.xs,
}

const pendingChip: CSSProperties = {
  ...T.micro,
  background:   PALETTE_CSS.subtle,
  color:        PALETTE_CSS.muted,
  padding:      `2px ${SPACING.md}`,
  lineHeight:   '18px',
  display:      'inline-block',
}

const counselValueContainer: CSSProperties = {
  display:      'flex',
  alignItems:   'flex-start',
  gap:          '8px',
  width:        '100%',
}

const counselChevron: CSSProperties = {
  ...T.prose,
  color:        PALETTE.black,
  flexShrink:   0,
  cursor:       'pointer',
  userSelect:   'none',
  lineHeight:   1.4,
  transition:   `transform ${ANIMATION.base} ${ANIMATION.ease}`,
}

const counselValue: CSSProperties = {
  ...T.prose,
  fontWeight:   400,
  lineHeight:   1.4,
  color:        PALETTE.black,
  flex:         1,
  wordBreak:    'break-word',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CaseLawBoxProps {
  /** Full CaseLaw record (from cases.json / types.ts) */
  caseData: CaseLaw
  /** Label shown in the header tab — defaults to "Notable Decisions" */
  label?: string
}

export default function CaseLawBox({ caseData, label = 'Case Law Updates' }: CaseLawBoxProps) {
  const [expanded, setExpanded] = useState(false)
  const [counselExpanded, setCounselExpanded] = useState(false)
  const [showPagination, setShowPagination] = useState(false)
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
    disposition_structured,
    coreTerms,
    summary,
    opinionAuthor,
    opinionText,
    footnotes,
    noticeText,
    priorHistory,
    subsequent_history,
    parties,
    counsel,
  } = caseData

  const sortedFnKeys = Object.keys(footnotes ?? {}).sort((a, b) => parseInt(a) - parseInt(b))
  const fnDisplayMap: Record<string, number> = {}
  sortedFnKeys.forEach((key, i) => { fnDisplayMap[key] = i + 1 })

  // Strip preamble, inject footnote anchors, detect blockquotes, wrap pagination
  const strippedHtml        = stripOpinionPreamble(opinionText ?? '')
  const withFootnotes       = renderOpinionHtml(strippedHtml, footnotes, slug)
  const withBlockquotes     = detectAndWrapBlockquotes(withFootnotes)
  const renderedOpinionHtml = wrapPaginationMarkers(withBlockquotes)

  const hasCoreTerms = coreTerms && coreTerms.length > 0
  const hasSummary   = summary && summary.trim() && summary.trim() !== 'Summary pending.'

  return (
    <article id="case-law-box" style={{
      ...BOX_SHELL,
      width: '100%',
      borderLeft: `1px solid var(--palette-border)`,
      borderRight: `1px solid var(--palette-border)`,
      borderTop: `1px solid var(--palette-border)`,
      borderBottom: `1px solid var(--palette-border)`,
      boxSizing: 'border-box',
      overflow: 'visible',
      userSelect: 'text',
    }}>

      {/* ── 1. Case title banner ──────────────────────────────────────────── */}
      <header style={{ ...white, paddingTop: '16px', paddingBottom: '16px', paddingLeft: '14px', paddingRight: '14px', borderBottom: `1px solid ${PALETTE_CSS.border}` }}>
        <h1 style={{
          ...FONT.serif,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {(() => {
            const { plaintiff, defendant } = parseCaseTitle(title)
            return (
              <>
                <span style={{
                  fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                  fontWeight: 700,
                  color: PALETTE.black,
                  maxWidth: '85%',
                }}>
                  {plaintiff}
                </span>
                {defendant && (
                  <>
                    <span style={{
                      fontSize: '0.85em',
                      fontStyle: 'italic',
                      color: PALETTE.black,
                      margin: '0.75rem 0',
                      fontWeight: 400,
                    }}>
                      v.
                    </span>
                    <span style={{
                      fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                      fontWeight: 700,
                      color: PALETTE.black,
                      maxWidth: '85%',
                    }}>
                      {defendant}
                    </span>
                  </>
                )}
              </>
            )
          })()}
        </h1>
      </header>

      {/* ── 2. Metadata box ──────────────────────────────────────────────── */}
      <section style={{ ...warm, padding: BOX_PADDING, ...sectionBorder }}>
        {court && <MetadataRow label="Court" value={court} />}
        {docketNumber && <MetadataRow label="Docket No." value={docketNumber} />}
        {dateDecided && <MetadataRow label="Decided" value={dateDecided} />}
        {citations && (
          <div style={metadataRow}>
            <button
              onClick={() => setShowPagination(!showPagination)}
              style={{
                ...(showPagination ? {
                  ...T.micro,
                  background: PALETTE.black,
                  color: PALETTE.white,
                  padding: `2px ${SPACING.sm}`,
                  margin: '0',
                  transition: 'background 0.2s ease',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                } : {
                  ...metaLabel,
                  background: 'none',
                  padding: '0',
                  margin: '0',
                  transition: 'opacity 0.15s ease',
                }),
                border: 'none',
                cursor: 'pointer',
                lineHeight: '1',
                verticalAlign: 'baseline',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!showPagination) {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.65'
                }
              }}
              onMouseLeave={(e) => {
                if (!showPagination) {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1'
                }
              }}
              aria-label="Toggle pagination markers"
              aria-pressed={showPagination}
            >
              REPORTER
            </button>
            <span style={metaValue}>{citations}</span>
          </div>
        )}
        {priorHistory && <MetadataRow label="Prior History" value={priorHistory} />}
        {subsequent_history && subsequent_history.length > 0 && (
          <MetadataRow label="Subsequent History" value={formatSubsequentHistory(subsequent_history)} />
        )}
        {judges && <MetadataRow label="Judges" value={judges} />}
        {disposition && (
          <div style={metadataRow}>
            <span style={metaLabel}>Disposition</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {disposition_structured?.disposition_type && (
                <span style={{
                  ...T.micro,
                  background: PALETTE.black,
                  color: PALETTE.white,
                  padding: `2px 8px`,
                  lineHeight: '18px',
                  borderRadius: '2px',
                }}>
                  {disposition_structured.disposition_type}
                </span>
              )}
              <span style={metaValue}>{disposition}</span>
            </div>
          </div>
        )}
        {noticeText && <MetadataRow label="Notice" value={noticeText} />}
        {counsel && counsel.entries && counsel.entries.length > 0 && (
          <div style={{ ...metadataRow, marginTop: '2px', borderBottom: 'none' }}>
            <span style={metaLabel}>Counsel</span>
            <div style={counselValueContainer}>
              <button
                onClick={() => setCounselExpanded(!counselExpanded)}
                style={{
                  ...counselChevron,
                  transform: counselExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  margin: '0',
                  lineHeight: 1.4,
                  fontSize: '14px',
                }}
                aria-expanded={counselExpanded}
                aria-label="Toggle counsel details"
              >
                ↓
              </button>
              <span style={counselValue}>
                {(() => {
                  const fullText = formatCounselData(counsel)
                  const { text, truncated } = truncateToTwoLines(fullText)
                  return counselExpanded ? fullText : text
                })()}
              </span>
            </div>
          </div>
        )}
      </section>


      {/* ── 3. White spacer ──────────────────────────────────────────────── */}
      <div style={{ ...white, height: '16px', ...sectionBorder }} />

      {/* ── 4. Editorial box (core terms + summary) ──────────────────────── */}
      <section style={{ ...warm, padding: BOX_PADDING, ...sectionBorder }}>
        <div style={{ marginBottom: SPACING.xl }}>
          {/* Sub-section label: no bottom border — spacing + uppercase mono is sufficient */}
          <div style={{ ...BOX_HEADER, borderBottom: 'none', paddingBottom: 0, marginBottom: '10px', display: 'block' }}>
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
          <div style={{ ...BOX_HEADER, borderBottom: 'none', paddingBottom: 0, marginBottom: '10px', display: 'block' }}>
            Case Summary
          </div>
          {hasSummary ? (
            <p style={{ ...T.prose, margin: 0, color: PALETTE.black }}>
              {summary}
            </p>
          ) : (
            <p style={{ ...T.prose, margin: 0, color: PALETTE_CSS.muted, fontStyle: 'italic' }}>
              Summary pending.
            </p>
          )}
        </div>
      </section>

      {/* ── 5. Verbatim opinion ──────────────────────────────────────────── */}
      <section style={{
        ...white,
        position:   'relative',
        overflow:   'hidden',
        maxHeight:  expanded ? '8000px' : '840px',
        transition: expanded ? 'max-height 0.55s ease-in' : 'max-height 0.3s ease-out',
        padding:    '28px 24px 40px',
        ...sectionBorder,
        userSelect: 'text',
      }}>

        {/* Opinion section header — mono label (single line space to opinion text) */}
        <div style={{
          marginBottom: '12px',
        }}>
          <span style={{
            ...T.label,
            color:         PALETTE.black,
            letterSpacing: '0.22em',
          }}>
            Opinion
          </span>
        </div>

        {/* Verbatim opinion body — preamble stripped, footnote anchors injected */}
        <div
          className={`opinion-body ${showPagination ? 'show-pagination' : ''}`}
          dangerouslySetInnerHTML={{ __html: renderedOpinionHtml }}
        />

        {/* ── Bidirectional footnote list ─────────────────────────────── */}
        {sortedFnKeys.length > 0 && (
          <footer style={{
            marginTop:  '56px',
            paddingTop: '24px',
            borderTop:  '1px solid var(--palette-rule-md)',
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
        {/* ── Fade-out scrim — only visible when collapsed ────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position:      'absolute',
            bottom:        0,
            left:          0,
            right:         0,
            height:        '90px',
            background:    'linear-gradient(to bottom, transparent, var(--interactive-gradient-fade))',
            pointerEvents: 'none',
            opacity:       expanded ? 0 : 1,
            transition:    `opacity ${expanded ? '0.1s' : '0.25s'} ${ANIMATION.ease}`,
          }}
        />
      </section>

      {/* ── 6. Expand / Collapse bar ──────────────────────────────────────── */}
      <button
        className="ag-expand-bar"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        style={{
          width:          '100%',
          background:     PALETTE.white,
          border:         'none',
          // Only show a separator border once the text is fully expanded —
          // when collapsed the gradient flows seamlessly into the button area.
          borderTop:      expanded ? '1px solid var(--palette-rule)' : 'none',
          padding:        `${SPACING.md} ${SPACING.lg}`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          cursor:         'pointer',
          userSelect:     'none',
          transition:     `border-color ${ANIMATION.base} ${ANIMATION.ease}`,
        }}
      >
        <span style={{ ...T.label, color: PALETTE.black }}>
          {expanded ? 'Collapse' : 'Read Opinion'}
        </span>
        <span style={{ ...T.label, color: PALETTE.black, opacity: 0.45 }}>
          {expanded ? '↑' : '↓'}
        </span>
      </button>
    </article>
  )
}