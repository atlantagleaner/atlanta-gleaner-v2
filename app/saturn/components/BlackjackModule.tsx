'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// engine-blackjack is CJS, client-only component — safe to import directly
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Game, actions } = require('engine-blackjack') as typeof import('engine-blackjack')

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayingCard {
  text:  string
  suite: string
  value: number
  color: 'R' | 'B'
}

interface AvailableActions {
  hit:       boolean
  stand:     boolean
  double:    boolean
  split:     boolean
  insurance: boolean
  surrender: boolean
}

interface WagerCoin {
  id: string
  x:  number   // position within wager box
  y:  number
}

interface UIState {
  stage:              string
  playerCards:        PlayingCard[]
  dealerCards:        PlayingCard[]
  playerValue:        number
  dealerValue:        number
  scatteredCoins:     Array<{ id: string; x: number; y: number }>
  wagerCoins:         WagerCoin[]
  karmaDue:           number
  gameLog:            string[]
  result:             string | null
  availableActions:   AvailableActions
  showHint:           boolean
  hasBeenBroke:       boolean   // first time player ran out of coins
  showMorePrompt:     boolean   // show "More?" dialog
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COIN_VALUE = 25
const MAX_COINS   = 8
const KARMA: Record<string, number> = {
  win:              -10,
  blackjack:        -20,
  'win (doubled)':  -20,
  push:               0,
  loss:             +15,
  bust:             +20,
  surrender:        +8,
  'loss (doubled)': +30,
}

const SUIT_ICONS: Record<string, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cardDisplay(c: PlayingCard): string {
  return `${c.text}${SUIT_ICONS[c.suite] ?? c.suite}`
}

function bestVal(v?: { hi: number; lo: number }): number {
  if (!v) return 0
  return v.hi <= 21 ? v.hi : v.lo
}

function logLine(result: string, bet: number): string {
  const k = KARMA[result] ?? 0
  const sign = k <= 0 ? `${k}` : `+${k}`
  return `${result.toUpperCase()} · Bet ${bet} · Karma ${sign}`
}

function resolveResult(state: ReturnType<InstanceType<typeof Game>['getState']>, doubled = false): string {
  const right = state.handInfo?.right ?? {}
  if (right.playerHasBlackjack) return 'blackjack'
  if (right.playerHasBusted)    return 'bust'
  const won = (state.wonOnRight ?? 0) > 0 || (state.finalWin ?? 0) > 0
  const lost = !won && !(right.playerHasBusted)
  const push = !won && !lost

  if (won  && doubled) return 'win (doubled)'
  if (won)             return 'win'
  if (push)            return 'push'
  if (doubled)         return 'loss (doubled)'
  return 'loss'
}

function generateScatteredCoins(count: number): Array<{ id: string; x: number; y: number }> {
  return Array.from({ length: count }).map((_, i) => ({
    id: `coin-${i}-${Date.now()}-${Math.random()}`,
    x:  Math.random() * 200 - 100,
    y:  Math.random() * 100 - 50,
  }))
}

// ─── Component ────────────────────────────────────────────────────────────────

const INITIAL: UIState = {
  stage:              'betting',
  playerCards:        [],
  dealerCards:        [],
  playerValue:        0,
  dealerValue:        0,
  scatteredCoins:     [],
  wagerCoins:         [],
  karmaDue:           0,
  gameLog:            [],
  result:             null,
  availableActions:   { hit: false, stand: false, double: false, split: false, insurance: false, surrender: false },
  showHint:           true,
  hasBeenBroke:       false,
  showMorePrompt:     false,
}

export function BlackjackModule() {
  const gameRef       = useRef<InstanceType<typeof Game> | null>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const wagerZoneRef  = useRef<HTMLDivElement>(null)
  const hasDealtRef   = useRef(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const [ui, setUi]           = useState<UIState>(INITIAL)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragPos, setDragPos]   = useState<{ x: number; y: number } | null>(null)

  // Generate scattered coins on client mount
  useEffect(() => {
    setUi(prev => prev.scatteredCoins.length === 0
      ? { ...prev, scatteredCoins: generateScatteredCoins(4) }
      : prev
    )
  }, [])

  // Check if player is out of coins after a hand resolves
  useEffect(() => {
    if (ui.stage !== 'done') return
    if (ui.scatteredCoins.length > 0 || ui.wagerCoins.length > 0) return

    if (!ui.hasBeenBroke) {
      // First time broke — show "More?" prompt
      setUi(prev => ({ ...prev, showMorePrompt: true }))
    } else {
      // Subsequent — auto-replenish
      setUi(prev => ({
        ...prev,
        scatteredCoins: generateScatteredCoins(4),
      }))
    }
  }, [ui.stage, ui.scatteredCoins.length, ui.wagerCoins.length, ui.hasBeenBroke])

  const syncFromGame = useCallback((result: string | null, bet: number, doubled = false) => {
    const g = gameRef.current
    if (!g) return
    const s     = g.getState()
    const right = s.handInfo?.right ?? {}
    const done  = s.stage === 'done'

    const finalResult = done
      ? (result ?? resolveResult(s, doubled))
      : null

    const karmaDelta = finalResult ? (KARMA[finalResult] ?? 0) : 0

    setUi(prev => {
      const newLog = finalResult
        ? [logLine(finalResult, doubled ? bet * 2 : bet), ...prev.gameLog].slice(0, 8)
        : prev.gameLog

      return {
        ...prev,
        stage:            done ? 'done' : 'playing',
        playerCards:      (right.cards ?? []) as PlayingCard[],
        dealerCards:      (s.dealerCards ?? []) as PlayingCard[],
        playerValue:      bestVal(right.playerValue as { hi: number; lo: number }),
        dealerValue:      bestVal(s.dealerValue as { hi: number; lo: number }),
        karmaDue:         done ? prev.karmaDue + karmaDelta : prev.karmaDue,
        gameLog:          newLog,
        result:           finalResult,
        availableActions: (right.availableActions ?? {}) as unknown as AvailableActions,
      }
    })
  }, [])

  const currentBet = ui.wagerCoins.length * COIN_VALUE
  const canDeal    = currentBet > 0 && ui.stage === 'betting'

  const handleDeal = useCallback(() => {
    if (!canDeal) return
    hasDealtRef.current = true
    const g = new Game()
    gameRef.current = g
    g.dispatch(actions.deal({ bet: currentBet }))
    const s     = g.getState()
    const right = s.handInfo?.right ?? {}
    setUi(prev => ({
      ...prev,
      stage:            s.stage === 'done' ? 'done' : 'playing',
      playerCards:      (right.cards ?? []) as PlayingCard[],
      dealerCards:      (s.dealerCards ?? []) as PlayingCard[],
      playerValue:      bestVal(right.playerValue as { hi: number; lo: number }),
      dealerValue:      bestVal(s.dealerValue as { hi: number; lo: number }),
      scatteredCoins:   [],
      wagerCoins:       [],
      result:           null,
      availableActions: (right.availableActions ?? {}) as unknown as AvailableActions,
      showHint:         false,
    }))
  }, [currentBet, canDeal])

  const handleHit      = useCallback(() => { gameRef.current?.dispatch(actions.hit({ position: 'right' }));      syncFromGame(null, currentBet) }, [syncFromGame, currentBet])
  const handleStand    = useCallback(() => { gameRef.current?.dispatch(actions.stand({ position: 'right' }));    syncFromGame(null, currentBet) }, [syncFromGame, currentBet])
  const handleDouble   = useCallback(() => { gameRef.current?.dispatch(actions.double({ position: 'right' }));   syncFromGame(null, currentBet, true) }, [syncFromGame, currentBet])
  const handleSurrender= useCallback(() => { gameRef.current?.dispatch(actions.surrender());                      syncFromGame('surrender', currentBet) }, [syncFromGame, currentBet])

  const handleNewHand = useCallback(() => {
    gameRef.current = null
    setUi(prev => ({
      ...INITIAL,
      scatteredCoins: generateScatteredCoins(4),
      karmaDue:    prev.karmaDue,
      gameLog:     prev.gameLog,
      hasBeenBroke: prev.hasBeenBroke,
      showHint:    !hasDealtRef.current,
    }))
  }, [])

  const handleMoreYes = useCallback(() => {
    setUi(prev => ({
      ...prev,
      showMorePrompt: false,
      hasBeenBroke:   true,
      scatteredCoins: generateScatteredCoins(4),
    }))
  }, [])

  const handleMoreNo = useCallback(() => {
    setUi(prev => ({ ...prev, showMorePrompt: false, hasBeenBroke: true }))
  }, [])

  // ─── Drag helpers ─────────────────────────────────────────────────────────

  const getClientXY = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  const startDrag = useCallback((coinId: string, clientX: number, clientY: number, coinEl: HTMLElement) => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const coinRect = coinEl.getBoundingClientRect()
    dragOffsetRef.current = {
      x: clientX - (coinRect.left + coinRect.width  / 2),
      y: clientY - (coinRect.top  + coinRect.height / 2),
    }

    setDragging(coinId)
    setDragPos({
      x: clientX - containerRect.left - dragOffsetRef.current.x,
      y: clientY - containerRect.top  - dragOffsetRef.current.y,
    })
  }, [])

