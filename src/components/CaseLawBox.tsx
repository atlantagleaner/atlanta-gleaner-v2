'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CaseLawBox — Roll-B panel. Each instance is a specific published case.
// Future Solito: portable (inline styles only)
// Future Supabase: accept `caseData` prop fetched server-side per page
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react'
import { FEATURED_CASE, type CaseLaw } from '@/src/data/cases'

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" }
const sans: CSSProperties = { fontFamily: "'Inter', sans-serif" }

function MetaRow({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'baseline',
      padding: '6px 0',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      gap: '8px',
      flexWrap: 'wrap',
    }}>
      <span style={{
        ...mono,
        fontSize: '9px',
        fontWeight: 700,
        color: '#888',
        minWidth: '120px',
        flexShrink: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        {label}:
      </span>
      <span style={{
        ...sans,
        fontSize: '12px',
        color: alert ? '#000' : '#333',
        fontWeight: alert ? 600 : 400,
        background: alert ? '#fef9c3' : 'transparent',
        padding: alert ? '1px 5px' : '0',
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
  const [btnHovered, setBtnHovered] = useState(false)

  return (
    <div style={{ height: '100%', ...style }}>
      <div style={{ border: '1px solid rgba(0,0,0,0.18)', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Dark header bar */}
        <div style={{
          background: '#111',
          padding: '7px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ ...mono, fontSize: '9px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
            Roll&#x2011;B · Case Law Updates
          </span>
          <span style={{ ...mono, fontSize: '9px', color: '#444', letterSpacing: '0.1em' }}>
            REF:{caseData.docketNumber}
          </span>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* ── Frame 01: Case title ── */}
          <div style={{ background: 'rgba(0,0,0,0.025)', padding: '3px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <span style={{ ...mono, fontSize: '9px', color: '#bbb' }}>▶ 01</span>
          </div>
          <div style={{ padding: '20px 20px 16px' }}>
            <h2 style={{
              ...mono,
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              fontWeight: 700,
              borderBottom: '2px solid #000',
              paddingBottom: '7px',
              margin: '0 0 16px 0',
            }}>
              Case Law Updates
            </h2>
            <h3 style={{
              ...serif,
              fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              color: '#000',
              margin: 0,
              textShadow: '0 0 1px rgba(0,0,0,0.2)',
            }}>
              {caseData.title}
            </h3>
          </div>

          {/* ── Frame 02: Metadata ── */}
          <div style={{ background: 'rgba(0,0,0,0.025)', padding: '3px 14px', borderTop: '1px solid rgba(0,0,0,0.07)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <span style={{ ...mono, fontSize: '9px', color: '#bbb' }}>▶ 02</span>
          </div>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: '#fafafa' }}>
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

          {/* ── Frame 03: Summary ── */}
          <div style={{ background: 'rgba(0,0,0,0.025)', padding: '3px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <span style={{ ...mono, fontSize: '9px', color: '#bbb' }}>▶ 03</span>
          </div>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <p style={{ ...sans, fontSize: '12px', color: '#666', marginBottom: '12px', margin: '0 0 12px 0' }}>
              <span style={{
                ...mono,
                fontSize: '9px',
                fontWeight: 700,
                background: '#f3f4f6',
                padding: '1px 6px',
                marginRight: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Core Terms:
              </span>
              {caseData.coreTerms.join(' · ')}
            </p>
            <p style={{
              ...mono,
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#aaa',
              margin: '12px 0 8px',
              paddingBottom: '6px',
              borderBottom: '1px solid rgba(0,0,0,0.07)',
            }}>
              Case Summary
            </p>
            <p style={{ ...sans, fontSize: '14px', lineHeight: 1.65, color: '#222', margin: '0 0 12px 0' }}>
              {caseData.summary}
            </p>
            <p style={{
              ...sans,
              fontSize: '14px',
              lineHeight: 1.65,
              fontWeight: 600,
              borderLeft: '3px solid #000',
              paddingLeft: '12px',
              margin: '14px 0',
              color: '#000',
            }}>
              {caseData.holdingBold}
            </p>
            <p style={{ ...sans, fontSize: '14px', lineHeight: 1.65, color: '#333', margin: 0 }}>
              {caseData.conclusionText}
            </p>
          </div>

          {/* ── Frame 04: Opinion ── */}
          <div style={{ background: 'rgba(0,0,0,0.025)', padding: '3px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
            <span style={{ ...mono, fontSize: '9px', color: '#bbb' }}>▶ 04</span>
          </div>
          <div style={{ padding: '18px 20px 24px' }}>
            <h4 style={{
              ...serif,
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 8px 0',
              borderBottom: '1px solid rgba(0,0,0,0.10)',
              paddingBottom: '8px',
            }}>
              Opinion
            </h4>
            <p style={{ ...mono, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', margin: '0 0 14px 0' }}>
              {caseData.opinionAuthor}
            </p>
            {caseData.opinionExcerpt.split('\n\n').map((para, i) => (
              <p key={i} style={{ ...sans, fontSize: '14px', lineHeight: 1.7, color: '#333', margin: '0 0 14px 0' }}>
                {para}
              </p>
            ))}

            {!opinionOpen ? (
              <button
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                onClick={() => setOpinionOpen(true)}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  marginTop: '6px',
                  border: '2px solid #000',
                  background: btnHovered ? '#000' : 'transparent',
                  color: btnHovered ? '#F7F2EA' : '#000',
                  ...mono,
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
              >
                [ Load Full Opinion ]
              </button>
            ) : (
              <p style={{ ...mono, fontSize: '10px', color: '#aaa', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '6px 0 0' }}>
                [ Full opinion · Supabase integration pending ]
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
