'use client'

import { useState } from 'react'
import zodiacRaw from '@/public/data/zodiac.json'

// ─── Types & data ─────────────────────────────────────────────────────────────

interface ZodiacSign {
  name:           string
  symbol:         string
  gloss:          string    // "The Ram"
  element:        string
  ruling_planet:  string
  dates:          string
  keywords:       string[]
  reading:        string
}

// Custom daily readings — earnest, consequence-laden, pulp register
const READINGS: Record<string, string> = {
  Aries:
    'The planets align in your favor for bold action today. What you pursue with conviction will yield. But beware: momentum without wisdom is recklessness. Mars favors the decisive, not the rash.',
  Taurus:
    'The stars counsel patience. Your foundations strengthen in silence. Resist the urge to force outcomes that require time to ripen. Venus rewards those who know when to hold still.',
  Gemini:
    'Mercury whispers from two directions at once. Listen carefully. What is not said may matter more than what is. Today, choose your words as if they were evidence — because they are.',
  Cancer:
    'The tide turns inward. Emotions run deep as lunar currents today. Honor what you feel; it is data, not weakness. The shell protects. But know when to emerge from it.',
  Leo:
    'Eyes are on you whether you invite them or not. Play the starring role with grace. Humility today builds the stage for tomorrow\'s performance. The sun shines on those who deserve it.',
  Virgo:
    'The system reveals its flaws today. Attend to them with precision. Perfection is a horizon, not a destination — but progress is real. Details accumulate into outcomes. Attend to them.',
  Libra:
    'The scales tip. Seek equilibrium, but know that balanced scales are never perfectly still. A relationship holds a mirror up to you. Look at the reflection honestly. Act accordingly.',
  Scorpio:
    'Hidden truths surface today — yours and others\'. Embrace the darkness; it teaches. Intensity is not a flaw. It is your sharpest instrument. Use it with precision, not with rage.',
  Sagittarius:
    'The arrow is drawn. Aim high and wide. Wisdom comes from chasing horizons. Your restlessness is not a liability — it is a compass. Let it take you somewhere new today.',
  Capricorn:
    'Discipline builds empires. What you sacrifice now compounds interest. The goat does not rush the summit. Ambition is not greed; it is the geometry of sustained effort. Climb.',
  Aquarius:
    'Innovation flows through you today. Reject what no longer serves the collective. Genius is born from rebellion against what everyone else accepts. Pour freely and without apology.',
  Pisces:
    'Surrender to the current. What you cannot control often controls you. There is freedom in letting go of the oar. Your intuition today is more accurate than your logic. Trust it.',
}

// Parse the corpora zodiac JSON into our shape
const SIGNS: ZodiacSign[] = Object.entries((zodiacRaw as any).western_zodiac).map(
  ([name, data]: [string, any]) => ({
    name,
    symbol:         data.unicode_symbol,
    gloss:          data.gloss,
    element:        data.element,
    ruling_planet:  data.ruling_body_modern ?? data.ruling_body_classic,
    dates:          `${data.approximate_start_date} – ${data.approximate_end_date}`,
    keywords:       data.keywords ?? [],
    reading:        READINGS[name] ?? 'The stars are silent today.',
  })
)

