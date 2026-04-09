'use client'

import { useReducer, useRef, useEffect, useCallback, useState } from 'react'

// ─── Engine (CJS) ──────────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-var-requires */
const bjLib     = require('engine-blackjack')
const bjActions = bjLib.actions
const bjEngine  = bjLib.engine
/* eslint-enable */

// ─── Constants ─────────────────────────────────────────────────────────────────
const GOLD        = 2
const BRONZE      = 1
const KARMA_LIMIT = 8
const CR          = 13   // coin radius
const CD          = CR * 2

// Layout boxes — all coords relative to content area
const PB = { x: 12,  y: 318, w: 204, h: 112 }  // player coin box
const WB = { x: 228, y: 328, w: 64,  h: 90  }  // wager box
const SB = { x: 304, y: 328, w: 64,  h: 90  }  // split-wager (dynamic)
const IB = { x: 304, y: 328, w: 64,  h: 90  }  // insurance (same pos, mutually exclusive)

// Dealer bust % by up-card value (standard infinite-deck table)
const DEALER_BUST: Record<number, number> = {
  1: 11.7, 2: 35.4, 3: 37.6, 4: 40.3, 5: 42.9,
  6: 42.1, 7: 25.9, 8: 23.9, 9: 23.3, 10: 21.4,
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface EngCard {
  text:  string
  suite: string
  value: number
  color: string
}

interface Coin {
  id:        string
  type:      'gold' | 'bronze'
  value:     number
  x:         number
  y:         number
  container: 'player' | 'wager' | 'split' | 'insurance'
  locked:    boolean
}

type Prompt = 'more-coins' | 'odds' | null

interface S {
  stage:              string
  dealerCards:        EngCard[]
  dealerHoleCard:     EngCard | null
  dealerValue:        { hi: number; lo: number } | null
  dealerHasBlackjack: boolean
  dealerHasBusted:    boolean
  handRight:          any
  handLeft:           any
  wonOnRight:         number
  wonOnLeft:          number
  initialBet:         number
  sideBetsInfo:       any
  coins:              Coin[]
  karmaDebt:          number
  showOdds:           boolean
  dialogue:           string
  prompt:             Prompt
  gameOver:           boolean
  showSplit:          boolean
  showIns:            boolean
}

type A =
  | { type: 'SYNC';           eng: any; overrides?: Partial<S> }
  | { type: 'DROP';           id: string; container: Coin['container']; x: number; y: number }
  | { type: 'BOUNCE';         id: string }
  | { type: 'MORE_COINS_YES' }
  | { type: 'MORE_COINS_NO'  }
  | { type: 'ODDS_YES'        }
  | { type: 'ODDS_NO'         }
  | { type: 'RESET'           }

// ─── Helpers ───────────────────────────────────────────────────────────────────
let _cid = 0
function uid() { return `c${++_cid}_${Date.now()}` }

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function inBox(x: number, y: number, b: typeof PB) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h
}

function scatter(
  specs: Array<{ type: 'gold' | 'bronze'; value: number }>,
  box: typeof PB,
  container: Coin['container'],
): Coin[] {
  return specs.map(s => ({
    id:        uid(),
    type:      s.type,
    value:     s.value,
    x:         clamp(box.x + CR + Math.random() * (box.w - CD), box.x + CR, box.x + box.w - CR),
    y:         clamp(box.y + CR + Math.random() * (box.h - CD), box.y + CR, box.y + box.h - CR),
    container,
    locked:    false,
  }))
}

function valueToCoins(pts: number): Array<{ type: 'gold' | 'bronze'; value: number }> {
  const result: Array<{ type: 'gold' | 'bronze'; value: number }> = []
  let rem = Math.floor(pts)
  while (rem >= GOLD)   { result.push({ type: 'gold',   value: GOLD   }); rem -= GOLD   }
  while (rem >= BRONZE) { result.push({ type: 'bronze', value: BRONZE }); rem -= BRONZE }
  return result
}

function coinsIn(coins: Coin[], container: Coin['container']) {
  return coins.filter(c => c.container === container)
}
function sumCoins(coins: Coin[]) {
  return coins.reduce((s, c) => s + c.value, 0)
}

function bustProb(handCards: EngCard[], deck: EngCard[]): number {
  if (!handCards?.length || !deck?.length) return 0
  const bust = deck.filter(c => {
    const next = [...handCards, c]
    const val  = bjEngine.calculate(next)
    return val && bjEngine.checkForBusted(val)
  })
  return Math.round((bust.length / deck.length) * 100)
}

