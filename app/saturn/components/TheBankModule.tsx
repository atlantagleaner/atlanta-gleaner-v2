'use client'

import { useReducer, useRef, useEffect, useCallback, useState } from 'react'
import styles from './blackjack.module.css'

// ─── Engine (CJS) ──────────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-var-requires */
let bjLib: any
let bjActions: any
let bjEngine: any
try {
  bjLib = require('engine-blackjack')
  bjActions = bjLib?.actions
  bjEngine = bjLib?.engine
  if (!bjLib || !bjActions || !bjEngine) {
    console.warn('BlackjackModule2: engine-blackjack library incomplete', { bjLib, bjActions, bjEngine })
  }
} catch (e) {
  console.error('BlackjackModule2: Failed to load engine-blackjack', e)
}
/* eslint-enable */

// ─── Constants ─────────────────────────────────────────────────────────────────
const GOLD = 2
const BRONZE = 1
const KARMA_LIMIT = 8
const CR = 13 // coin radius
const CD = CR * 2

// Dealer bust % by up-card value (standard infinite-deck table)
const DEALER_BUST: Record<number, number> = {
  1: 11.7, 2: 35.4, 3: 37.6, 4: 40.3, 5: 42.9,
  6: 42.1, 7: 25.9, 8: 23.9, 9: 23.3, 10: 21.4,
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface EngCard {
  text: string
  suite: string
  value: number
  color: string
}

interface Coin {
  id: string
  type: 'gold' | 'bronze'
  value: number
  gridIndex: number
  container: 'player' | 'wager' | 'split' | 'insurance'
  locked: boolean
  returning?: boolean
}

type Prompt = 'more-coins' | 'odds' | null

interface S {
  stage: string
  dealerCards: EngCard[]
  dealerHoleCard: EngCard | null
  dealerValue: { hi: number; lo: number } | null
  dealerHasBlackjack: boolean
  dealerHasBusted: boolean
  handRight: any
  handLeft: any
  wonOnRight: number
  wonOnLeft: number
  initialBet: number
  sideBetsInfo: any
  coins: Coin[]
  boxDims: { player: { width: number; height: number }; wager: { width: number; height: number } }
  karmaDebt: number
  showOdds: boolean
  dialogue: string
  prompt: Prompt
  gameOver: boolean
  showSplit: boolean
  showIns: boolean
}

type A =
  | { type: 'SYNC'; eng: any; overrides?: Partial<S> }
  | { type: 'DROP'; id: string; container: Coin['container']; gridIndex: number }
  | { type: 'BOUNCE'; id: string; playerDims: { width: number; height: number } }
  | { type: 'SET_BOX_DIMS'; dims: { player: { width: number; height: number }; wager: { width: number; height: number } } }
  | { type: 'SET_COINS'; coins: Coin[] }
  | { type: 'MORE_COINS_YES' }
  | { type: 'MORE_COINS_NO' }
  | { type: 'ODDS_YES' }
  | { type: 'ODDS_NO' }
  | { type: 'RESET' }
  | { type: 'FORGIVE_KARMA' }
  | { type: 'CLEAR_RETURNING' }

// ─── Helpers ───────────────────────────────────────────────────────────────────
let _cid = 0
function uid() { return `c${++_cid}_${Date.now()}` }

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function valueToCoins(pts: number): Array<{ type: 'gold' | 'bronze'; value: number }> {
  const result: Array<{ type: 'gold' | 'bronze'; value: number }> = []
  let rem = Math.floor(pts)
  while (rem >= GOLD) { result.push({ type: 'gold', value: GOLD }); rem -= GOLD }
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
    const val = bjEngine.calculate(next)
    return val && bjEngine.checkForBusted(val)
  })
  return Math.round((bust.length / deck.length) * 100)
}

// Grid-based coin scatter (stable, no random positioning)
function scatter(
  specs: Array<{ type: 'gold' | 'bronze'; value: number }>,
  container: 'player' | 'wager' | 'split' | 'insurance'
): Coin[] {
  return specs.map((s, idx) => ({
    id: uid(),
    type: s.type,
    value: s.value,
    gridIndex: idx,
    container,
    locked: false,
  }))
}

