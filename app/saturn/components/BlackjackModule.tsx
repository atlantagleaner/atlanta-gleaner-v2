'use client'

import { useReducer, useRef, useEffect, useCallback, useState } from 'react'
import styles from './blackjack.module.css'

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
  gridIndex: number
  container: 'player' | 'wager' | 'split' | 'insurance'
  locked:    boolean
  returning?: boolean
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
  boxDims:            { player: { width: number; height: number }; wager: { width: number; height: number } }
  karmaDebt:          number
  showOdds:           boolean
  dialogue:           string
  prompt:             Prompt
  gameOver:           boolean
  showSplit:          boolean
  showIns:            boolean
}

type A =
  | { type: 'SYNC';              eng: any; overrides?: Partial<S> }
  | { type: 'DROP';              id: string; container: Coin['container']; gridIndex: number }
  | { type: 'BOUNCE';            id: string; playerDims: { width: number; height: number } }
  | { type: 'SET_BOX_DIMS';       dims: { player: { width: number; height: number }; wager: { width: number; height: number } } }
  | { type: 'SET_COINS';          coins: Coin[] }
  | { type: 'MORE_COINS_YES' }
  | { type: 'MORE_COINS_NO'  }
  | { type: 'ODDS_YES'        }
  | { type: 'ODDS_NO'         }
  | { type: 'RESET'           }
  | { type: 'FORGIVE_KARMA'   }
  | { type: 'CLEAR_RETURNING' }

// ─── Helpers ───────────────────────────────────────────────────────────────────
let _cid = 0
let _tempCid = 0  // Counter for deterministic server-side IDs only
function uid() { return `c${++_cid}_${Date.now()}` }
function tempUid() { return `temp-${++_tempCid}` }  // Deterministic for SSR, replaced on client

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

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

// Place coins in a grid row (gridIndex 0, 1, 2, ...)
function scatter(
  specs: Array<{ type: 'gold' | 'bronze'; value: number }>,
  box: { width: number; height: number },
  container: 'player' | 'wager',
  randomize: boolean = false,
): Coin[] {
  return specs.map((s, idx) => ({
    id:        tempUid(),  // Use deterministic ID for SSR; replaced with uid() on client
    type:      s.type,
    value:     s.value,
    gridIndex: idx,
    container,
    locked:    false,
  }))
}