// ─── Initial state ─────────────────────────────────────────────────────────────
function initState(): S {
  const specs = [
    ...Array(4).fill({ type: 'gold'   as const, value: GOLD   }),
    ...Array(2).fill({ type: 'bronze' as const, value: BRONZE }),
  ]
  return {
    stage:              'ready',
    dealerCards:        [],
    dealerHoleCard:     null,
    dealerValue:        null,
    dealerHasBlackjack: false,
    dealerHasBusted:    false,
    handRight:          {},
    handLeft:           {},
    wonOnRight:         0,
    wonOnLeft:          0,
    initialBet:         0,
    sideBetsInfo:       {},
    coins:              scatter(specs, PB, 'player'),
    karmaDebt:          0,
    showOdds:           false,
    dialogue:           'Looks like someone left their coins behind...',
    prompt:             null,
    gameOver:           false,
    showSplit:          false,
    showIns:            false,
  }
}

// ─── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state: S, action: A): S {
  switch (action.type) {

    case 'SYNC': {
      const e       = action.eng
      const stage   = e.stage   ?? 'ready'
      const hRight  = e.handInfo?.right ?? {}
      const hLeft   = e.handInfo?.left  ?? {}
      let   coins   = state.coins
      let   dlg     = state.dialogue
      let   prompt  = state.prompt
      let   showSplit = state.showSplit
      let   showIns   = state.showIns
      let   gameOver  = state.gameOver
      let   showOdds  = state.showOdds

      if (stage === 'player-turn-right') {
        showIns = !!(hRight.availableActions?.insurance)
        if (showIns) {
          dlg = 'Ace in the hole. Insurance?'
          prompt = null
        } else if (hRight.playerHasBlackjack) {
          dlg = 'Twenty-one. Saturn smiles... for now.'
        } else if (hRight.availableActions?.split) {
          showSplit = true
          dlg = 'Pairs. The fates divide. Match your wager.'
        } else {
          dlg = state.prompt === 'odds' ? state.dialogue : 'Your move.'
        }
      }

      if (stage === 'player-turn-left') {
        dlg = 'The second hand awaits.'
      }

      if (stage === 'done') {
        const insWin   = e.sideBetsInfo?.insurance?.win ?? 0
        const totalWon = (e.wonOnRight ?? 0) + (e.wonOnLeft ?? 0) + insWin

        // Strip wagered coins; return won coins
        coins = coinsIn(state.coins, 'player')
        if (totalWon > 0) {
          coins = [...coins, ...scatter(valueToCoins(totalWon), PB, 'player')]
        }

        const wNet = (e.wonOnRight ?? 0) - (e.initialBet ?? 0)
        if (e.dealerHasBlackjack && !hRight.playerHasBlackjack) {
          dlg = 'The house has twenty-one. As it was written.'
        } else if (hRight.playerHasBlackjack) {
          dlg = 'Twenty-one. The stars align... for now.'
        } else if (hRight.playerHasBusted) {
          dlg = 'Too far. The table claims its due.'
        } else if (e.dealerHasBusted) {
          dlg = 'The dealer breaks. Fortune smiles... briefly.'
        } else if (hRight.playerHasSurrendered) {
          dlg = 'A wise retreat.'
        } else if (wNet > 0) {
          dlg = 'The coins return to you.'
        } else if (wNet === 0) {
          dlg = 'The balance holds. For now.'
        } else {
          dlg = 'The debt grows.'
        }

        showSplit = false
        showIns   = false
        prompt    = null

        const total = sumCoins(coins)
        if (total === 0) {
          prompt  = 'more-coins'
          dlg     = 'More coins?'
        }
      }

      return {
        ...state,
        stage,
        dealerCards:        e.dealerCards        ?? [],
        dealerHoleCard:     e.dealerHoleCard      ?? null,
        dealerValue:        e.dealerValue         ?? null,
        dealerHasBlackjack: e.dealerHasBlackjack  ?? false,
        dealerHasBusted:    e.dealerHasBusted     ?? false,
        handRight:          hRight,
        handLeft:           hLeft,
        wonOnRight:         e.wonOnRight          ?? 0,
        wonOnLeft:          e.wonOnLeft           ?? 0,
        initialBet:         e.initialBet          ?? state.initialBet,
        sideBetsInfo:       e.sideBetsInfo        ?? {},
        coins,
        dialogue: dlg,
        prompt,
        showSplit,
        showIns,
        gameOver,
        showOdds,
        ...(action.overrides ?? {}),
      }
    }

    case 'DROP': {
      const { id, container, x, y } = action
      return {
        ...state,
        coins: state.coins.map(c =>
          c.id === id
            ? { ...c, container, x, y, locked: container !== 'player' }
            : c
        ),
      }
    }

    case 'BOUNCE': {
      const nx = clamp(PB.x + CR + Math.random() * (PB.w - CD), PB.x + CR, PB.x + PB.w - CR)
      const ny = clamp(PB.y + CR + Math.random() * (PB.h - CD), PB.y + CR, PB.y + PB.h - CR)
      return {
        ...state,
        coins: state.coins.map(c =>
          c.id === action.id ? { ...c, container: 'player', x: nx, y: ny, locked: false } : c
        ),
      }
    }

    case 'MORE_COINS_YES': {
      const specs = [
        ...Array(4).fill({ type: 'gold'   as const, value: GOLD   }),
        ...Array(2).fill({ type: 'bronze' as const, value: BRONZE }),
      ]
      const added    = 4 * GOLD + 2 * BRONZE   // 10 pts
      const newDebt  = state.karmaDebt + added
      const trigOdds = !state.showOdds && newDebt >= KARMA_LIMIT
      return {
        ...state,
        coins:     [...coinsIn(state.coins, 'player'), ...scatter(specs, PB, 'player')],
        karmaDebt: newDebt,
        stage:     'ready',
        prompt:    trigOdds ? 'odds' : null,
        dialogue:  trigOdds ? 'I can show you the odds...' : 'Four more. The ledger grows.',
      }
    }

    case 'MORE_COINS_NO':
      return { ...state, gameOver: true, prompt: null, dialogue: 'Your debt is recorded. Until next time.' }

    case 'ODDS_YES':
      return { ...state, showOdds: true, prompt: null, dialogue: 'Fair warning — I am both the dealer and the bank....' }

    case 'ODDS_NO':
      return { ...state, prompt: null, dialogue: 'As you wish.' }

    case 'RESET':
      return initState()

    default:
      return state
  }
}