  const handleCoinMouseDown = useCallback((coinId: string, e: React.MouseEvent) => {
    e.preventDefault()
    startDrag(coinId, e.clientX, e.clientY, e.currentTarget as HTMLElement)
  }, [startDrag])

  const handleCoinTouchStart = useCallback((coinId: string, e: React.TouchEvent) => {
    e.preventDefault()
    const t = e.touches[0]
    startDrag(coinId, t.clientX, t.clientY, e.currentTarget as HTMLElement)
  }, [startDrag])

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    setDragPos({
      x: clientX - containerRect.left - dragOffsetRef.current.x,
      y: clientY - containerRect.top  - dragOffsetRef.current.y,
    })
  }, [dragging])

  const handleMouseMove = useCallback((e: React.MouseEvent) => moveDrag(e.clientX, e.clientY), [moveDrag])
  const handleTouchMove = useCallback((e: React.TouchEvent) => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY) }, [moveDrag])

  const dropCoin = useCallback((clientX: number, clientY: number) => {
    if (!dragging || !dragPos) return

    const wagerRect = wagerZoneRef.current?.getBoundingClientRect()

    if (
      wagerRect &&
      clientX >= wagerRect.left &&
      clientX <= wagerRect.right &&
      clientY >= wagerRect.top  &&
      clientY <= wagerRect.bottom
    ) {
      if (ui.wagerCoins.length < MAX_COINS) {
        const id = dragging
        // Position relative to wager zone center
        const wx = clientX - wagerRect.left
        const wy = clientY - wagerRect.top
        setUi(prev => ({
          ...prev,
          wagerCoins:     [...prev.wagerCoins, { id, x: wx, y: wy }],
          scatteredCoins: prev.scatteredCoins.filter(c => c.id !== id),
        }))
      }
    } else {
      // Drop back into scattered area (only if not already a wager coin)
      const scatteredEl = containerRef.current?.querySelector('[data-scattered-area]')
      const areaRect    = scatteredEl?.getBoundingClientRect()
      if (areaRect) {
        const newX = clientX - areaRect.left - areaRect.width  / 2
        const newY = clientY - areaRect.top  - areaRect.height / 2
        const id = dragging
        setUi(prev => ({
          ...prev,
          scatteredCoins: prev.scatteredCoins.map(c =>
            c.id === id ? { ...c, x: newX, y: newY } : c
          ),
        }))
      }
    }

    setDragging(null)
    setDragPos(null)
  }, [dragging, dragPos, ui.wagerCoins.length])

  const handleMouseUp   = useCallback((e: React.MouseEvent)  => dropCoin(e.clientX, e.clientY), [dropCoin])
  const handleTouchEnd  = useCallback((e: React.TouchEvent)  => {
    const t = e.changedTouches[0]
    dropCoin(t.clientX, t.clientY)
  }, [dropCoin])

  const handleRemoveCoin = useCallback((coinId: string) => {
    setUi(prev => ({
      ...prev,
      scatteredCoins: [...prev.scatteredCoins, { id: coinId, x: Math.random() * 200 - 100, y: Math.random() * 100 - 50 }],
      wagerCoins: prev.wagerCoins.filter(c => c.id !== coinId),
    }))
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────

  const { stage, playerCards, dealerCards, playerValue, dealerValue,
          scatteredCoins, wagerCoins, karmaDue, gameLog, result,
          availableActions, showHint, showMorePrompt } = ui

  const isBetting = stage === 'betting'
  const isPlaying = stage === 'playing'
  const isDone    = stage === 'done'

  const RESULT_MSGS: Record<string, string> = {
    win:              'The house relents.',
    blackjack:        'Natural. The universe takes note.',
    'win (doubled)':  'Doubled and won. The debt recedes.',
    loss:             'The house collects.',
    bust:             'You exceeded. The house always knew you would.',
    push:             'The ledger balances. For now.',
    surrender:        'Retreat acknowledged. Partial mercy granted.',
    'loss (doubled)': 'Bold. Wrong. The debt compounds.',
  }

  const RESULT_COLOR: Record<string, string> = {
    win:              '#4CAF50',
    blackjack:        '#D4AF37',
    'win (doubled)':  '#4CAF50',
    push:             '#A9A9A9',
    loss:             '#CF6679',
    bust:             '#CF6679',
    surrender:        '#CF6679',
    'loss (doubled)': '#CF6679',
  }

  return (
    <div style={MODULE_SHELL}>

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Dealer hand */}
        <div>
          <p style={{ ...MUTED_TEXT, margin: '0 0 8px' }}>Dealer</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, minHeight: '40px', alignItems: 'center' }}>
            {dealerCards.length === 0
              ? <span style={PLACEHOLDER}>—</span>
              : dealerCards.map((c, i) => (
                  <span key={i} style={{ ...CARD_CHIP, color: c.color === 'R' ? '#CF6679' : '#0B0820' }}>
                    {cardDisplay(c)}
                  </span>
                ))
            }
            {dealerCards.length > 0 && dealerValue > 0 && (
              <span style={VALUE_BADGE}>{dealerValue}</span>
            )}
          </div>
        </div>

        <div style={THIN_RULE} />

        {/* Player hand */}
        <div>
          <p style={{ ...MUTED_TEXT, margin: '0 0 8px' }}>Your Hand</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, minHeight: '40px', alignItems: 'center' }}>
            {playerCards.length === 0
              ? <span style={PLACEHOLDER}>—</span>
              : playerCards.map((c, i) => (
                  <span key={i} style={{ ...CARD_CHIP, color: c.color === 'R' ? '#CF6679' : '#0B0820' }}>
                    {cardDisplay(c)}
                  </span>
                ))
            }
            {playerCards.length > 0 && playerValue > 0 && (
              <span style={VALUE_BADGE}>{playerValue}</span>
            )}
          </div>
        </div>

        <div style={THIN_RULE} />

        {/* Result */}
        {isDone && result && (
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize:   '17px',
            fontStyle:  'italic',
            fontWeight: 600,
            color:      RESULT_COLOR[result] ?? '#A9A9A9',
            margin:     0,
            lineHeight: 1.4,
            textShadow: `0 0 10px ${RESULT_COLOR[result] ?? '#A9A9A9'}40`,
          }}>
            {RESULT_MSGS[result] ?? result}
          </p>
        )}

        {/* More? prompt */}
        {showMorePrompt && (
          <div style={{ textAlign: 'center' as const, padding: '12px 0' }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '18px',
              fontStyle: 'italic',
              color: '#F5F1E8',
              margin: '0 0 14px',
              textShadow: '0 0 8px rgba(184,134,11,0.30)',
            }}>
              More?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleMoreYes} style={BTN_PRIMARY}>Yes</button>
              <button onClick={handleMoreNo}  style={BTN_GHOST}>No</button>
            </div>
          </div>
        )}

        {/* Betting zone */}
        {isBetting && !showMorePrompt && (
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ position: 'relative' as const, userSelect: 'none' as const, touchAction: 'none' }}
          >
            {/* Wager zone — free-float coins land where dropped */}
            <div
              ref={wagerZoneRef}
              data-wager-zone
              style={{
                width:          '160px',
                height:         '160px',
                margin:         '0 auto 12px',
                background:     wagerCoins.length > 0 ? 'rgba(184,134,11,0.12)' : 'rgba(184,134,11,0.04)',
                border:         `2px ${wagerCoins.length > 0 ? 'solid' : 'dashed'} rgba(184,134,11,${wagerCoins.length > 0 ? '0.40' : '0.20'})`,
                position:       'relative' as const,
                transition:     'all 0.2s ease',
              }}
            >
              {wagerCoins.length === 0 ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <span style={{ ...MUTED_TEXT, fontSize: '9px', textAlign: 'center' as const }}>
                    Drag coins here
                  </span>
                </div>
              ) : (
                wagerCoins.map((coin) => (
                  <div
                    key={coin.id}
                    onClick={() => handleRemoveCoin(coin.id)}
                    style={{
                      position:     'absolute' as const,
                      left:         `${coin.x}px`,
                      top:          `${coin.y}px`,
                      transform:    'translate(-50%, -50%)',
                      width:        '36px',
                      height:       '36px',
                      borderRadius: '50%',
                      background:   'radial-gradient(circle at 30% 30%, #D4AF37, #B8860B)',
                      border:       '2px solid #B8860B',
                      boxShadow:    'inset -2px -2px 4px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
                      cursor:       'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translate(-50%, -50%)')}
                  />
                ))
              )}
            </div>

            {/* Hint */}
            {showHint && (
              <p style={{ ...MUTED_TEXT, textAlign: 'center' as const, margin: '0 0 8px', fontSize: '9px' }}>
                Looks like someone left their coins behind...
              </p>
            )}

            {/* Scattered coins area */}
            <div
              data-scattered-area
              style={{
                position:   'relative' as const,
                height:     '140px',
                background: 'rgba(184,134,11,0.03)',
                border:     '1px dashed rgba(184,134,11,0.15)',
                overflow:   'visible',
              }}
            >
              {scatteredCoins.map(coin => (
                <div
                  key={coin.id}
                  onMouseDown={(e) => handleCoinMouseDown(coin.id, e)}
                  onTouchStart={(e) => handleCoinTouchStart(coin.id, e)}
                  style={{
                    position:   'absolute' as const,
                    left:       `calc(50% + ${coin.x}px)`,
                    top:        `calc(50% + ${coin.y}px)`,
                    transform:  'translate(-50%, -50%)',
                    cursor:     dragging === coin.id ? 'grabbing' : 'grab',
                    opacity:    dragging === coin.id ? 0 : 1,
                    transition: dragging === coin.id ? 'none' : 'opacity 0.1s',
                    touchAction: 'none',
                  }}
                >
                  <div style={{
                    width:        '32px',
                    height:       '32px',
                    borderRadius: '50%',
                    background:   'radial-gradient(circle at 30% 30%, #D4AF37, #B8860B)',
                    border:       '2px solid rgba(184,134,11,0.8)',
                    boxShadow:    'inset -2px -2px 4px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.4)',
                  }} />
                </div>
              ))}
            </div>

            {/* Drag ghost */}
            {dragging && dragPos && (
              <div style={{
                position:      'absolute' as const,
                left:          dragPos.x,
                top:           dragPos.y,
                transform:     'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex:        100,
              }}>
                <div style={{
                  width:        '32px',
                  height:       '32px',
                  borderRadius: '50%',
                  background:   'radial-gradient(circle at 30% 30%, #D4AF37, #B8860B)',
                  border:       '2px solid rgba(184,134,11,0.9)',
                  boxShadow:    'inset -2px -2px 4px rgba(0,0,0,0.5), 0 6px 14px rgba(0,0,0,0.5)',
                  transform:    'scale(1.15)',
                }} />
              </div>
            )}

            {wagerCoins.length > 0 && (
              <button onClick={handleDeal} style={{ ...BTN_PRIMARY, marginTop: '14px', width: '100%' }}>
                Deal
              </button>
            )}
          </div>
        )}

        {/* Playing actions */}
        {isPlaying && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {availableActions.hit       && <button onClick={handleHit}       style={BTN_PRIMARY}>Hit</button>}
            {availableActions.stand     && <button onClick={handleStand}     style={BTN_GHOST}>Stand</button>}
            {availableActions.double    && <button onClick={handleDouble}    style={BTN_GHOST}>Double</button>}
            {availableActions.surrender && <button onClick={handleSurrender} style={BTN_GHOST}>Surrender</button>}
          </div>
        )}

        {isDone && !showMorePrompt && (
          <button onClick={handleNewHand} style={{ ...BTN_PRIMARY, width: '100%' }}>
            New Hand
          </button>
        )}

        <div style={THIN_RULE} />

        {/* Karma debt ledger */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
            <p style={{ ...MUTED_TEXT, margin: 0, textShadow: '0 0 8px rgba(184,134,11,0.40)' }}>Karma Debt Due</p>
            <span style={{
              fontFamily:    "'IBM Plex Mono', monospace",
              fontSize:      '18px',
              fontWeight:    700,
              letterSpacing: '0.04em',
              color:         karmaDue > 0 ? '#CF6679' : karmaDue < 0 ? '#4CAF50' : '#A9A9A9',
              textShadow:    karmaDue > 0 ? '0 0 12px rgba(207,102,121,0.50)' : karmaDue < 0 ? '0 0 12px rgba(76,175,80,0.50)' : 'none',
            }}>
              {karmaDue > 0 ? '+' : ''}{karmaDue} pts
            </span>
          </div>

          {gameLog.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
              {gameLog.map((entry, i) => (
                <p key={i} style={{
                  fontFamily:    "'IBM Plex Mono', monospace",
                  fontSize:      '9px',
                  color:         i === 0 ? 'rgba(245,241,232,0.55)' : 'rgba(245,241,232,0.22)',
                  margin:        0,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                }}>
                  {entry}
                </p>
              ))}
            </div>
          )}

          {karmaDue !== 0 && (
            <button
              onClick={() => setUi(prev => ({ ...prev, karmaDue: 0, gameLog: [] }))}
              style={{ ...BTN_GHOST, fontSize: '9px' }}
            >
              Forgive Debt
            </button>
          )}
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