// Auto-select today's sign based on day of year
function todaySignIndex(): number {
  const now    = new Date()
  const start  = new Date(now.getFullYear(), 0, 0)
  const diff   = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const day    = Math.floor(diff / oneDay)
  return day % 12
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AstrologyModule() {
  const [selectedIdx, setSelectedIdx] = useState(todaySignIndex)
  const sign = SIGNS[selectedIdx]

  return (
    <div style={MODULE_SHELL}>

      {/* Sign selector — 12 symbols in a row */}
      <div style={{
        display:       'flex',
        flexWrap:      'wrap' as const,
        gap:           '0',
        borderBottom:  '1px solid rgba(184,134,11,0.10)',
        padding:       '10px 16px',
      }}>
        {SIGNS.map((s, idx) => (
          <button
            key={s.name}
            onClick={() => setSelectedIdx(idx)}
            title={s.name}
            style={{
              background:    selectedIdx === idx ? 'rgba(184,134,11,0.15)' : 'transparent',
              border:        selectedIdx === idx
                               ? '1px solid rgba(184,134,11,0.45)'
                               : '1px solid transparent',
              color:         selectedIdx === idx ? '#B8860B' : 'rgba(245,241,232,0.45)',
              fontFamily:    'sans-serif',
              fontSize:      '14px',
              width:         '32px',
              height:        '32px',
              cursor:        'pointer',
              borderRadius:  '0',
              transition:    'all 0.15s ease',
              lineHeight:    1,
              padding:       0,
            }}
          >
            {s.symbol}
          </button>
        ))}
      </div>

      {/* Sign card */}
      <div style={{ padding: '20px', flex: 1 }}>

        {/* Sign identity */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '4px' }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   '28px',
              color:      '#B8860B',
              lineHeight: 1,
            }}>
              {sign.symbol}
            </span>
            <h2 style={{
              fontFamily:    "'Cormorant Garamond', serif",
              fontSize:      '22px',
              fontWeight:    700,
              color:         '#F5F1E8',
              margin:        0,
              letterSpacing: '-0.01em',
            }}>
              {sign.name}
            </h2>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize:   '10px',
              color:      'rgba(245,241,232,0.40)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
            }}>
              {sign.gloss}
            </span>
          </div>

          <p style={{ ...MUTED_TEXT, margin: '4px 0 0' }}>
            {sign.dates}
          </p>
        </div>

        <div style={{ borderTop: '1px solid rgba(184,134,11,0.10)', paddingTop: '14px', marginBottom: '14px' }}>
          {/* Metadata row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: '14px' }}>
            {[
              ['Element',       sign.element],
              ['Ruling Planet', sign.ruling_planet],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <p style={{ ...MUTED_TEXT, margin: '0 0 2px' }}>{lbl}</p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#F5F1E8', margin: 0, letterSpacing: '0.06em' }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Keywords */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '14px' }}>
            {sign.keywords.map(kw => (
              <span key={kw} style={{
                fontFamily:    "'IBM Plex Mono', monospace",
                fontSize:      '9px',
                fontWeight:    600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.10em',
                color:         '#0B0820',
                background:    'rgba(184,134,11,0.80)',
                padding:       '2px 7px',
              }}>
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Daily reading */}
        <div style={{ borderTop: '1px solid rgba(184,134,11,0.10)', paddingTop: '14px' }}>
          <p style={{ ...MUTED_TEXT, margin: '0 0 8px' }}>Today's Reading</p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle:  'italic',
            fontSize:   '14px',
            color:      '#F5F1E8',
            lineHeight: 1.65,
            margin:     0,
          }}>
            {sign.reading}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const MODULE_SHELL: React.CSSProperties = {
  border:          '1px solid rgba(184,134,11,0.20)',
  backgroundColor: '#1A1A2E',
  display:         'flex',
  flexDirection:   'column',
  boxShadow:       'inset 0 0 40px rgba(11,8,32,0.6)',
}

const MODULE_HEADER: React.CSSProperties = {
  padding: '14px 20px 0',
}

const LABEL: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono', monospace",
  fontSize:      '10px',
  fontWeight:    700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.16em',
  color:         '#B8860B',
  textShadow:    '0 0 12px rgba(184,134,11,0.60), 0 0 24px rgba(184,134,11,0.30)',
}

const DIVIDER: React.CSSProperties = {
  borderBottom: '1px solid rgba(184,134,11,0.10)',
  margin:       '12px 0 0',
}

const MUTED_TEXT: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono', monospace",
  fontSize:      '10px',
  color:         'rgba(245,241,232,0.45)',
  letterSpacing: '0.10em',
  textTransform: 'uppercase' as const,
}