// ─── Card component ────────────────────────────────────────────────────────────
function PlayingCard({ card, hidden = false }: { card?: EngCard; hidden?: boolean }) {
  const CARD: React.CSSProperties = {
    width:           44,
    height:          62,
    border:          '1px solid rgba(184,134,11,0.35)',
    borderRadius:    3,
    background:      hidden ? 'linear-gradient(135deg,#1A1A2E,#0B0820)' : '#F5F1E8',
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'flex-start',
    justifyContent:  'flex-start',
    padding:         '3px 4px',
    flexShrink:      0,
    position:        'relative',
    boxShadow:       '0 1px 4px rgba(0,0,0,0.5)',
    overflow:        'hidden',
  }
  if (hidden || !card) {
    return (
      <div style={CARD}>
        <svg viewBox="0 0 44 62" style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.3 }}>
          <rect x="3" y="3" width="38" height="56" fill="none" stroke="#B8860B" strokeWidth="1"/>
          <circle cx="22" cy="31" r="8" fill="none" stroke="#B8860B" strokeWidth="0.7"/>
          <line x1="22" y1="3" x2="22" y2="59" stroke="#B8860B" strokeWidth="0.4"/>
          <line x1="3" y1="31" x2="41" y2="31" stroke="#B8860B" strokeWidth="0.4"/>
        </svg>
      </div>
    )
  }
  const isRed  = card.color === 'R'
  const suit   = card.suite === 'hearts' ? '♥' : card.suite === 'diamonds' ? '♦' : card.suite === 'clubs' ? '♣' : '♠'
  const clr    = isRed ? '#C0392B' : '#1A1A2E'
  const label  = card.text === '1' ? 'A' : card.text

  return (
    <div style={CARD}>
      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, color:clr, lineHeight:1 }}>{label}</span>
      <span style={{ fontFamily:"Georgia,serif", fontSize:13, color:clr, lineHeight:1 }}>{suit}</span>
      <span style={{ position:'absolute', bottom:3, right:4, fontFamily:"Georgia,serif", fontSize:13, color:clr, transform:'rotate(180deg)', lineHeight:1 }}>{suit}</span>
    </div>
  )
}

function HandValue({ val, blackjack, busted }: { val?: { hi:number; lo:number }; blackjack?: boolean; busted?: boolean }) {
  if (!val) return null
  const display = blackjack ? 'BJ' : busted ? 'BUST' : val.hi <= 21 ? String(val.hi) : val.hi !== val.lo ? String(val.lo) : String(val.hi)
  const color   = busted ? 'rgba(200,50,50,0.9)' : blackjack ? '#FFD700' : 'rgba(245,241,232,0.7)'
  return (
    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color, letterSpacing:'0.08em' }}>
      {display}
    </span>
  )
}