// ─── Initial state ─────────────────────────────────────────────────────────────
function initState(): S {
  const specs = [
    ...Array(4).fill({ type: 'gold' as const, value: GOLD }),
    ...Array(2).fill({ type: 'bronze' as const, value: BRONZE }),
  ]
  const defaultDims = { player: { width: 160, height: 80 }, wager: { width: 160, height: 80 } }
  return {
    stage: 'ready',
    dealerCards: [],
    dealerHoleCard: null,
    dealerValue: null,
    dealerHasBlackjack: false,
    dealerHasBusted: false,
    handRight: {},
    handLeft: {},
    wonOnRight: 0,
    wonOnLeft: 0,
    initialBet: 0,
    sideBetsInfo: {},
    coins: scatter(specs, 'player'),
    boxDims: defaultDims,
    karmaDebt: 0,
    showOdds: false,
    dialogue: 'Looks like someone left their coins behind...',
    prompt: null,
    gameOver: false,
    showSplit: false,
    showIns: false,
  }
}

// ─── Reducer (pure, stable) ────────────────────────────────────────────────────
function reducer(state: S, action: A): S {
  switch (action.type) {
    case 'SYNC': {
      const e = action.eng
      const stage = e.stage ?? 'ready'
      const hRight = e.handInfo?.right ?? {}
      const hLeft = e.handInfo?.left ?? {}
      let coins = state.coins
      let dlg = state.dialogue
      let prompt = state.prompt
      let showSplit = state.showSplit
      let showIns = state.showIns
      let gameOver = state.gameOver

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
        const insWin = e.sideBetsInfo?.insurance?.win ?? 0
        const totalWon = (e.wonOnRight ?? 0) + (e.wonOnLeft ?? 0) + insWin

        coins = coinsIn(state.coins, 'player')
        if (totalWon > 0) {
          coins = [...coins, ...scatter(valueToCoins(totalWon), 'player')]
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
        showIns = false
        prompt = null

        const total = sumCoins(coins)
        if (total === 0) {
          prompt = 'more-coins'
          dlg = 'More coins?'
        }
      }

      return {
        ...state,
        stage,
        dealerCards: e.dealerCards ?? [],
        dealerHoleCard: e.dealerHoleCard ?? null,
        dealerValue: e.dealerValue ?? null,
        dealerHasBlackjack: e.dealerHasBlackjack ?? false,
        dealerHasBusted: e.dealerHasBusted ?? false,
        handRight: hRight,
        handLeft: hLeft,
        wonOnRight: e.wonOnRight ?? 0,
        wonOnLeft: e.wonOnLeft ?? 0,
        initialBet: e.initialBet ?? state.initialBet,
        sideBetsInfo: e.sideBetsInfo ?? {},
        coins,
        dialogue: dlg,
        prompt,
        showSplit,
        showIns,
        gameOver,
        ...(action.overrides ?? {}),
      }
    }

    case 'DROP': {
      const { id, container, gridIndex } = action
      const validGridIndex = Math.max(0, gridIndex)
      return {
        ...state,
        coins: state.coins.map(c =>
          c.id === id
            ? { ...c, container, gridIndex: validGridIndex, locked: container !== 'player' }
            : c
        ),
      }
    }

    case 'SET_BOX_DIMS': {
      return { ...state, boxDims: action.dims }
    }

    case 'SET_COINS': {
      return { ...state, coins: action.coins }
    }

    case 'BOUNCE': {
      const playerCoins = coinsIn(state.coins, 'player')
      const maxIndex = playerCoins.reduce((max, c) => Math.max(max, c.gridIndex), -1)
      const newGridIndex = Math.max(0, maxIndex + 1)
      const playerBoxWidth = action.playerDims?.width ?? state.boxDims.player.width
      const coinsPerRow = Math.max(1, Math.floor(playerBoxWidth / (CD + 6)))
      const gridIndexClamped = Math.min(newGridIndex, coinsPerRow - 1)
      return {
        ...state,
        coins: state.coins.map(c =>
          c.id === action.id ? { ...c, container: 'player', gridIndex: gridIndexClamped, locked: false, returning: true } : c
        ),
      }
    }

    case 'MORE_COINS_YES': {
      const specs = [
        ...Array(4).fill({ type: 'gold' as const, value: GOLD }),
        ...Array(2).fill({ type: 'bronze' as const, value: BRONZE }),
      ]
      const added = 4 * GOLD + 2 * BRONZE
      const newDebt = state.karmaDebt + added
      const trigOdds = !state.showOdds && newDebt >= KARMA_LIMIT
      const newCoins = scatter(specs, 'player').map(c => ({ ...c, returning: true }))
      return {
        ...state,
        coins: [...coinsIn(state.coins, 'player'), ...newCoins],
        karmaDebt: newDebt,
        stage: 'ready',
        prompt: trigOdds ? 'odds' : null,
        dialogue: trigOdds ? 'I can show you the odds...' : 'Four more. The ledger grows.',
      }
    }

    case 'MORE_COINS_NO':
      return { ...state, gameOver: true, prompt: null, dialogue: 'Your debt is recorded. Until next time.' }

    case 'ODDS_YES':
      return { ...state, showOdds: true, prompt: null, dialogue: 'Fair warning — I am both the dealer and the bank....' }

    case 'ODDS_NO':
      return { ...state, prompt: null, dialogue: 'As you wish.' }

    case 'FORGIVE_KARMA':
      return { ...state, karmaDebt: 0 }

    case 'CLEAR_RETURNING':
      return { ...state, coins: state.coins.map(c => ({ ...c, returning: false })) }

    case 'RESET':
      return initState()

    default:
      return state
  }
}

