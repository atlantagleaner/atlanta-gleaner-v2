'use client'

import { useState, useCallback, useMemo } from 'react'
import ReactCardFlip from 'react-card-flip'
import tarotRaw from '@/public/data/tarot_interpretations.json'

// ─── Types & data ─────────────────────────────────────────────────────────────

interface TarotCard {
  name:    string
  suit:    string      // 'major' | 'cups' | 'wands' | 'swords' | 'pentacles'
  rank:    number
  keywords:         string[]
  fortune_telling:  string[]
  meanings: {
    light:  string[]
    shadow: string[]
  }
}

const DECK: TarotCard[] = (tarotRaw as any).tarot_interpretations

// Suit + rank → image filename convention from metabismuth/tarot-json
// Files live in /public/images/tarot/rws/ — user drops them in after initial setup.
// Filenames: "ar00.jpg" (major arcana) or "cu01.jpg" (suit + rank)
const SUIT_PREFIX: Record<string, string> = {
  major:     'ar',
  cups:      'cu',
  wands:     'wa',
  swords:    'sw',
  pentacles: 'pe',
}

function cardImagePath(card: TarotCard): string {
  const prefix = SUIT_PREFIX[card.suit] ?? 'ar'
  const num    = String(card.rank).padStart(2, '0')
  return `/images/tarot/rws/${prefix}${num}.jpg`
}

// Positions for the 3-card spread
const POSITIONS = ['Past', 'Present', 'Future'] as const

// ─── Draw logic ───────────────────────────────────────────────────────────────

interface DrawnCard {
  card:     TarotCard
  reversed: boolean
}