const THIN_RULE: React.CSSProperties = {
  borderBottom: '1px solid rgba(184,134,11,0.08)',
}

const MUTED_TEXT: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono', monospace",
  fontSize:      '10px',
  color:         'rgba(245,241,232,0.45)',
  letterSpacing: '0.10em',
  textTransform: 'uppercase' as const,
}

const CARD_CHIP: React.CSSProperties = {
  fontFamily:     "'IBM Plex Mono', monospace",
  fontSize:       '32px',
  fontWeight:     700,
  background:     'linear-gradient(135deg, rgba(245,241,232,0.95) 0%, rgba(220,210,190,0.95) 100%)',
  border:         '2px solid rgba(184,134,11,0.40)',
  padding:        '8px 6px',
  minWidth:       '56px',
  width:          '56px',
  height:         '88px',
  textAlign:      'center' as const,
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  letterSpacing:  '0.02em',
  borderRadius:   '4px',
  boxShadow:      'inset 0 1px 2px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.3)',
  flexShrink:     0,
}

const VALUE_BADGE: React.CSSProperties = {
  fontFamily:    "'IBM Plex Mono', monospace",
  fontSize:      '12px',
  color:         'rgba(245,241,232,0.40)',
  letterSpacing: '0.06em',
}

const PLACEHOLDER: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize:   '14px',
  color:      'rgba(245,241,232,0.18)',
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
  color:         'rgba(245,241,232,0.55)',
  background:    'transparent',
  border:        '1px solid rgba(184,134,11,0.25)',
  padding:       '9px 16px',
  cursor:        'pointer',
}