// ─── Card Component (stable rendering) ───────────────────────────────────────
function PlayingCard({ card, hidden = false }: { card?: EngCard; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <div className={`${styles['bj-card']} ${styles['hidden']}`}>
        <svg viewBox="0 0 44 62" className={styles['bj-card-back-svg']}>
          <rect x="2" y="2" width="40" height="58" fill="none" stroke="#B8860B" strokeWidth="0.8" />
          <rect x="4" y="4" width="36" height="54" fill="none" stroke="#B8860B" strokeWidth="0.5" opacity="0.6" />
          <circle cx="22" cy="31" r="10" fill="none" stroke="#B8860B" strokeWidth="0.7" opacity="0.7" />
          <circle cx="22" cy="31" r="6" fill="none" stroke="#B8860B" strokeWidth="0.5" opacity="0.5" />
          <line x1="22" y1="20" x2="22" y2="42" stroke="#B8860B" strokeWidth="0.4" opacity="0.5" />
          <line x1="11" y1="31" x2="33" y2="31" stroke="#B8860B" strokeWidth="0.4" opacity="0.5" />
        </svg>
      </div>
    )
  }

  // Fallback for missing card data
  const cardText = card.text || '?'
  const cardSuite = card.suite || '?'
  const cardColor = card.color || '#B8860B'

  return (
    <div className={styles['bj-card']}>
      <div style={{
        position: 'absolute',
        top: '2px',
        left: '2px',
        fontSize: 'clamp(6px, 0.8vw, 10px)',
        fontWeight: 700,
        color: cardColor,
        lineHeight: 1,
        opacity: 0.9,
      }}>
        {cardText}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <div className={styles['bj-card-text']} style={{ color: cardColor }}>
          {cardText}
        </div>
        <div className={styles['bj-card-suite']} style={{ color: cardColor }}>
          {cardSuite}
        </div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: '2px',
        right: '2px',
        fontSize: 'clamp(6px, 0.8vw, 10px)',
        fontWeight: 700,
        color: cardColor,
        lineHeight: 1,
        opacity: 0.9,
        transform: 'rotate(180deg)',
      }}>
        {cardText}
      </div>
    </div>
  )
}

// ─── Hand Value Display ────────────────────────────────────────────────────────
function HandValue({ val, blackjack, busted }: { val?: { hi: number; lo: number }; blackjack?: boolean; busted?: boolean }) {
  const v = blackjack ? 'BJ' : busted ? 'BUST' : val?.hi ?? val?.lo ?? '?'
  return (
    <div className={`${styles['bj-hand-value']} ${blackjack ? styles['blackjack'] : ''} ${busted ? styles['busted'] : ''}`}>
      {v}
    </div>
  )
}