// ─── Coin component ─────────────────────────────────────────────────────────────
function CoinEl({ coin, onDown }: {
  coin:    Coin
  onDown:  (e: React.MouseEvent | React.TouchEvent, id: string) => void
}) {
  const gold = coin.type === 'gold'
  return (
    <div
      onMouseDown={coin.locked ? undefined : e => onDown(e, coin.id)}
      onTouchStart={coin.locked ? undefined : e => onDown(e, coin.id)}
      style={{
        position:     'absolute',
        left:         coin.x - CR,
        top:          coin.y - CR,
        width:        CD,
        height:       CD,
        borderRadius: '50%',
        background:   gold
          ? 'radial-gradient(circle at 38% 35%, #FFD700, #B8860B 65%, #7A5C00)'
          : 'radial-gradient(circle at 38% 35%, #D4956A, #8B4513 65%, #4A2400)',
        border:       `1.5px solid ${gold ? 'rgba(255,215,0,0.55)' : 'rgba(205,133,63,0.55)'}`,
        boxShadow:    '0 2px 4px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
        cursor:       coin.locked ? 'default' : 'grab',
        touchAction:  'none',
        userSelect:   'none',
        zIndex:       4,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
      }}
    >
      <span style={{
        fontFamily:  "'IBM Plex Mono',monospace",
        fontSize:     6,
        fontWeight:   700,
        color:        gold ? 'rgba(11,8,32,0.65)' : 'rgba(245,241,232,0.55)',
        letterSpacing: 0,
        lineHeight:    1,
        pointerEvents: 'none',
      }}>
        {gold ? '◆' : '●'}
      </span>
    </div>
  )
}

// ─── Drag ghost ─────────────────────────────────────────────────────────────────
function DragGhost({ coin, x, y }: { coin: Coin; x: number; y: number }) {
  const gold = coin.type === 'gold'
  return (
    <div style={{
      position:     'absolute',
      left:         x - CR,
      top:          y - CR,
      width:        CD,
      height:       CD,
      borderRadius: '50%',
      background:   gold
        ? 'radial-gradient(circle at 38% 35%, #FFD700, #B8860B 65%, #7A5C00)'
        : 'radial-gradient(circle at 38% 35%, #D4956A, #8B4513 65%, #4A2400)',
      border:       `1.5px solid ${gold ? 'rgba(255,215,0,0.55)' : 'rgba(205,133,63,0.55)'}`,
      boxShadow:    '0 4px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18)',
      opacity:      0.9,
      zIndex:       100,
      cursor:       'grabbing',
      pointerEvents: 'none',
    }} />
  )
}

// ─── Action button ─────────────────────────────────────────────────────────────
function ActBtn({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily:    "'IBM Plex Mono',monospace",
        fontSize:      9,
        fontWeight:    700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.12em',
        color:         disabled ? 'rgba(245,241,232,0.20)' : 'rgba(245,241,232,0.70)',
        background:    'transparent',
        border:        `1px solid ${disabled ? 'rgba(184,134,11,0.08)' : 'rgba(184,134,11,0.25)'}`,
        padding:       '7px 10px',
        cursor:        disabled ? 'default' : 'pointer',
        transition:    'border-color 0.15s, color 0.15s',
        flexShrink:    0,
      }}
    >
      {label}
    </button>
  )
}

// ─── Section label ─────────────────────────────────────────────────────────────
const SECT_LABEL: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono',monospace",
  fontSize:      8,
  fontWeight:    700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.18em',
  color:         'rgba(184,134,11,0.55)',
}

const DIVIDER: React.CSSProperties = {
  borderBottom: '1px solid rgba(184,134,11,0.10)',
  margin:       '0',
}