// ─── Initial state ─────────────────────────────────────────────────────────────
function initState(): S {
  const specs = [
    ...Array(4).fill({ type: 'gold'   as const, value: GOLD   }),
    ...Array(2).fill({ type: 'bronze' as const, value: BRONZE }),
  ]
  const defaultDims = { player: { width: 160, height: 80 }, wager: { width: 160, height: 80 } }
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
    boxDims:            defaultDims,
    coins:              scatter(specs, defaultDims.player, 'player'),  // Default size, measured on mount
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
          coins = [...coins, ...scatter(valueToCoins(totalWon), state.boxDims.player, 'player')]
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
      const { id, container, gridIndex } = action
      return {
        ...state,
        coins: state.coins.map(c =>
          c.id === id
            ? { ...c, container, gridIndex, locked: container !== 'player' }
            : c
        ),
      }
    }

    case 'SET_BOX_DIMS': {
      const newDims = action.dims
      // No need to rescatter with grid-based positioning
      return {
        ...state,
        boxDims: newDims,
      }
    }

    case 'SET_COINS': {
      return {
        ...state,
        coins: action.coins,
      }
    }

    case 'BOUNCE': {
      // Return coin to player box with repositioning
      const playerCoins = coinsIn(state.coins, 'player')
      const maxIndex = playerCoins.reduce((max, c) => Math.max(max, c.gridIndex), -1)
      const newGridIndex = maxIndex + 1
      return {
        ...state,
        coins: state.coins.map(c =>
          c.id === action.id ? { ...c, container: 'player', gridIndex: newGridIndex, locked: false, returning: true } : c
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
      const newCoins = scatter(specs, state.boxDims.player, 'player').map(c => ({ ...c, returning: true }))
      return {
        ...state,
        coins:     [...coinsIn(state.coins, 'player'), ...newCoins],
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

// ─── Card Component ────────────────────────────────────────────────────────────
function PlayingCard({ card, hidden = false }: { card?: EngCard; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <div className={`${styles['bj-card']} ${styles['hidden']}`}>
        <svg viewBox="0 0 44 62" className={styles['bj-card-back-svg']}>
          <rect x="3" y="3" width="38" height="56" fill="none" stroke="#B8860B" strokeWidth="1"/>
          <circle cx="22" cy="31" r="8" fill="none" stroke="#B8860B" strokeWidth="0.7"/>
        </svg>
      </div>
    )
  }
  return (
    <div className={styles['bj-card']}>
      <div className={styles['bj-card-text']} style={{ color: card.color }}>
        {card.text}
      </div>
      <div className={styles['bj-card-suite']} style={{ color: card.color }}>
        {card.suite}
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

// ─── Styles ────────────────────────────────────────────────────────────────────
// All styles moved to app/saturn/styles/blackjack.module.css

// ─── Main Component ────────────────────────────────────────────────────────────
export function BlackjackModule() {
  const [state, dispatch] = useReducer(reducer, initState())
  const [drag, setDrag] = useState<{ coinId: string; x: number; y: number } | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const playerBoxRef = useRef<HTMLDivElement>(null)
  const wagerBoxRef = useRef<HTMLDivElement>(null)
  const splitBoxRef = useRef<HTMLDivElement>(null)
  const insuranceBoxRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(new bjLib.Game())
  const dragRef = useRef<{ coinId: string; ox: number; oy: number } | null>(null)

  // Measure box dimensions on mount and window resize, dispatch to reducer
  useEffect(() => {
    function measureBoxes() {
      if (playerBoxRef.current && wagerBoxRef.current) {
        dispatch({
          type: 'SET_BOX_DIMS',
          dims: {
            player: { width: playerBoxRef.current.offsetWidth, height: playerBoxRef.current.offsetHeight },
            wager: { width: wagerBoxRef.current.offsetWidth, height: wagerBoxRef.current.offsetHeight },
          },
        })
      }
    }
    measureBoxes()
    const timer = setTimeout(measureBoxes, 200)  // Measure after layout settles
    window.addEventListener('resize', measureBoxes)
    return () => { clearTimeout(timer); window.removeEventListener('resize', measureBoxes) }
  }, [])

  // Clear "returning" flag after animation completes
  useEffect(() => {
    const hasReturning = state.coins.some(c => c.returning)
    if (!hasReturning) return
    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_RETURNING' })
    }, 600)
    return () => clearTimeout(timer)
  }, [state.coins])

  // Grid-based positioning — no random scattering needed
  // Coins are already positioned by gridIndex in the scatter function

  // Validate drop target — checks all available containers
  function dropTarget(x: number, y: number): Coin['container'] | null {
    const contentRect = contentRef.current?.getBoundingClientRect()
    if (!contentRect) return null

    // Check player box
    if (playerBoxRef.current) {
      const rect = playerBoxRef.current.getBoundingClientRect()
      const relX = x - (rect.left - contentRect.left)
      const relY = y - (rect.top - contentRect.top)
      if (relX >= 0 && relX <= rect.width && relY >= 0 && relY <= rect.height) return 'player'
    }

    // Check wager box
    if (wagerBoxRef.current) {
      const rect = wagerBoxRef.current.getBoundingClientRect()
      const relX = x - (rect.left - contentRect.left)
      const relY = y - (rect.top - contentRect.top)
      if (relX >= 0 && relX <= rect.width && relY >= 0 && relY <= rect.height) return 'wager'
    }

    // Check split box (if available)
    if (state.showSplit && splitBoxRef.current) {
      const rect = splitBoxRef.current.getBoundingClientRect()
      const relX = x - (rect.left - contentRect.left)
      const relY = y - (rect.top - contentRect.top)
      if (relX >= 0 && relX <= rect.width && relY >= 0 && relY <= rect.height) return 'split'
    }

    // Check insurance box (if available)
    if (state.showIns && insuranceBoxRef.current) {
      const rect = insuranceBoxRef.current.getBoundingClientRect()
      const relX = x - (rect.left - contentRect.left)
      const relY = y - (rect.top - contentRect.top)
      if (relX >= 0 && relX <= rect.width && relY >= 0 && relY <= rect.height) return 'insurance'
    }

    return null
  }

  function toContent(clientX: number, clientY: number) {
    if (!contentRef.current) return { x: 0, y: 0 }
    const rect = contentRef.current.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function handleCoinDown(e: React.MouseEvent | React.TouchEvent, coinId: string) {
    if (e.type === 'mousedown' && (e as React.MouseEvent).button !== 0) return

    const coin = state.coins.find(c => c.id === coinId)
    if (!coin || coin.locked) return

    const clientX = e.type === 'touchstart' ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = e.type === 'touchstart' ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY
    const mousePos = toContent(clientX, clientY)

    // Get the box the coin is in to estimate a visual drag position
    let boxRect: DOMRect | null = null
    if (coin.container === 'player') boxRect = playerBoxRef.current?.getBoundingClientRect() ?? null
    else if (coin.container === 'wager') boxRect = wagerBoxRef.current?.getBoundingClientRect() ?? null
    else if (coin.container === 'split') boxRect = splitBoxRef.current?.getBoundingClientRect() ?? null
    else if (coin.container === 'insurance') boxRect = insuranceBoxRef.current?.getBoundingClientRect() ?? null

    const contentRect = contentRef.current?.getBoundingClientRect()
    if (!boxRect || !contentRect) return

    // Store drag info (we'll use gridIndex for snapping, but keep visual feedback)
    const coinAbsX = (boxRect.left - contentRect.left) + CD * coin.gridIndex  // Position based on gridIndex for visual feedback
    const coinAbsY = (boxRect.top - contentRect.top) + CD / 2

    dragRef.current = { coinId, ox: coinAbsX - mousePos.x, oy: coinAbsY - mousePos.y }
    setDrag({ coinId, x: coinAbsX, y: coinAbsY })

    if (e.type === 'mousedown') {
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragRef.current) return
    const pos = toContent(e.clientX, e.clientY)
    setDrag({ coinId: dragRef.current.coinId, x: pos.x + dragRef.current.ox, y: pos.y + dragRef.current.oy })
  }

  function onMouseUp(e: MouseEvent) {
    if (!dragRef.current) return
    const pos = toContent(e.clientX, e.clientY)
    const cx = pos.x + dragRef.current.ox
    const cy = pos.y + dragRef.current.oy

    const target = dropTarget(cx, cy)

    if (target) {
      // Get the appropriate box ref and calculate grid index
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
          // Calculate grid index based on position within the box (grid cell width = CD + gap)
          const gridIndex = Math.max(0, Math.floor(relX / (CD + 6)))
          dispatch({ type: 'DROP', id: dragRef.current.coinId, container: target, gridIndex })
        }
      }
    } else {
      // Bounce back to player box
      if (playerBoxRef.current) {
        const playerDims = { width: playerBoxRef.current.offsetWidth, height: playerBoxRef.current.offsetHeight }
        dispatch({ type: 'BOUNCE', id: dragRef.current.coinId, playerDims })
      }
    }

    dragRef.current = null
    setDrag(null)

    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  // Touch drag (non-passive to block scroll)
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    function onTouchMove(e: TouchEvent) {
      if (!dragRef.current) return
      e.preventDefault()
      const t = e.touches[0]
      const pos = toContent(t.clientX, t.clientY)
      setDrag({ coinId: dragRef.current.coinId, x: pos.x + dragRef.current.ox, y: pos.y + dragRef.current.oy })
    }

    function onTouchEnd(e: TouchEvent) {
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
            // Calculate grid index based on position within the box
            const gridIndex = Math.max(0, Math.floor(relX / (CD + 6)))
            dispatch({ type: 'DROP', id: dragRef.current.coinId, container: target, gridIndex })
          }
        }
      } else {
        if (playerBoxRef.current) {
          const playerDims = { width: playerBoxRef.current.offsetWidth, height: playerBoxRef.current.offsetHeight }
          dispatch({ type: 'BOUNCE', id: dragRef.current.coinId, playerDims })
        }
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
  }, [])

  // Game action handlers
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
    gameRef.current.dispatch(bjActions.insurance({ bet: half }))
    syncEng()
  }

  function handleInsuranceNo() {
    gameRef.current.dispatch(bjActions.insurance({ bet: 0 }))
    syncEng()
  }

  // Derived state
  const isReady        = state.stage === 'ready'
  const isDone         = state.stage === 'done'
  const isPlayerRight  = state.stage === 'player-turn-right'
  const isPlayerLeft   = state.stage === 'player-turn-left'
  const isPlaying      = isPlayerRight || isPlayerLeft

  const wagerCoins     = coinsIn(state.coins, 'wager')
  const playerCoins    = coinsIn(state.coins, 'player')
  const wagerVal       = sumCoins(wagerCoins)
  const playerVal      = sumCoins(playerCoins)

  const avR = state.handRight?.availableActions ?? {}
  const avL = state.handLeft?.availableActions  ?? {}

  const activeHand  = isPlayerLeft ? state.handLeft  : state.handRight
  const activeCards = activeHand?.cards ?? []

  const dealerUp     = state.dealerCards?.[0]
  const dealerBustPct = dealerUp ? (DEALER_BUST[dealerUp.value] ?? 0) : 0

  const deck          = gameRef.current?.getState()?.deck ?? []
  const bustPct       = (isPlaying && state.showOdds && activeCards.length > 0)
    ? bustProb(activeCards, deck)
    : null

  const needForDouble = isPlaying && avR.double && wagerVal < state.initialBet * 2
    ? state.initialBet * 2 - wagerVal : 0

  // Button visibility logic
  const isFirstMove = activeHand?.cards?.length === 2
  const playerTotal = activeHand?.playerValue?.hi ?? 0
  const dealerUpCard = state.dealerCards?.[0]
  const dealerIsAce = dealerUpCard?.value === 1
  const av = isPlayerLeft ? avL : avR

  const showHitStand = isPlaying && playerTotal < 21 && av.hit && av.stand
  const showDouble = isFirstMove && av.double && [9, 10, 11].includes(playerTotal)
  const showSplit = isFirstMove && av.split && activeHand?.cards?.length === 2 && activeHand.cards[0]?.value === activeHand.cards[1]?.value
  const showInsurance = isFirstMove && av.insurance && !!dealerUpCard && dealerIsAce
  const showSurrender = isFirstMove && av.surrender && isPlaying

  return (
    <div
      ref={contentRef}
      className={styles['bj-container']}
      style={{ touchAction: drag ? 'none' : 'auto' }}
    >

      {/* ── Dealer zone ── */}
      <div className={styles['bj-dealer-zone']}>
        <div className={styles['bj-zone-header']}>
          <span className={styles['bj-label']}>Dealer</span>
          {state.dealerCards.length > 0 && (
            <HandValue val={state.dealerValue ?? undefined} blackjack={state.dealerHasBlackjack} busted={state.dealerHasBusted} />
          )}
        </div>
        <div className={styles['bj-cards-row']}>
          {state.dealerCards.length === 0 && (<><PlayingCard hidden /><PlayingCard hidden /></>)}
          {state.dealerCards.map((c, i) => (<PlayingCard key={i} card={c} />))}
          {(isPlayerRight || isPlayerLeft) && state.dealerHoleCard && (<PlayingCard hidden />)}
          {state.showOdds && dealerUp && isPlaying && (
            <div className={styles['bj-odds-display']}>
              <div>DEALER BUST</div>
              <div className={styles['bj-odds-value']}>{dealerBustPct.toFixed(1)}%</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles['bj-divider']} />

      {/* ── Player zone ── */}
      <div className={styles['bj-player-zone']}>
        <div className={styles['bj-zone-header']}>
          <span className={styles['bj-label']}>Player</span>
          {state.handRight?.playerValue && (<HandValue val={state.handRight.playerValue} blackjack={state.handRight.playerHasBlackjack} busted={state.handRight.playerHasBusted} />)}
        </div>

        <div className={styles['bj-player-hands']}>
          <div className={styles['bj-hand']}>
            <div className={styles['bj-cards-row']}>
              {(isReady && !isDone) && (<><PlayingCard hidden /><PlayingCard hidden /></>)}
              {(state.handRight?.cards ?? []).map((c: EngCard, i: number) => (<PlayingCard key={i} card={c} />))}
            </div>
            {bustPct !== null && !isPlayerLeft && (
              <div style={{ marginTop: 4, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(184,134,11,0.75)', letterSpacing: '0.08em' }}>
                BUST RISK {bustPct}%
              </div>
            )}
          </div>

          {state.showSplit && (state.handLeft?.cards?.length > 0) && (
            <div className={styles['bj-hand-left']}>
              <div className={styles['bj-cards-row']}>
                {(state.handLeft.cards ?? []).map((c: EngCard, i: number) => (<PlayingCard key={i} card={c} />))}
              </div>
              {state.handLeft?.playerValue && (<div style={{ marginTop: 4 }}><HandValue val={state.handLeft.playerValue} blackjack={state.handLeft.playerHasBlackjack} busted={state.handLeft.playerHasBusted} /></div>)}
              {bustPct !== null && isPlayerLeft && (
                <div style={{ marginTop: 4, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(184,134,11,0.75)', letterSpacing: '0.08em' }}>
                  BUST RISK {bustPct}%
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dialogue footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
          <p className={styles['bj-dialogue']}>
            {state.dialogue}
          </p>

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

      {/* ── Coins Grid (compact) ── */}
      <div className={styles['bj-coins-grid']} style={{ gridTemplateColumns: state.showSplit ? '1fr 1fr 1fr' : state.showIns ? '1fr 1fr 1fr' : '1fr 1fr' }}>

        {/* Player Coin Box */}
        <div className={styles['bj-coin-box']}>
          <span className={`${styles['bj-label']} ${styles['bj-label--small']}`}>Player</span>
          <div
            ref={playerBoxRef}
            className={styles['bj-coin-container']}
          >
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

        {/* Wager Box */}
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

        {/* Split Box (conditional) */}
        {state.showSplit && (
          <div className={styles['bj-coin-box']}>
            <span className={`${styles['bj-label']} ${styles['bj-label--small']}`}>Split</span>
            <div
              ref={splitBoxRef}
              className={styles['bj-coin-container']}
            >
              {coinsIn(state.coins, 'split').map(coin => {
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
        )}

        {/* Insurance Box (conditional) */}
        {state.showIns && (
          <div className={styles['bj-coin-box']}>
            <span className={`${styles['bj-label']} ${styles['bj-label--small']}`}>Insurance</span>
            <div
              ref={insuranceBoxRef}
              className={styles['bj-coin-container']}
            >
              {coinsIn(state.coins, 'insurance').map(coin => {
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
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className={styles['bj-action-buttons']}>
        {showHitStand && (<ActBtn label="Hit" onClick={() => handleHit(isPlayerLeft ? 'left' : 'right')} />)}
        {showHitStand && (<ActBtn label="Stand" onClick={() => handleStand(isPlayerLeft ? 'left' : 'right')} />)}
        {showDouble && (<ActBtn label="Double" onClick={() => handleDouble(isPlayerLeft ? 'left' : 'right')} />)}
        {showSplit && (<ActBtn label="Split" onClick={handleSplit} />)}
        {showInsurance && (<ActBtn label="Insurance" onClick={handleInsuranceYes} />)}
        {showSurrender && (<ActBtn label="Surrender" onClick={handleSurrender} />)}
      </div>

      {/* ── Bottom Bar ── */}
      <div className={styles['bj-bottom-bar']}>
        {state.gameOver ? (
          <button onClick={() => dispatch({ type: 'RESET' })} className={styles['bj-deal-button']}>
            Reset
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
          {/* Karma Forgiveness Button */}
          {state.karmaDebt > 0 && (
            <button
              onClick={() => dispatch({ type: 'FORGIVE_KARMA' })}
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 'clamp(7px, 0.8vw, 9px)',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.10em',
                color: 'rgba(200,80,80,0.70)',
                background: 'transparent',
                border: '1px solid rgba(200,80,80,0.35)',
                padding: '5px 10px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderRadius: '2px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,80,80,0.95)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,80,80,0.55)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,80,80,0.70)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(200,80,80,0.35)'
              }}
            >
              Forgive Debt
            </button>
          )}

          {/* Karma Debt Display */}
          <div className={styles['bj-karma-tracker']}>
            <span className={styles['bj-karma-label']}>Karma Debt</span>
            <span className={`${styles['bj-karma-value']} ${state.karmaDebt > 0 ? styles['debt'] : styles['neutral']}`}>
              {state.karmaDebt > 0 ? `${state.karmaDebt} pts` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Drag Ghost */}
      {drag && (() => {
        const coin = state.coins.find(c => c.id === drag.coinId)
        return coin ? <DragGhost coin={coin} x={drag.x} y={drag.y} /> : null
      })()}

      <style>{`
        @keyframes bj-coin-glow {
          0%, 100% {
            box-shadow: 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.3);
          }
          50% {
            box-shadow: 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.3), 0 0 14px rgba(184,134,11,0.5), 0 0 28px rgba(184,134,11,0.2);
          }
        }
      `}</style>
    </div>
  )
}

// ─── Coin Component ────────────────────────────────────────────────────────────
function CoinEl({ coin, onDown, returning }: { coin: Coin; onDown: (e: React.MouseEvent | React.TouchEvent, id: string) => void; returning?: boolean }) {
  const gold = coin.type === 'gold'
  return (
    <div
      onMouseDown={coin.locked ? undefined : e => onDown(e, coin.id)}
      onTouchStart={coin.locked ? undefined : e => onDown(e, coin.id)}
      className={`${styles['bj-coin']} ${gold ? styles['gold'] : styles['bronze']} ${coin.locked ? styles['locked'] : ''} ${returning ? styles['returning'] : ''}`}
    >
      <svg viewBox="0 0 26 26" style={{ width: '100%', height: '100%', opacity: 0.4 }}>
        <circle cx="13" cy="13" r="12" fill="none" stroke={gold ? '#9B8C2F' : '#5D5147'} strokeWidth="0.8"/>
        <text x="13" y="15" fontSize="10" fontFamily="serif" fontWeight="bold" textAnchor="middle" fill={gold ? '#9B8C2F' : '#5D5147'}>
          {gold ? 'Φ' : 'Ψ'}
        </text>
      </svg>
    </div>
  )
}

// ─── Drag Ghost Component ──────────────────────────────────────────────────────
function DragGhost({ coin, x, y }: { coin: Coin; x: number; y: number }) {
  const gold = coin.type === 'gold'
  return (
    <div
      className={`${styles['bj-drag-ghost']} ${styles['visible']} ${gold ? styles['gold'] : styles['bronze']}`}
      style={{
        left: x - CR,
        top: y - CR,
        width: CD,
        height: CD,
      }}
    >
      <svg viewBox="0 0 26 26" style={{ width: '100%', height: '100%', opacity: 0.4 }}>
        <circle cx="13" cy="13" r="12" fill="none" stroke={gold ? '#9B8C2F' : '#5D5147'} strokeWidth="0.8"/>
        <text x="13" y="15" fontSize="10" fontFamily="serif" fontWeight="bold" textAnchor="middle" fill={gold ? '#9B8C2F' : '#5D5147'}>
          {gold ? 'Φ' : 'Ψ'}
        </text>
      </svg>
    </div>
  )
}