// ─── Button Component ──────────────────────────────────────────────────────────
function ActBtn({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${styles['bj-btn']} ${disabled ? styles['disabled'] : ''}`}
    >
      {label}
    </button>
  )
}

// ─── Main Stable Component ─────────────────────────────────────────────────────
export function TheBankModule() {
  const [state, dispatch] = useReducer(reducer, initState())
  const [drag, setDrag] = useState<{ coinId: string; x: number; y: number } | null>(null)

  const contentRef = useRef<HTMLDivElement>(null)
  const playerBoxRef = useRef<HTMLDivElement>(null)
  const wagerBoxRef = useRef<HTMLDivElement>(null)
  const splitBoxRef = useRef<HTMLDivElement>(null)
  const insuranceBoxRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(null)
  const dragRef = useRef<{ coinId: string; ox: number; oy: number } | null>(null)

  // Measure boxes once on mount + resize (debounced for stability)
  useEffect(() => {
    let rafId: number
    function measureBoxes() {
      if (playerBoxRef.current && wagerBoxRef.current) {
        dispatch({
          type: 'SET_BOX_DIMS',
          dims: {
            player: {
              width: playerBoxRef.current!.offsetWidth,
              height: playerBoxRef.current!.offsetHeight,
            },
            wager: {
              width: wagerBoxRef.current!.offsetWidth,
              height: wagerBoxRef.current!.offsetHeight,
            },
          },
        })
      }
    }

    const debouncedMeasure = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(measureBoxes)
    }

    measureBoxes()
    const resizeTimer = setTimeout(measureBoxes, 300)
    window.addEventListener('resize', debouncedMeasure)

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', debouncedMeasure)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // Auto-clear returning animation flag
  useEffect(() => {
    if (!state.coins.some(c => c.returning)) return
    const timer = setTimeout(() => dispatch({ type: 'CLEAR_RETURNING' }), 600)
    return () => clearTimeout(timer)
  }, [state.coins])

  // ─── Drop target validation (pixel-perfect, stable) ───────────────────────
  const dropTarget = useCallback((x: number, y: number): Coin['container'] | null => {
    const contentRect = contentRef.current?.getBoundingClientRect()
    if (!contentRect) return null

    const checkBox = (ref: React.RefObject<HTMLDivElement>, container: Coin['container']) => {
      if (!ref.current) return false
      const rect = ref.current.getBoundingClientRect()
      const relX = x - (rect.left - contentRect.left)
      const relY = y - (rect.top - contentRect.top)
      return relX >= 0 && relX <= rect.width && relY >= 0 && relY <= rect.height
    }

    if (checkBox(playerBoxRef, 'player')) return 'player'
    if (checkBox(wagerBoxRef, 'wager')) return 'wager'
    if (state.showSplit && checkBox(splitBoxRef, 'split')) return 'split'
    if (state.showIns && checkBox(insuranceBoxRef, 'insurance')) return 'insurance'

    return null
  }, [state.showSplit, state.showIns])

  const toContent = useCallback((clientX: number, clientY: number) => {
    if (!contentRef.current) return { x: 0, y: 0 }
    const rect = contentRef.current.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  // ─── Coin drag handlers (mouse + touch, memory-leak free) ─────────────────
  const handleCoinDown = useCallback((e: React.MouseEvent | React.TouchEvent, coinId: string) => {
    if (e.type === 'mousedown' && (e as React.MouseEvent).button !== 0) return

    const coin = state.coins.find(c => c.id === coinId)
    if (!coin || coin.locked) return

    const clientX = e.type === 'touchstart' ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = e.type === 'touchstart' ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY
    const mousePos = toContent(clientX, clientY)

    // Calculate coin absolute position from grid
    let boxRect: DOMRect | null = null
    if (coin.container === 'player') boxRect = playerBoxRef.current?.getBoundingClientRect() ?? null
    else if (coin.container === 'wager') boxRect = wagerBoxRef.current?.getBoundingClientRect() ?? null
    else if (coin.container === 'split') boxRect = splitBoxRef.current?.getBoundingClientRect() ?? null
    else if (coin.container === 'insurance') boxRect = insuranceBoxRef.current?.getBoundingClientRect() ?? null

    const contentRect = contentRef.current?.getBoundingClientRect()
    if (!boxRect || !contentRect) return

    const gridX = 6 + coin.gridIndex * (CD + 6)
    const gridY = 27
    const coinAbsX = (boxRect.left - contentRect.left) + gridX
    const coinAbsY = (boxRect.top - contentRect.top) + gridY

    dragRef.current = { coinId, ox: coinAbsX - mousePos.x, oy: coinAbsY - mousePos.y }
    setDrag({ coinId, x: coinAbsX, y: coinAbsY })

    if (e.type === 'mousedown') {
      document.addEventListener('mousemove', onMouseMove, { passive: true })
      document.addEventListener('mouseup', onMouseUp, { passive: true })
    }
  }, [state.coins, toContent])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return
    const pos = toContent(e.clientX, e.clientY)
    setDrag({ coinId: dragRef.current.coinId, x: pos.x + dragRef.current.ox, y: pos.y + dragRef.current.oy })
  }, [toContent])

  const onMouseUp = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return
    const pos = toContent(e.clientX, e.clientY)
    const cx = pos.x + dragRef.current.ox
    const cy = pos.y + dragRef.current.oy

    const target = dropTarget(cx, cy)

    if (target) {
      let box: HTMLDivElement | null = null
      if (target === 'player') box = playerBoxRef.current
      else if (target === 'wager') box = wagerBoxRef.current
      else if (target === 'split') box = splitBoxRef.current
      else if (target === 'insurance') box = insuranceBoxRef.current

      if (box) {
        const rect = box.getBoundingClientRect()
        const contentRect = contentRef.current?.getBoundingClientRect()
        if (contentRect) {
          const relX = cx - (rect.left - contentRect.left)
          const gridIndex = Math.max(0, Math.floor(relX / (CD + 6)))
          dispatch({ type: 'DROP', id: dragRef.current.coinId, container: target, gridIndex })
        }
      }
    } else {
      const playerDims = playerBoxRef.current ? {
        width: playerBoxRef.current.offsetWidth,
        height: playerBoxRef.current.offsetHeight,
      } : state.boxDims.player
      dispatch({ type: 'BOUNCE', id: dragRef.current.coinId, playerDims })
    }

    dragRef.current = null
    setDrag(null)
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }, [dropTarget, toContent, state.boxDims.player])

  // Touch support (non-passive, stable)
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const onTouchMove = (e: TouchEvent) => {
      if (!dragRef.current) return
      e.preventDefault()
      const t = e.touches[0]
      const pos = toContent(t.clientX, t.clientY)
      setDrag({ coinId: dragRef.current.coinId, x: pos.x + dragRef.current.ox, y: pos.y + dragRef.current.oy })
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!dragRef.current) return
      const t = e.changedTouches[0]
      const pos = toContent(t.clientX, t.clientY)
      const cx = pos.x + dragRef.current.ox
      const cy = pos.y + dragRef.current.oy

      const target = dropTarget(cx, cy)

      if (target) {
        let box: HTMLDivElement | null = null
        if (target === 'player') box = playerBoxRef.current
        else if (target === 'wager') box = wagerBoxRef.current
        else if (target === 'split') box = splitBoxRef.current
        else if (target === 'insurance') box = insuranceBoxRef.current

        if (box) {
          const rect = box.getBoundingClientRect()
          const contentRect = contentRef.current?.getBoundingClientRect()
          if (contentRect) {
            const relX = cx - (rect.left - contentRect.left)
            const gridIndex = Math.max(0, Math.floor(relX / (CD + 6)))
            dispatch({ type: 'DROP', id: dragRef.current.coinId, container: target, gridIndex })
          }
        }
      } else {
        const playerDims = playerBoxRef.current ? {
          width: playerBoxRef.current.offsetWidth,
          height: playerBoxRef.current.offsetHeight,
        } : state.boxDims.player
        dispatch({ type: 'BOUNCE', id: dragRef.current.coinId, playerDims })
      }

      dragRef.current = null
      setDrag(null)
    }

    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: false })

    return () => {
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [dropTarget, toContent, state.boxDims.player])

  // ─── Game engine wrappers (stable) ─────────────────────────────────────────
  const syncEng = useCallback((overrides?: Partial<S>) => {
    dispatch({ type: 'SYNC', eng: gameRef.current.getState(), overrides })
  }, [])

  const handleDeal = useCallback(() => {
    const wagerCoins = coinsIn(state.coins, 'wager')
    const bet = sumCoins(wagerCoins)
    if (bet === 0) return

    try {
      if (!bjLib || !bjActions) {
        console.error('BlackjackModule2: engine-blackjack not loaded')
        return
      }
      gameRef.current = new bjLib.Game()
      gameRef.current.dispatch(bjActions.deal({ bet }))
      syncEng()
    } catch (e) {
      console.error('BlackjackModule2: Error dealing hand', e)
    }
  }, [state.coins, syncEng])

  const handleHit = useCallback((pos: 'right' | 'left' = 'right') => {
    gameRef.current.dispatch(bjActions.hit({ position: pos }))
    syncEng()
  }, [syncEng])

  const handleStand = useCallback((pos: 'right' | 'left' = 'right') => {
    gameRef.current.dispatch(bjActions.stand({ position: pos }))
    syncEng()
  }, [syncEng])

  const handleDouble = useCallback((pos: 'right' | 'left' = 'right') => {
    gameRef.current.dispatch(bjActions.double({ position: pos }))
    syncEng()
  }, [syncEng])

  const handleSplit = useCallback(() => {
    gameRef.current.dispatch(bjActions.split())
    syncEng()
  }, [syncEng])

  const handleSurrender = useCallback(() => {
    gameRef.current.dispatch(bjActions.surrender())
    syncEng()
  }, [syncEng])

  const handleInsuranceYes = useCallback(() => {
    const half = Math.floor(state.initialBet / 2)
    if (half === 0) {
      handleInsuranceNo()
      return
    }
    gameRef.current.dispatch(bjActions.insurance({ bet: half }))
    syncEng()
  }, [state.initialBet, syncEng])

  const handleInsuranceNo = useCallback(() => {
    gameRef.current.dispatch(bjActions.insurance({ bet: 0 }))
    syncEng()
  }, [syncEng])

  // Derived state (memoized where possible)
  const isReady = state.stage === 'ready'
  const isDone = state.stage === 'done'
  const isPlayerRight = state.stage === 'player-turn-right'
  const isPlayerLeft = state.stage === 'player-turn-left'
  const isPlaying = isPlayerRight || isPlayerLeft

  const wagerCoins = coinsIn(state.coins, 'wager')
  const playerCoins = coinsIn(state.coins, 'player')
  const wagerVal = sumCoins(wagerCoins)
  const playerVal = sumCoins(playerCoins)

  const avR = state.handRight?.availableActions ?? {}
  const avL = state.handLeft?.availableActions ?? {}

  const activeHand = isPlayerLeft ? state.handLeft : state.handRight
  const activeCards = activeHand?.cards ?? []

  const dealerUp = state.dealerCards?.[0]
  const dealerBustPct = dealerUp ? (DEALER_BUST[dealerUp.value] ?? 0) : 0

  const deck = gameRef.current?.getState()?.deck ?? []
  const bustPct = (isPlaying && state.showOdds && activeCards.length > 0)
    ? bustProb(activeCards, deck)
    : null

  const needForDouble = isPlaying && avR.double && wagerVal < state.initialBet * 2
    ? state.initialBet * 2 - wagerVal : 0

  const isFirstMove = activeHand?.cards?.length === 2
  const playerTotal = activeHand?.playerValue?.hi ?? 0
  const dealerUpCard = state.dealerCards?.[0]
  const dealerIsAce = dealerUpCard?.value === 1
  const av = isPlayerLeft ? avL : avR

  const showHitStand = isPlaying && playerTotal < 21 && av.hit && av.stand
  const showDouble = isFirstMove && av.double && [9, 10, 11].includes(playerTotal)
  const showSplitBtn = isFirstMove && av.split && activeHand?.cards?.length === 2 && activeHand.cards[0]?.value === activeHand.cards[1]?.value
  const showInsurance = isFirstMove && av.insurance && !!dealerUpCard && dealerIsAce
  const showSurrender = isFirstMove && av.surrender && isPlaying

  return (
    <div
      ref={contentRef}
      className={styles['bj-container']}
      style={{ touchAction: drag ? 'none' : 'auto' }}
    >
      {/* Dealer zone */}
      <div className={styles['bj-dealer-zone']}>
        <div className={styles['bj-zone-header']}>
          <span className={styles['bj-label']}>Dealer</span>
          {state.dealerCards.length > 0 && (
            <HandValue
              val={state.dealerValue ?? undefined}
              blackjack={state.dealerHasBlackjack}
              busted={state.dealerHasBusted}
            />
          )}
        </div>
        <div className={styles['bj-cards-row']}>
          {state.dealerCards.length === 0 && <><PlayingCard hidden /><PlayingCard hidden /></>}
          {state.dealerCards.map((c, i) => <PlayingCard key={`dealer-${i}`} card={c} />)}
          {(isPlayerRight || isPlayerLeft) && state.dealerHoleCard && <PlayingCard hidden />}
          {state.showOdds && dealerUp && isPlaying && (
            <div className={styles['bj-odds-display']}>
              <div>DEALER BUST</div>
              <div className={styles['bj-odds-value']}>{dealerBustPct.toFixed(1)}%</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles['bj-divider']} />

      {/* Player zone */}
      <div className={styles['bj-player-zone']}>
        <div className={styles['bj-zone-header']}>
          <span className={styles['bj-label']}>Player</span>
          {state.handRight?.playerValue && (
            <HandValue
              val={state.handRight.playerValue}
              blackjack={state.handRight.playerHasBlackjack}
              busted={state.handRight.playerHasBusted}
            />
          )}
        </div>

        <div className={styles['bj-player-hands']}>
          <div className={styles['bj-hand']}>
            <div className={styles['bj-cards-row']}>
              {(isReady && !isDone) && <><PlayingCard hidden /><PlayingCard hidden /></>}
              {(state.handRight?.cards ?? []).map((c: EngCard, i: number) => (
                <PlayingCard key={`right-${i}`} card={c} />
              ))}
            </div>
            {bustPct !== null && !isPlayerLeft && (
              <div style={{ marginTop: 4, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(184,134,11,0.75)', letterSpacing: '0.08em' }}>
                BUST RISK {bustPct}%
              </div>
            )}
          </div>

          {state.showSplit && state.handLeft?.cards?.length > 0 && (
            <div className={styles['bj-hand-left']}>
              <div className={styles['bj-cards-row']}>
                {(state.handLeft.cards ?? []).map((c: EngCard, i: number) => (
                  <PlayingCard key={`left-${i}`} card={c} />
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

        {/* Dialogue */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
          <p className={styles['bj-dialogue']}>{state.dialogue}</p>

          {state.prompt && !state.gameOver && (
            <div className={styles['bj-prompt']}>
              <button
                onClick={state.prompt === 'more-coins' ? () => dispatch({ type: 'MORE_COINS_YES' }) : () => dispatch({ type: 'ODDS_YES' })}
                className={styles['bj-btn-yes']}
              >
                Yes
              </button>
              <button
                onClick={state.prompt === 'more-coins' ? () => dispatch({ type: 'MORE_COINS_NO' }) : () => dispatch({ type: 'ODDS_NO' })}
                className={styles['bj-btn-no']}
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles['bj-divider']} />

      {/* Coins grid */}
      <div className={styles['bj-coins-grid']} style={{ gridTemplateColumns: state.showSplit || state.showIns ? '1fr 1fr 1fr' : '1fr 1fr' }}>
        {/* Player */}
        <div className={styles['bj-coin-box']}>
          <span className={`${styles['bj-label']} ${styles['bj-label--small']}`}>Player</span>
          <div ref={playerBoxRef} className={styles['bj-coin-container']}>
            {playerCoins.map(coin => {
              if (drag?.coinId === coin.id) return null
              return (
                <CoinEl
                  key={coin.id}
                  coin={coin}
                  onDown={handleCoinDown}
                  returning={coin.returning}
                />
              )
            })}
          </div>
        </div>

        {/* Wager */}
        <div className={styles['bj-coin-box']}>
          <span className={`${styles['bj-label']} ${styles['bj-label--small']}`}>Wager</span>
          <div
            ref={wagerBoxRef}
            className={styles['bj-coin-container']}
            style={{
              borderColor: `rgba(184,134,11,${wagerVal > 0 ? '0.45' : '0.22'})`,
              background: 'rgba(11,8,32,0.45)',
              boxShadow: wagerVal > 0 ? '0 0 8px rgba(184,134,11,0.12)' : 'none',
            }}
          >
            {wagerCoins.map(coin => {
              if (drag?.coinId === coin.id) return null
              return (
                <CoinEl
                  key={coin.id}
                  coin={coin}
                  onDown={handleCoinDown}
                  returning={coin.returning}
                />
              )
            })}
            {needForDouble > 0 && (
              <div style={{
                position: 'absolute',
                bottom: 4,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 'clamp(7px, 0.85vw, 9px)',
                color: 'rgba(184,134,11,0.55)',
                letterSpacing: '0.08em',
                pointerEvents: 'none',
              }}>
                +{needForDouble} to double
              </div>
            )}
          </div>
        </div>

        {/* Split (conditional) */}
        {state.showSplit && (
          <div className={styles['bj-coin-box']}>
            <span className={`${styles['bj-label']} ${styles['bj-label--small']}`}>Split</span>
            <div ref={splitBoxRef} className={styles['bj-coin-container']}>
              {coinsIn(state.coins, 'split').map(coin => {
                if (drag?.coinId === coin.id) return null
                return <CoinEl key={coin.id} coin={coin} onDown={handleCoinDown} returning={coin.returning} />
              })}
            </div>
          </div>
        )}

        {/* Insurance (conditional) */}
        {state.showIns && (
          <div className={styles['bj-coin-box']}>
            <span className={`${styles['bj-label']} ${styles['bj-label--small']}`}>Insurance</span>
            <div ref={insuranceBoxRef} className={styles['bj-coin-container']}>
              {coinsIn(state.coins, 'insurance').map(coin => {
                if (drag?.coinId === coin.id) return null
                return <CoinEl key={coin.id} coin={coin} onDown={handleCoinDown} returning={coin.returning} />
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles['bj-action-buttons']}>
        {showHitStand && <ActBtn label="Hit" onClick={() => handleHit(isPlayerLeft ? 'left' : 'right')} />}
        {showHitStand && <ActBtn label="Stand" onClick={() => handleStand(isPlayerLeft ? 'left' : 'right')} />}
        {showDouble && <ActBtn label="Double" onClick={() => handleDouble(isPlayerLeft ? 'left' : 'right')} />}
        {showSplitBtn && <ActBtn label="Split" onClick={handleSplit} />}
        {showInsurance && <ActBtn label="Insurance" onClick={handleInsuranceYes} />}
        {showSurrender && <ActBtn label="Surrender" onClick={handleSurrender} />}
      </div>

      {/* Bottom bar */}
      <div className={styles['bj-bottom-bar']}>
        {state.gameOver ? (
          <button onClick={() => dispatch({ type: 'RESET' })} className={styles['bj-deal-button']}>
            Reset Game
          </button>
        ) : isDone ? (
          <button onClick={() => dispatch({ type: 'RESET' })} className={styles['bj-deal-button']}>
            Reset Hand
          </button>
        ) : !isPlaying ? (
          <button
            onClick={handleDeal}
            disabled={wagerVal === 0 || !!state.prompt}
            className={styles['bj-deal-button']}
            style={{ opacity: (wagerVal === 0 || !!state.prompt) ? 0.35 : 1 }}
          >
            Deal
          </button>
        ) : (
          <div className={styles['bj-bottom-spacer']} />
        )}

        <div className={styles['bj-bottom-content']}>
          {state.karmaDebt > 0 && (
            <button
              onClick={() => dispatch({ type: 'FORGIVE_KARMA' })}
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 'clamp(7px, 0.8vw, 9px)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.10em',
                color: 'rgba(200,80,80,0.70)',
                background: 'transparent',
                border: '1px solid rgba(200,80,80,0.35)',
                padding: '5px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderRadius: '2px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'rgba(200,80,80,0.95)'
                e.currentTarget.style.borderColor = 'rgba(200,80,80,0.55)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(200,80,80,0.70)'
                e.currentTarget.style.borderColor = 'rgba(200,80,80,0.35)'
              }}
            >
              Forgive Debt
            </button>
          )}

          <div className={styles['bj-karma-tracker']}>
            <span className={styles['bj-karma-label']}>Karma Debt</span>
            <span className={`${styles['bj-karma-value']} ${state.karmaDebt > 0 ? styles['debt'] : styles['neutral']}`}>
              {state.karmaDebt > 0 ? `${state.karmaDebt} pts` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Drag ghost */}
      {drag && (() => {
        const coin = state.coins.find(c => c.id === drag.coinId)
        return coin ? <DragGhost coin={coin} x={drag.x} y={drag.y} /> : null
      })()}

      {/* Inline animation keyframes (stable, no external CSS dependency issues) */}
      <style>{`
        @keyframes bj-coin-return {
          0% { opacity: 1; transform: scale(0.8); }
          50% { box-shadow: 0 0 15px rgba(255,215,0,0.6), inset -1px -1px 2px rgba(0,0,0,0.4); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// ─── Coin Element (grid-stable) ───────────────────────────────────────────────
function CoinEl({ coin, onDown, returning }: { coin: Coin; onDown: (e: React.MouseEvent | React.TouchEvent, id: string) => void; returning?: boolean }) {
  const gold = coin.type === 'gold'
  const gridX = 6 + coin.gridIndex * (CD + 6)
  const gridY = 27

  return (
    <div
      onMouseDown={coin.locked ? undefined : e => onDown(e, coin.id)}
      onTouchStart={coin.locked ? undefined : e => onDown(e, coin.id)}
      className={`${styles['bj-coin']} ${gold ? styles['gold'] : styles['bronze']} ${coin.locked ? styles['locked'] : ''} ${returning ? styles['returning'] : ''}`}
      style={{
        left: `${gridX - CR}px`,
        top: `${gridY - CR}px`,
        width: `${CD}px`,
        height: `${CD}px`,
        zIndex: coin.gridIndex,
      }}
    >
      <svg viewBox="0 0 26 26" style={{ width: '100%', height: '100%', opacity: 0.4 }}>
        <circle cx="13" cy="13" r="12" fill="none" stroke={gold ? '#9B8C2F' : '#5D5147'} strokeWidth="0.8" />
        <text x="13" y="15" fontSize="10" fontFamily="serif" fontWeight="bold" textAnchor="middle" fill={gold ? '#9B8C2F' : '#5D5147'}>
          {gold ? 'Φ' : 'Ψ'}
        </text>
      </svg>
    </div>
  )
}

// ─── Drag Ghost ───────────────────────────────────────────────────────────────
function DragGhost({ coin, x, y }: { coin: Coin; x: number; y: number }) {
  const gold = coin.type === 'gold'
  return (
    <div
      className={`${styles['bj-drag-ghost']} ${styles['visible']} ${gold ? styles['gold'] : styles['bronze']}`}
      style={{
        left: `${x - CR}px`,
        top: `${y - CR}px`,
        width: `${CD}px`,
        height: `${CD}px`,
      }}
    >
      <svg viewBox="0 0 26 26" style={{ width: '100%', height: '100%', opacity: 0.4 }}>
        <circle cx="13" cy="13" r="12" fill="none" stroke={gold ? '#9B8C2F' : '#5D5147'} strokeWidth="0.8" />
        <text x="13" y="15" fontSize="10" fontFamily="serif" fontWeight="bold" textAnchor="middle" fill={gold ? '#9B8C2F' : '#5D5147'}>
          {gold ? 'Φ' : 'Ψ'}
        </text>
      </svg>
    </div>
  )
}