function drawSpread(): DrawnCard[] {
  const pool = [...DECK]
  const drawn: DrawnCard[] = []
  for (let i = 0; i < 3; i++) {
    const idx  = Math.floor(Math.random() * pool.length)
    const card = pool.splice(idx, 1)[0]
    drawn.push({ card, reversed: Math.random() > 0.65 })
  }
  return drawn
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TarotModule() {
  const [spread,   setSpread]   = useState<DrawnCard[]>([])
  const [flipped,  setFlipped]  = useState<boolean[]>([false, false, false])
  const [active,   setActive]   = useState<number | null>(null)   // which card's detail is showing
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768)

  const handleDraw = useCallback(() => {
    setSpread(drawSpread())
    setFlipped([false, false, false])
    setActive(null)
  }, [])

  const handleFlip = useCallback((idx: number) => {
    setFlipped(prev => {
      const next = [...prev]
      next[idx]  = !next[idx]
      return next
    })
    setActive(idx)
  }, [])

  const drawnCard = active !== null ? spread[active] : null
  const cardSize = isMobile ? 70 : 90
  const padding = isMobile ? 12 : 20

  return (
    <div style={MODULE_SHELL}>

      {/* Body */}
      <div style={{ padding: `${padding}px`, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {spread.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ ...MUTED_TEXT, margin: '0 0 16px', lineHeight: 1.6, fontSize: '9px' }}>
              Three cards are drawn.<br />
              Past. Present. Future.<br />
              Click to reveal each.
            </p>
            <button onClick={handleDraw} style={BTN_PRIMARY}>
              Draw
            </button>
          </div>
        ) : (
          <>
            {/* Card positions - vertical stack */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '16px', overflowY: 'auto', flex: 1 }}>
              {spread.map((drawn, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ ...MUTED_TEXT, margin: 0 }}>{POSITIONS[idx]}</span>

                  <ReactCardFlip isFlipped={flipped[idx]} flipDirection="horizontal">
                    {/* Face-down */}
                    <div
                      onClick={() => handleFlip(idx)}
                      style={{
                        ...getCardBaseStyle(cardSize),
                        background: `linear-gradient(135deg, #1A1A2E 0%, #0B0820 100%)`,
                        border:     '1px solid rgba(184,134,11,0.30)',
                        cursor:     'pointer',
                        display:    'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none',
                      }}
                    >
                      {CARD_BACK_PATTERN}
                    </div>

                    {/* Face-up */}
                    <div
                      onClick={() => setActive(idx)}
                      style={{
                        ...getCardBaseStyle(cardSize),
                        border:   `1px solid rgba(184,134,11,${active === idx ? '0.60' : '0.25'})`,
                        overflow: 'hidden',
                        cursor:   'pointer',
                        transform: drawn.reversed ? 'rotate(180deg)' : 'none',
                        boxShadow: active === idx ? '0 0 12px rgba(184,134,11,0.25)' : 'none',
                        transition: 'box-shadow 0.2s ease',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cardImagePath(drawn.card)}
                        alt={drawn.card.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => {
                          // Fallback if image not yet added
                          const el = e.currentTarget
                          el.style.display = 'none'
                          const fallback = el.parentElement!
                          fallback.style.background = '#0B0820'
                          fallback.style.display    = 'flex'
                          fallback.style.alignItems = 'center'
                          fallback.style.justifyContent = 'center'
                          const txt = document.createElement('span')
                          txt.style.cssText = 'font-family:"IBM Plex Mono",monospace;font-size:8px;color:rgba(184,134,11,0.6);text-align:center;padding:4px;text-transform:uppercase;letter-spacing:0.1em'
                          txt.textContent = drawn.card.name
                          fallback.appendChild(txt)
                        }}
                      />
                    </div>
                  </ReactCardFlip>
                </div>
              ))}
            </div>

            {/* Detail panel for selected card */}
            {drawnCard && flipped[active!] && (
              <div style={{
                borderTop:       '1px solid rgba(184,134,11,0.12)',
                paddingTop:      isMobile ? '12px' : '16px',
                animation:       'saturn-fade-in 0.3s ease',
                overflowY:       'auto',
              }}>
                <style>{`@keyframes saturn-fade-in { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }`}</style>

                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#B8860B', margin: '0 0 3px', textShadow: '0 0 12px rgba(184,134,11,0.50)' }}>
                  {drawnCard.card.name}
                </p>
                <p style={{ ...MUTED_TEXT, fontSize: isMobile ? '8px' : '10px', margin: '0 0 8px' }}>
                  {drawnCard.reversed ? 'Reversed' : 'Upright'} · {drawnCard.card.suit}
                </p>

                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: isMobile ? '11px' : '13px', color: '#F5F1E8', lineHeight: 1.5, margin: '0 0 6px' }}>
                  {drawnCard.card.fortune_telling[0]}
                </p>

                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: isMobile ? '10px' : '12px', color: 'rgba(245,241,232,0.75)', lineHeight: 1.4, margin: 0 }}>
                  {drawnCard.reversed
                    ? drawnCard.card.meanings.shadow[0]
                    : drawnCard.card.meanings.light[0]
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {spread.length > 0 && (
        <>
          <div style={DIVIDER} />
          <div style={{ padding: '12px 20px', display: 'flex', gap: '10px' }}>
            <button onClick={handleDraw} style={BTN_PRIMARY}>
              Draw Again
            </button>
            <button onClick={() => { setSpread([]); setActive(null) }} style={BTN_GHOST}>
              Clear
            </button>
          </div>
        </>
      )}
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

// Note: CARD_BASE is now set dynamically based on screen size in the component
const getCardBaseStyle = (size: number): React.CSSProperties => ({
  aspectRatio:     '2/3',
  width:           `${size}px`,
  height:          `${size * 1.5}px`,
  transition:      'border-color 0.2s ease',
})

// SVG-based card back pattern (geometric, Saturn-themed)
function CardBackPattern() {
  return (
    <svg viewBox="0 0 60 90" style={{ width: '70%', opacity: 0.35 }} xmlns="http://www.w3.org/2000/svg">
      <rect x="4"  y="4"  width="52" height="82" fill="none" stroke="#B8860B" strokeWidth="1"/>
      <rect x="8"  y="8"  width="44" height="74" fill="none" stroke="#B8860B" strokeWidth="0.5"/>
      <line x1="30" y1="8"  x2="30" y2="82" stroke="#B8860B" strokeWidth="0.3"/>
      <line x1="8"  y1="45" x2="52" y2="45" stroke="#B8860B" strokeWidth="0.3"/>
      <circle cx="30" cy="45" r="10" fill="none" stroke="#B8860B" strokeWidth="0.8"/>
      <circle cx="30" cy="45" r="3"  fill="#B8860B" opacity="0.6"/>
      <path d="M20 45 Q30 35 40 45 Q30 55 20 45Z" fill="none" stroke="#B8860B" strokeWidth="0.5"/>
    </svg>
  )
}
const CARD_BACK_PATTERN = <CardBackPattern />

const BTN_PRIMARY: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono', monospace",
  fontSize:      '10px',
  fontWeight:    700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.12em',
  color:         '#0B0820',
  background:    '#B8860B',
  border:        'none',
  padding:       '9px 16px',
  cursor:        'pointer',
}

const BTN_GHOST: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono', monospace",
  fontSize:      '10px',
  fontWeight:    500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.12em',
  color:         'rgba(245,241,232,0.45)',
  background:    'transparent',
  border:        '1px solid rgba(184,134,11,0.20)',
  padding:       '9px 16px',
  cursor:        'pointer',
}
