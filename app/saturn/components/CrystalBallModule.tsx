'use client'

import { useState, useCallback } from 'react'
import tarotData  from '@/public/data/tarot_interpretations.json'
import cookieData from '@/public/data/fortune-cookie.json'

// ─── Fortune pool ─────────────────────────────────────────────────────────────
// Pull fortune_telling arrays from every tarot card, then mix in fortune cookies

const TAROT_FORTUNES: string[] = (tarotData as any).tarot_interpretations.flatMap(
  (card: any) => card.fortune_telling as string[]
)

const COOKIE_FORTUNES: string[] = cookieData as unknown as string[]

// Hand-written pulp fortunes in the earnest / noir register
const PULP_FORTUNES: string[] = [
  'Clarity will come in unexpected ways.',
  'You will purchase a sandwich on Thursday.',
  'Three phone calls await you. Answer the third.',
  'Your karmic debt is higher than you think.',
  'A journey across water brings revelation.',
  'You will find a coin. It is worthless.',
  'Betrayal wears the face of a friend. Choose wisely.',
  'The crystal shows you what you already know.',
  'Silence is the loudest answer.',
  'You will receive a letter. It changes nothing.',
  'Seven doors open; choose the red one.',
  'In the mirror, you will see a stranger. It is you.',
  'The path forward is hidden. That is the point.',
  'You will laugh at something you fear now.',
  'A gift arrives when you stop expecting it.',
  'The debt you owe is to yourself.',
  'Water remembers. So will you.',
  'You are more lost than you know. This is good.',
  'The cards lie, but the crystal? The crystal never lies.',
  'In seven weeks, you will remember this moment.',
  'You will make a choice that feels wrong. It will be right.',
  'The person you seek is seeking you.',
  'A storm approaches. You are ready.',
  'What you plant now blooms in winter.',
  'You will receive advice. Ignore it.',
  'Three truths and one lie — only you know which is which.',
  'In darkness, you will find your light.',
  'A name will return to you. Answer when it does.',
  'You are exactly where you need to be.',
  'When you stop running, it will finally catch you.',
  'A stranger will change your path. Thank them later.',
  'You will outgrow something you love.',
  'The key you seek is in your pocket.',
  'Fortune favors those who remember it exists.',
  'Something ends. Something begins. This is the same event.',
]

const ALL_FORTUNES = [...PULP_FORTUNES, ...TAROT_FORTUNES, ...COOKIE_FORTUNES]