// ─── Main component ─────────────────────────────────────────────────────────────
export function BlackjackModule() {
  const gameRef   = useRef<any>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const dragRef   = useRef<{ coinId: string; ox: number; oy: number } | null>(null)

  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const [drag, setDrag] = useState<{ coinId: string; x: number; y: number } | null>(null)
  const dragStateRef = useRef(drag)
  useEffect(() => { dragStateRef.current = drag }, [drag])

  // ── Content-area coordinate conversion ──────────────────────────────────────
  function toContent(px: number, py: number): { x: number; y: number } {
    const r = contentRef.current?.getBoundingClientRect()
    if (!r) return { x: px, y: py }
    return { x: px - r.left, y: py - r.top }
  }

  function dropTarget(x: number, y: number): Coin['container'] {
    if (inBox(x, y, WB)) return 'wager'
    if (stateRef.current.showSplit && inBox(x, y, SB)) return 'split'
    if (stateRef.current.showIns   && inBox(x, y, IB)) return 'insurance'
    return 'player'
  }

  // ── Mouse drag ───────────────────────────────────────────────────────────────
  const handleCoinDown = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const coin = stateRef.current.coins.find(c => c.id === id)
    if (!coin || coin.locked) return

    const { clientX, clientY } = 'touches' in e ? e.touches[0] : e
    const pos = toContent(clientX, clientY)
    dragRef.current = { coinId: id, ox: coin.x - pos.x, oy: coin.y - pos.y }
    setDrag({ coinId: id, x: coin.x, y: coin.y })
  }, [])

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return
      const pos = toContent(e.clientX, e.clientY)
      setDrag({ coinId: dragRef.current.coinId, x: pos.x + dragRef.current.ox, y: pos.y + dragRef.current.oy })
    }
    function onUp(e: MouseEvent) {
      if (!dragRef.current) return
      const pos   = toContent(e.clientX, e.clientY)
      const cx    = pos.x + dragRef.current.ox
      const cy    = pos.y + dragRef.current.oy
      const target = dropTarget(cx, cy)
      const box    = target === 'wager' ? WB : target === 'split' ? SB : target === 'insurance' ? IB : PB
      const fx     = clamp(cx, box.x + CR, box.x + box.w - CR)
      const fy     = clamp(cy, box.y + CR, box.y + box.h - CR)

      if (target === 'player') {
        dispatch({ type: 'BOUNCE', id: dragRef.current.coinId })
      } else {
        dispatch({ type: 'DROP', id: dragRef.current.coinId, container: target, x: fx, y: fy })
      }
      dragRef.current = null
      setDrag(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [])

  // ── Touch drag (non-passive to block scroll) ────────────────────────────────
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    function onTouchMove(e: TouchEvent) {
      if (!dragRef.current) return
      e.preventDefault()
      const t   = e.touches[0]
      const pos = toContent(t.clientX, t.clientY)
      setDrag({ coinId: dragRef.current.coinId, x: pos.x + dragRef.current.ox, y: pos.y + dragRef.current.oy })
    }
    function onTouchEnd(e: TouchEvent) {
      if (!dragRef.current) return
      const t    = e.changedTouches[0]
      const pos  = toContent(t.clientX, t.clientY)
      const cx   = pos.x + dragRef.current.ox
      const cy   = pos.y + dragRef.current.oy
      const target = dropTarget(cx, cy)
      const box    = target === 'wager' ? WB : target === 'split' ? SB : target === 'insurance' ? IB : PB
      const fx     = clamp(cx, box.x + CR, box.x + box.w - CR)
      const fy     = clamp(cy, box.y + CR, box.y + box.h - CR)

      if (target === 'player') {
        dispatch({ type: 'BOUNCE', id: dragRef.current.coinId })
      } else {
        dispatch({ type: 'DROP', id: dragRef.current.coinId, container: target, x: fx, y: fy })
      }
      dragRef.current = null
      setDrag(null)
    }

    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend',  onTouchEnd,  { passive: false })
    return () => {
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend',  onTouchEnd)
    }
  }, [])

  // ── Engine action helpers ────────────────────────────────────────────────────
  function syncEng(overrides?: Partial<S>) {
    dispatch({ type: 'SYNC', eng: gameRef.current.getState(), overrides })
  }

  function handleDeal() {
    const bet = sumCoins(coinsIn(state.coins, 'wager'))
    if (bet === 0) return
    gameRef.current = new bjLib.Game()
    gameRef.current.dispatch(bjActions.deal({ bet }))
    syncEng()
  }

  function handleHit(pos = 'right') {
    gameRef.current.dispatch(bjActions.hit({ position: pos }))
    syncEng()
  }

  function handleStand(pos = 'right') {
    gameRef.current.dispatch(bjActions.stand({ position: pos }))
    syncEng()
  }

  function handleDouble(pos = 'right') {
    gameRef.current.dispatch(bjActions.double({ position: pos }))
    syncEng()
  }

  function handleSplit() {
    gameRef.current.dispatch(bjActions.split())
    syncEng()
  }

  function handleSurrender() {
    gameRef.current.dispatch(bjActions.surrender())
    syncEng()
  }

  function handleInsuranceYes() {
    const half = Math.floor(state.initialBet / 2)
    if (half === 0) { handleInsuranceNo(); return }
    // Auto-place insurance coins (invisible dealer)
    const specs = valueToCoins(half)
    const insCoins = scatter(specs, IB, 'insurance').map(c => ({ ...c, locked: true }))
    const nextCoins = [...coinsIn(state.coins, 'player'), ...coinsIn(state.coins, 'wager'), ...insCoins]
    gameRef.current.dispatch(bjActions.insurance({ bet: half }))
    dispatch({ type: 'SYNC', eng: gameRef.current.getState(), overrides: { coins: nextCoins, showIns: false, prompt: null } })
  }

  function handleInsuranceNo() {
    gameRef.current.dispatch(bjActions.insurance({ bet: 0 }))
    syncEng()
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const isReady        = state.stage === 'ready'
  const isDone         = state.stage === 'done'
  const isPlayerRight  = state.stage === 'player-turn-right'
  const isPlayerLeft   = state.stage === 'player-turn-left'
  const isPlaying      = isPlayerRight || isPlayerLeft

  const wagerCoins     = coinsIn(state.coins, 'wager')
  const splitCoins     = coinsIn(state.coins, 'split')
  const wagerVal       = sumCoins(wagerCoins)
  const splitVal       = sumCoins(splitCoins)
  const playerCoinsArr = coinsIn(state.coins, 'player')

  const avR = state.handRight?.availableActions ?? {}
  const avL = state.handLeft?.availableActions  ?? {}

  // Current hand for odds (right unless on left turn)
  const activeHand  = isPlayerLeft ? state.handLeft  : state.handRight
  const activeCards = activeHand?.cards ?? []

  // Split button enabled when splitVal === initialBet
  const splitReady   = avR.split && splitVal === state.initialBet
  const doubleReady  = isPlayerRight
    ? avR.double && wagerVal >= state.initialBet * 2
    : avL.double && wagerVal >= state.initialBet * 2

  // Dealer visible card for odds
  const dealerUp     = state.dealerCards?.[0]
  const dealerBustPct = dealerUp ? (DEALER_BUST[dealerUp.value] ?? 0) : 0

  // Bust probability
  const deck          = gameRef.current?.getState()?.deck ?? []
  const bustPct       = (isPlaying && state.showOdds && activeCards.length > 0)
    ? bustProb(activeCards, deck)
    : null

  // Double-down wager hint
  const needForDouble = isPlaying && avR.double && wagerVal < state.initialBet * 2
    ? state.initialBet * 2 - wagerVal : 0

  return (
    <div
      ref={contentRef}
      style={{ position: 'relative', width: '100%', height: '100%', background: '#1A1A2E', overflow: 'hidden', userSelect: 'none' }}
    >

      {/* ── Dealer zone ── */}
      <div style={{ padding: '14px 16px 10px', minHeight: 148 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={SECT_LABEL}>Dealer</span>
          {state.dealerCards.length > 0 && (
            <HandValue
              val={state.dealerValue ?? undefined}
              blackjack={state.dealerHasBlackjack}
              busted={state.dealerHasBusted}
            />
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', minHeight: 62 }}>
          {state.dealerCards.length === 0 && (
            <>
              <PlayingCard hidden />
              <PlayingCard hidden />
            </>
          )}
          {state.dealerCards.map((c, i) => (
            <PlayingCard key={i} card={c} />
          ))}
          {/* Hole card — only hidden during player turn */}
          {(isPlayerRight || isPlayerLeft) && state.dealerHoleCard && (
            <PlayingCard hidden />
          )}
          {/* Odds overlay on dealer up-card */}
          {state.showOdds && dealerUp && isPlaying && (
            <div style={{
              marginLeft: 8,
              alignSelf: 'center',
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 9,
              color: 'rgba(184,134,11,0.80)',
              letterSpacing: '0.08em',
              lineHeight: 1.6,
            }}>
              <div>DEALER BUST</div>
              <div style={{ fontSize: 13, color: '#B8860B' }}>{dealerBustPct.toFixed(1)}%</div>
            </div>
          )}
        </div>
      </div>

      <div style={DIVIDER} />

      {/* ── Player zone ── */}
      <div style={{ padding: '10px 16px', minHeight: 148 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={SECT_LABEL}>Player</span>
          {state.handRight?.playerValue && (
            <HandValue
              val={state.handRight.playerValue}
              blackjack={state.handRight.playerHasBlackjack}
              busted={state.handRight.playerHasBusted}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, minHeight: 62 }}>
          {/* Right (main) hand */}
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
              {(isReady && !isDone) && (
                <>
                  <PlayingCard hidden />
                  <PlayingCard hidden />
                </>
              )}
              {(state.handRight?.cards ?? []).map((c: EngCard, i: number) => (
                <PlayingCard key={i} card={c} />
              ))}
            </div>
            {bustPct !== null && !isPlayerLeft && (
              <div style={{ marginTop: 4, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(184,134,11,0.75)', letterSpacing: '0.08em' }}>
                BUST RISK {bustPct}%
              </div>
            )}
          </div>

          {/* Left (split) hand */}
          {state.showSplit && (state.handLeft?.cards?.length > 0) && (
            <div style={{ borderLeft: '1px solid rgba(184,134,11,0.15)', paddingLeft: 16 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {(state.handLeft.cards ?? []).map((c: EngCard, i: number) => (
                  <PlayingCard key={i} card={c} />
                ))}
              </div>
              {state.handLeft?.playerValue && (
                <div style={{ marginTop: 4 }}>
                  <HandValue
                    val={state.handLeft.playerValue}
                    blackjack={state.handLeft.playerHasBlackjack}
                    busted={state.handLeft.playerHasBusted}
                  />
                </div>
              )}
              {bustPct !== null && isPlayerLeft && (
                <div style={{ marginTop: 4, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(184,134,11,0.75)', letterSpacing: '0.08em' }}>
                  BUST RISK {bustPct}%
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={DIVIDER} />

      {/* ── Betting zone ── */}
      <div style={{ position: 'relative', height: 148 }}>
        {/* Labels */}
        <span style={{ ...SECT_LABEL, position: 'absolute', top: 8, left: PB.x }}>
          Coins
        </span>
        <span style={{ ...SECT_LABEL, position: 'absolute', top: 8, left: WB.x }}>
          Wager
        </span>
        {state.showSplit && (
          <span style={{ ...SECT_LABEL, position: 'absolute', top: 8, left: SB.x }}>
            Split
          </span>
        )}
        {state.showIns && (
          <span style={{ ...SECT_LABEL, position: 'absolute', top: 8, left: IB.x }}>
            Insurance
          </span>
        )}

        {/* Player coin box */}
        <div style={{
          position:   'absolute',
          left:        PB.x,
          top:         PB.y - (state.stage === 'ready' || isDone ? 318 : 318) + 318,
          width:       PB.w,
          height:      PB.h,
          border:      '1px solid rgba(184,134,11,0.18)',
          background:  'rgba(11,8,32,0.35)',
        }} />

        {/* Wager box */}
        <div style={{
          position:   'absolute',
          left:        WB.x,
          top:         WB.y - 318 + 318,
          width:       WB.w,
          height:      WB.h,
          border:      `1px solid rgba(184,134,11,${wagerCoins.length > 0 ? '0.45' : '0.22'})`,
          background:  'rgba(11,8,32,0.45)',
          boxShadow:   wagerCoins.length > 0 ? '0 0 8px rgba(184,134,11,0.12)' : 'none',
          transition:  'border-color 0.2s, box-shadow 0.2s',
        }} />

        {/* Split wager box — materializes */}
        {state.showSplit && (
          <div style={{
            position:   'absolute',
            left:        SB.x,
            top:         SB.y - 318 + 318,
            width:       SB.w,
            height:      SB.h,
            border:      `1px solid rgba(184,134,11,${splitCoins.length > 0 ? '0.45' : '0.22'})`,
            background:  'rgba(11,8,32,0.45)',
            animation:   'bj-fade-in 0.3s ease',
          }} />
        )}

        {/* Insurance box — materializes */}
        {state.showIns && (
          <div style={{
            position:   'absolute',
            left:        IB.x,
            top:         IB.y - 318 + 318,
            width:       IB.w,
            height:      IB.h,
            border:      '1px solid rgba(184,134,11,0.35)',
            background:  'rgba(11,8,32,0.45)',
            animation:   'bj-fade-in 0.3s ease',
          }} />
        )}

        {/* Double hint */}
        {needForDouble > 0 && (
          <div style={{
            position:    'absolute',
            left:         WB.x,
            top:          WB.y - 318 + 318 + WB.h + 4,
            fontFamily:  "'IBM Plex Mono',monospace",
            fontSize:     8,
            color:        'rgba(184,134,11,0.55)',
            letterSpacing: '0.08em',
          }}>
            +{needForDouble} to double
          </div>
        )}

        {/* Coins rendered absolutely in content area */}
        {state.coins
          .filter(c => !drag || c.id !== drag.coinId)
          .map(coin => (
            <CoinEl key={coin.id} coin={coin} onDown={handleCoinDown} />
          ))
        }
      </div>

      <div style={DIVIDER} />

      {/* ── Dialogue zone ── */}
      <div style={{ padding: '10px 16px', height: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        <p style={{
          fontFamily:   "'Cormorant Garamond',serif",
          fontStyle:    'italic',
          fontSize:     13,
          color:        'rgba(245,241,232,0.75)',
          margin:       0,
          lineHeight:   1.4,
          letterSpacing: '0.02em',
        }}>
          {state.dialogue}
        </p>

        {/* Yes / No prompts */}
        {state.prompt && !state.gameOver && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={state.prompt === 'more-coins' ? () => dispatch({ type: 'MORE_COINS_YES' }) : () => dispatch({ type: 'ODDS_YES' })}
              style={YES_BTN}
            >
              Yes
            </button>
            <button
              onClick={state.prompt === 'more-coins' ? () => dispatch({ type: 'MORE_COINS_NO' }) : () => dispatch({ type: 'ODDS_NO' })}
              style={NO_BTN}
            >
              No
            </button>
          </div>
        )}
      </div>

      <div style={DIVIDER} />

      {/* ── Action buttons ── */}
      <div style={{ padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <ActBtn label="Hit"       onClick={() => handleHit(isPlayerLeft ? 'left' : 'right')}   disabled={!isPlaying || (isPlayerRight ? !avR.hit  : !avL.hit)}  />
        <ActBtn label="Stand"     onClick={() => handleStand(isPlayerLeft ? 'left' : 'right')} disabled={!isPlaying || (isPlayerRight ? !avR.stand : !avL.stand)} />
        <ActBtn label="Double"    onClick={() => handleDouble(isPlayerLeft ? 'left' : 'right')} disabled={!isPlaying || !doubleReady} />
        <ActBtn label="Split"     onClick={handleSplit}    disabled={!isPlayerRight || !splitReady} />
        <ActBtn label="Insurance" onClick={handleInsuranceYes} disabled={!state.showIns || !isPlayerRight} />
        <ActBtn label="Surrender" onClick={handleSurrender} disabled={!isPlayerRight || !avR.surrender} />
      </div>

      <div style={DIVIDER} />

      {/* ── Bottom bar ── */}
      <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Deal / Reset */}
        {state.gameOver ? (
          <button onClick={() => dispatch({ type: 'RESET' })} style={DEAL_BTN}>
            Reset
          </button>
        ) : isDone || isReady ? (
          <button
            onClick={handleDeal}
            disabled={wagerVal === 0 || !!state.prompt}
            style={{ ...DEAL_BTN, opacity: (wagerVal === 0 || !!state.prompt) ? 0.35 : 1 }}
          >
            Deal
          </button>
        ) : (
          <div style={{ width: 60 }} />
        )}

        {/* Karma debt */}
        <div style={{ textAlign: 'right' }}>
          <span style={{ ...SECT_LABEL, display: 'block', marginBottom: 2 }}>Karma Debt</span>
          <span style={{
            fontFamily:    "'IBM Plex Mono',monospace",
            fontSize:       11,
            color:          state.karmaDebt > 0 ? 'rgba(200,80,80,0.85)' : 'rgba(245,241,232,0.30)',
            letterSpacing: '0.08em',
          }}>
            {state.karmaDebt > 0 ? `${state.karmaDebt} pts` : '—'}
          </span>
        </div>
      </div>

      {/* Drag ghost renders on top of everything */}
      {drag && (() => {
        const coin = state.coins.find(c => c.id === drag.coinId)
        return coin ? <DragGhost coin={coin} x={drag.x} y={drag.y} /> : null
      })()}

      <style>{`
        @keyframes bj-fade-in { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </div>
  )
}

// ─── Button styles ─────────────────────────────────────────────────────────────
const DEAL_BTN: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono',monospace",
  fontSize:       10,
  fontWeight:     700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color:          '#0B0820',
  background:     '#B8860B',
  border:         'none',
  padding:        '9px 18px',
  cursor:         'pointer',
}

const YES_BTN: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono',monospace",
  fontSize:       9,
  fontWeight:     700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.12em',
  color:          '#0B0820',
  background:     '#B8860B',
  border:         'none',
  padding:        '5px 14px',
  cursor:         'pointer',
}

const NO_BTN: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono',monospace",
  fontSize:       9,
  fontWeight:     700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.12em',
  color:          'rgba(245,241,232,0.50)',
  background:     'transparent',
  border:         '1px solid rgba(184,134,11,0.25)',
  padding:        '5px 14px',
  cursor:         'pointer',
}