function pickFortune(): string {
  return ALL_FORTUNES[Math.floor(Math.random() * ALL_FORTUNES.length)]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CrystalBallModule() {
  const [fortune,     setFortune]     = useState<string | null>(null)
  const [animating,   setAnimating]   = useState(false)
  const [revealed,    setRevealed]    = useState(false)

  const reveal = useCallback(() => {
    if (animating) return
    setAnimating(true)
    setRevealed(false)
    setFortune(null)

    setTimeout(() => {
      setFortune(pickFortune())
      setRevealed(true)
      setAnimating(false)
    }, 1400)
  }, [animating])

  const reset = useCallback(() => {
    setFortune(null)
    setRevealed(false)
    setAnimating(false)
  }, [])

  return (
    <div style={MODULE_SHELL}>
      <style>{BALL_CSS}</style>

      {/* Header */}
      <div style={MODULE_HEADER}>
        <span style={LABEL}>III. The Sphere</span>
      </div>
      <div style={DIVIDER} />

      {/* Ball + fortune area */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', flex: 1 }}>

        {/* Crystal ball */}
        <div
          className={`saturn-ball${animating ? ' saturn-ball--glow' : ''}${revealed ? ' saturn-ball--revealed' : ''}`}
          onClick={reveal}
          role="button"
          tabIndex={0}
          aria-label="Consult the crystal ball"
          onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? reveal() : undefined}
          style={{ cursor: animating ? 'wait' : 'pointer' }}
        >
          {/* Inner swirl layers */}
          <div className="saturn-ball__inner" />
          <div className="saturn-ball__shimmer" />
        </div>

        {/* Fortune text */}
        <div style={{ minHeight: '80px', textAlign: 'center', width: '100%' }}>
          {!fortune && !animating && (
            <p style={{ ...MUTED_TEXT, margin: 0 }}>
              Touch the sphere to receive your reading.
            </p>
          )}
          {animating && (
            <p style={{ ...MUTED_TEXT, margin: 0, fontStyle: 'italic' }}>
              The mists gather…
            </p>
          )}
          {fortune && revealed && (
            <p
              className="saturn-fortune-text"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '15px',
                fontStyle: 'italic',
                color: '#F5F1E8',
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              "{fortune}"
            </p>
          )}
        </div>
      </div>

      <div style={DIVIDER} />

      {/* Actions */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: '10px' }}>
        <button onClick={reveal} disabled={animating} style={BTN_PRIMARY}>
          {animating ? 'Reading…' : revealed ? 'Consult Again' : 'Consult the Sphere'}
        </button>
        {revealed && (
          <button onClick={reset} style={BTN_GHOST}>
            Clear
          </button>
        )}
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
  padding:    '14px 20px 0',
}

const LABEL: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono', monospace",
  fontSize:      '10px',
  fontWeight:    700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.16em',
  color:         '#B8860B',
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

// ─── Crystal ball CSS ─────────────────────────────────────────────────────────

const BALL_CSS = `
.saturn-ball {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  position: relative;
  background: radial-gradient(circle at 35% 35%,
    rgba(212,175,55,0.25) 0%,
    rgba(92,26,26,0.15)   30%,
    rgba(26,26,46,0.9)    60%,
    rgba(11,8,32,0.98)    100%
  );
  box-shadow:
    inset 0 0 30px rgba(11,8,32,0.8),
    inset -6px -6px 20px rgba(184,134,11,0.08),
    0 0 20px rgba(184,134,11,0.10),
    0 8px 40px rgba(11,8,32,0.8);
  transition: box-shadow 0.4s ease;
  overflow: hidden;
  flex-shrink: 0;
}

.saturn-ball:hover {
  box-shadow:
    inset 0 0 30px rgba(11,8,32,0.8),
    inset -6px -6px 20px rgba(184,134,11,0.12),
    0 0 28px rgba(184,134,11,0.18),
    0 8px 40px rgba(11,8,32,0.8);
}

.saturn-ball__inner {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%,
    rgba(184,134,11,0.10) 0%,
    transparent 70%
  );
  transition: opacity 0.6s ease;
}

.saturn-ball__shimmer {
  position: absolute;
  top: 12%;
  left: 18%;
  width: 28%;
  height: 18%;
  border-radius: 50%;
  background: radial-gradient(ellipse,
    rgba(245,241,232,0.18) 0%,
    transparent 80%
  );
  transform: rotate(-30deg);
}

/* Glow animation on click */
.saturn-ball--glow {
  animation: saturnGlow 1.4s ease-out forwards;
}

@keyframes saturnGlow {
  0%   { box-shadow: inset 0 0 30px rgba(11,8,32,0.8), 0 0 20px rgba(184,134,11,0.10); }
  35%  { box-shadow: inset 0 0 10px rgba(11,8,32,0.4), inset 0 0 60px rgba(184,134,11,0.25), 0 0 60px rgba(184,134,11,0.40), 0 0 120px rgba(184,134,11,0.20); }
  70%  { box-shadow: inset 0 0 20px rgba(11,8,32,0.6), inset 0 0 40px rgba(184,134,11,0.15), 0 0 40px rgba(184,134,11,0.25); }
  100% { box-shadow: inset 0 0 30px rgba(11,8,32,0.8), 0 0 24px rgba(184,134,11,0.15); }
}

.saturn-ball--glow .saturn-ball__inner {
  animation: innerSwirl 1.4s ease-out forwards;
}

@keyframes innerSwirl {
  0%   { opacity: 0.4; transform: scale(1) rotate(0deg); }
  50%  { opacity: 1;   transform: scale(1.3) rotate(180deg); background: radial-gradient(circle at 50% 50%, rgba(184,134,11,0.25) 0%, transparent 70%); }
  100% { opacity: 0.6; transform: scale(1) rotate(360deg); }
}

/* Fortune fade-in */
.saturn-fortune-text {
  animation: fortuneReveal 0.8s ease-out forwards;
}

@keyframes fortuneReveal {
  0%   { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}
`
