'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'

// --- TYPES & INTERFACES ---

interface Card {
  suit: string
  rank: string
  hidden?: boolean
  value?: number
  text?: string
}

interface CoinData {
  id: string
  type: 'copper' | 'silver' | 'gold'
  value: number
  x: number
  y: number
  originBox: 'wallet' | 'wager' | 'sigil213' | 'sigilPairs' | 'sigilBuster'
}

interface GameState {
  game: any
  stage: 'ready' | 'players-turn' | 'done' | 'loading'
  dealerCards: Card[]
  playerHands: Card[][]
  dealerValue: number
  pouchValue: number
  initialWager: number
  debt: number
  dialogue: string
  sideBets: {
    '213': number
    'pairs': number
    'buster': number
  }
}

// --- ENGINE LOADER ---

let Game: any = null
let actions: any = null

const loadEngine = async () => {
  if (typeof window !== 'undefined' && !Game) {
    try {
      const module = await import('blackjack-engine')
      Game = module.Game
      actions = module.actions
    } catch (error) {
      console.error('Failed to load blackjack-engine:', error)
    }
  }
}

// --- UTILS ---

const generateInitialCoins = (): CoinData[] => {
  const coins: CoinData[] = []
  for (let i = 0; i < 4; i++) coins.push({ id: `g-${i}`, type: 'gold', value: 10, x: Math.random() * 60 + 20, y: Math.random() * 60 + 20, originBox: 'wallet' })
  for (let i = 0; i < 4; i++) coins.push({ id: `s-${i}`, type: 'silver', value: 2, x: Math.random() * 60 + 20, y: Math.random() * 60 + 20, originBox: 'wallet' })
  for (let i = 0; i < 2; i++) coins.push({ id: `c-${i}`, type: 'copper', value: 1, x: Math.random() * 60 + 20, y: Math.random() * 60 + 20, originBox: 'wallet' })
  return coins
}

// --- COMPONENTS ---

const Teletype = ({ text, speed = 40 }: { text?: string, speed?: number }) => {
  const [displayed, setDisplayed] = useState('')
  const safeText = text || "The void awaits..."

  useEffect(() => {
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      if (safeText[i]) {
        setDisplayed((prev) => prev + safeText[i])
        i++
      }
      if (i >= safeText.length) clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [safeText, speed])

  return <span className="font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">{displayed}</span>
}

const BlackjackCard = ({ suit, rank, hidden }: Card) => {
  const suitSymbols: Record<string, { symbol: string; color: string }> = {
    hearts: { symbol: '♥', color: '#ef4444' },
    diamonds: { symbol: '♦', color: '#ef4444' },
    spades: { symbol: '♠', color: '#f5f1e8' },
    clubs: { symbol: '♣', color: '#f5f1e8' },
  }

  const normalizedSuit = suit ? suit.toLowerCase().replace(/s$/, '') : 'spades'
  const normalizedRank = rank?.toUpperCase() || 'A'
  const suitInfo = suitSymbols[normalizedSuit] || suitSymbols.spades

  return (
    <motion.div
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      className="relative w-16 h-24 m-1 preserve-3d"
    >
      <div className={`absolute inset-0 rounded-md border-2 border-amber-600/50 bg-[#1A1A2E] shadow-xl flex flex-col p-1 ${hidden ? 'hidden' : ''}`}>
        <div className="text-[10px] font-bold leading-none">{normalizedRank}</div>
        <div className="text-[8px]" style={{ color: suitInfo.color }}>{suitInfo.symbol}</div>
        <div className="flex-1 flex items-center justify-center text-3xl" style={{ color: suitInfo.color }}>
          {suitInfo.symbol}
        </div>
        <div className="text-[10px] font-bold leading-none self-end rotate-180">{normalizedRank}</div>
        <div className="text-[8px] self-end rotate-180" style={{ color: suitInfo.color }}>{suitInfo.symbol}</div>
      </div>
      {hidden && (
        <div className="absolute inset-0 rounded-md border-2 border-amber-600/50 bg-[#0B0820] flex items-center justify-center overflow-hidden">
          <div className="w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,#B8860B_1px,transparent_1px)] bg-[length:8px_8px]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-amber-600/30 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border border-amber-600/10" />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

const OccultSigil = ({ name, icon }: { name: string; icon: string }) => {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 4, repeat: Infinity }}
      className="flex flex-col items-center justify-center space-y-1"
    >
      <div className="text-2xl">{icon}</div>
      <span className="text-[10px] text-amber-700 uppercase font-bold">{name}</span>
    </motion.div>
  )
}

const Coin = ({ data, onDrop, containerRef }: { data: CoinData, onDrop: (id: string, box: { x: number, y: number }) => void, containerRef: React.RefObject<HTMLDivElement> }) => {
  const colors = {
    copper: 'from-orange-700 to-orange-900 border-orange-400',
    silver: 'from-slate-400 to-slate-600 border-slate-200',
    gold: 'from-amber-400 to-amber-600 border-amber-200'
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(e, info) => onDrop(data.id, { x: info.point.x, y: info.point.y })}
      initial={{ x: data.x, y: data.y }}
      animate={{ x: data.x, y: data.y }}
      className={`absolute w-8 h-8 rounded-full border shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center bg-gradient-to-br ${colors[data.type]} select-none touch-none coin-glow`}
      style={{ zIndex: 50, touchAction: 'none' }}
    >
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="w-6 h-6 rounded-full border border-white/20"
      />
      <span className="absolute text-[8px] font-bold text-white/80">{data.value}</span>
    </motion.div>
  )
}

// --- MAIN COMPONENT ---

export const BlackjackModule = () => {
  const [coins, setCoins] = useState<CoinData[]>(generateInitialCoins())
  const [gameState, setGameState] = useState<GameState>({
    game: null,
    stage: 'loading',
    dealerCards: [],
    playerHands: [[]],
    dealerValue: 0,
    pouchValue: 50,
    initialWager: 0,
    debt: 0,
    dialogue: "Looks like someone left their coins behind...",
    sideBets: { '213': 0, 'pairs': 0, 'buster': 0 }
  })

  const boxesRef = useRef<Record<string, HTMLDivElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      await loadEngine()
      if (Game) {
        const game = new Game()
        setGameState(prev => ({ ...prev, game, stage: 'ready' }))
      }
    }
    init()
  }, [])

  const totals = useMemo(() => {
    let wallet = 0, wager = 0, side = 0
    coins.forEach(c => {
      if (c.originBox === 'wallet') wallet += c.value
      else if (c.originBox === 'wager') wager += c.value
      else if (c.originBox.startsWith('sigil')) side += c.value
    })
    return { wallet, wager, side }
  }, [coins])

  const handleDrop = (id: string, point: { x: number, y: number }) => {
    let boxKey: string | null = null
    for (const [key, ref] of Object.entries(boxesRef.current)) {
      if (!ref) continue
      const b = ref.getBoundingClientRect()
      if (point.x >= b.left && point.x <= b.right && point.y >= b.top && point.y <= b.bottom) {
        boxKey = key
        break
      }
    }

    if (boxKey) {
      const b = boxesRef.current[boxKey]!.getBoundingClientRect()
      const coin = coins.find(c => c.id === id)
      if (!coin) return

      setCoins(prev => prev.map(c =>
        c.id === id
          ? { ...c, originBox: boxKey as any, x: point.x - b.left - 16, y: point.y - b.top - 16 }
          : c
      ))

      if (boxKey.startsWith('sigil')) {
        const dialogueMap: Record<string, string> = {
          'sigil213': "A poker hand in the cards? Risky... but the 21+3 pays well if the stars align.",
          'sigilPairs': "Perfect pairs, perfect symmetry. A duplicate fate awaits.",
          'sigilBuster': "You bet on my failure? How rude. But if I bust, you feast."
        }
        setGameState(prev => ({ ...prev, dialogue: dialogueMap[boxKey!] || prev.dialogue }))
      }
    } else {
      // Ghostly return animation
      const coin = coins.find(c => c.id === id)
      if (coin) {
        setGameState(prev => ({ ...prev, dialogue: "The void rejects your offering. It returns to its source." }))
        setCoins(prev => prev.map(c =>
          c.id === id
            ? { ...c, x: coin.x, y: coin.y }
            : c
        ))
      }
    }
  }

  const handlePayout = (amount: number) => {
    let rem = Math.floor(amount)
    const newCoins: CoinData[] = []
    const ts = Date.now()

    const add = (type: 'gold' | 'silver' | 'copper', val: number) => {
      const count = Math.floor(rem / val)
      rem %= val
      for (let i = 0; i < count; i++) {
        newCoins.push({
          id: `w-${ts}-${type}-${i}`,
          type,
          value: val,
          x: Math.random() * 60 + 20,
          y: Math.random() * 60 + 20,
          originBox: 'wallet'
        })
      }
    }

    add('gold', 10)
    add('silver', 2)
    add('copper', 1)
    setCoins(prev => [...prev.filter(c => c.originBox === 'wallet'), ...newCoins])
  }

  const handleDeal = () => {
    if (totals.wager === 0) {
      setGameState(prev => ({ ...prev, dialogue: "No coin, no cards. The Altar demands a sacrifice." }))
      return
    }
    const game = gameState.game
    game.dispatch(actions.bet({ bet: totals.wager, playerId: 0 }))
    game.dispatch(actions.dealCards())
    const s = game.getState()
    setGameState(prev => ({
      ...prev,
      stage: 'players-turn',
      dealerCards: s.dealerCards || [],
      playerHands: s.players?.[0]?.hands?.map((h: any) => h.cards) || [[]],
      initialWager: totals.wager,
      dialogue: "The cards are cast. What will you do, seeker?"
    }))
  }

  const handleAction = (act: string) => {
    if ((act === 'double' || act === 'split') && totals.wager < gameState.initialWager * 2) {
      setGameState(prev => ({
        ...prev,
        dialogue: `The stakes must be doubled (${gameState.initialWager * 2}). Drag more coins, seeker.`
      }))
      return
    }

    const game = gameState.game
    game.dispatch((actions as any)[act]())
    const s = game.getState()
    const isDone = s.stage.name === 'STAGE_DONE' || s.stage.name === 'STAGE_SHOWDOWN'

    setGameState(prev => {
      const ns = {
        ...prev,
        stage: (isDone ? 'done' : 'players-turn') as any,
        dealerCards: s.dealerCards || [],
        playerHands: s.players?.[0]?.hands?.map((h: any) => h.cards) || [[]],
        dialogue: isDone ? "The hand is closed. The void settles." : prev.dialogue
      }

      if (isDone) {
        const hand = s.players?.[0]?.hands?.[0]
        if (hand && !hand.playerHasBusted) {
          const dv = s.dealerValue?.hi || 0
          const pv = hand.playerValue?.hi || 0
          if (dv > 21 || pv > dv) {
            setTimeout(() => handlePayout(totals.wager * 2), 1000)
            ns.dialogue = "Fortune smiles. Take your winnings."
          } else if (pv === dv) {
            setTimeout(() => handlePayout(totals.wager), 1000)
            ns.dialogue = "A draw. Balance restored."
          } else {
            ns.dialogue = "The house claims its due."
            setCoins(c => c.filter(x => x.originBox === 'wallet'))
          }
        } else {
          ns.dialogue = "Busted. The void is hungry."
          setCoins(c => c.filter(x => x.originBox === 'wallet'))
        }
      }
      return ns
    })
  }

  const handleReplenish = () => {
    setCoins(prev => [...prev, ...generateInitialCoins()])
    setGameState(prev => ({ ...prev, debt: prev.debt + 50, dialogue: "A small debt for another chance..." }))
  }

  const handleForgive = () => {
    setGameState(prev => ({ ...prev, debt: 0, dialogue: "Karmic debt forgiven. The slate is clean." }))
  }

  if (gameState.stage === 'loading') {
    return (
      <div className="h-full flex items-center justify-center text-amber-500 font-mono bg-[#0B0820]">
        Invoking the Alchemist...
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="bj-triptych-container relative w-full bg-[#0B0820] text-[#F5F1E8] font-mono select-none overflow-hidden"
      style={{ height: '800px' }}
    >

      {/* SEGMENT 1: THE VOID (25%) */}
      <div
        className="absolute top-0 left-0 right-0 border-b border-amber-900/30 flex flex-col items-center justify-center p-4 bg-[#050410]"
        style={{ height: '25%' }}
      >
        <div className="absolute top-2 left-4 text-[10px] uppercase text-amber-600/50 font-bold">The Void</div>
        <div className="h-12 flex items-center mb-4 text-center px-8 max-w-2xl">
          <Teletype text={gameState.dialogue} speed={40} />
        </div>
        <div className="flex space-x-2 flex-wrap justify-center">
          {gameState.dealerCards.map((c, i) => (
            <BlackjackCard
              key={i}
              {...c}
              hidden={gameState.stage === 'players-turn' && i === 1}
            />
          ))}
        </div>
      </div>

      {/* SEGMENT 2: THE ALTAR (40%) */}
      <div
        className="absolute left-0 right-0 border-b border-amber-900/30 flex bg-[#0B0820] relative"
        style={{ top: '25%', height: '40%' }}
      >
        <div className="absolute top-2 left-4 text-[10px] uppercase text-amber-600/50 font-bold z-10">The Altar</div>

        {/* Sigils Section */}
        <div className="w-1/5 border-r border-amber-900/20 flex flex-col p-3 space-y-2 justify-center">
          <div
            key="sigil213"
            ref={el => { boxesRef.current['sigil213'] = el }}
            className="flex-1 border border-amber-900/40 rounded bg-black/40 relative overflow-hidden flex items-center justify-center hover:border-amber-700/60 transition-colors"
          >
            <OccultSigil name="21+3" icon="👁️" />
            {coins.filter(c => c.originBox === 'sigil213').map(c => (
              <Coin key={c.id} data={c} onDrop={handleDrop} containerRef={containerRef} />
            ))}
          </div>

          <div
            key="sigilPairs"
            ref={el => { boxesRef.current['sigilPairs'] = el }}
            className="flex-1 border border-amber-900/40 rounded bg-black/40 relative overflow-hidden flex items-center justify-center hover:border-amber-700/60 transition-colors"
          >
            <OccultSigil name="Pairs" icon="🌙" />
            {coins.filter(c => c.originBox === 'sigilPairs').map(c => (
              <Coin key={c.id} data={c} onDrop={handleDrop} containerRef={containerRef} />
            ))}
          </div>

          <div
            key="sigilBuster"
            ref={el => { boxesRef.current['sigilBuster'] = el }}
            className="flex-1 border border-amber-900/40 rounded bg-black/40 relative overflow-hidden flex items-center justify-center hover:border-amber-700/60 transition-colors"
          >
            <OccultSigil name="Buster" icon="⏳" />
            {coins.filter(c => c.originBox === 'sigilBuster').map(c => (
              <Coin key={c.id} data={c} onDrop={handleDrop} containerRef={containerRef} />
            ))}
          </div>
        </div>

        {/* Player Hand Section */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex gap-4 flex-wrap justify-center">
            {gameState.playerHands.map((h, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex space-x-1 flex-wrap justify-center">
                  {h.map((c, j) => (
                    <BlackjackCard key={j} {...c} />
                  ))}
                </div>
                {h.length > 0 && (
                  <div className="text-[11px] text-amber-400 mt-2 font-bold">
                    Value: {h.reduce((acc, c) => acc + (c.value || 0), 0)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEGMENT 3: THE TREASURY (35%) */}
      <div
        className="absolute left-0 right-0 bottom-0 flex p-4 bg-[#050410] relative"
        style={{ height: '35%' }}
      >
        <div className="absolute top-2 left-4 text-[10px] uppercase text-amber-600/50 font-bold">The Treasury</div>

        {/* Wallet Box */}
        <div className="w-2/5 flex flex-col pr-4">
          <div className="text-[11px] text-amber-600 mb-2 font-bold">WALLET ({totals.wallet})</div>
          <div
            ref={el => { boxesRef.current.wallet = el }}
            className="flex-1 border border-amber-900/40 bg-black/20 rounded relative overflow-hidden"
          >
            {coins.filter(c => c.originBox === 'wallet').map(c => (
              <Coin key={c.id} data={c} onDrop={handleDrop} containerRef={containerRef} />
            ))}
            {totals.wallet === 0 && totals.wager === 0 && (
              <button
                onClick={handleReplenish}
                className="absolute inset-0 text-[11px] text-amber-500 hover:text-amber-400 font-bold hover:bg-amber-900/10 transition-colors w-full h-full flex items-center justify-center"
              >
                More?
              </button>
            )}
          </div>
        </div>

        {/* Control Center */}
        <div className="w-1/5 flex flex-col items-center justify-center space-y-3 px-2">
          {gameState.stage === 'ready' && (
            <button
              onClick={handleDeal}
              className="px-6 py-2 border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-black uppercase text-xs font-bold rounded transition-colors"
            >
              Deal
            </button>
          )}

          {gameState.stage === 'players-turn' && (
            <div className="flex flex-col space-y-2">
              {['hit', 'stand', 'double'].map(a => (
                <button
                  key={a}
                  onClick={() => handleAction(a)}
                  className="px-3 py-1 border border-amber-500/50 text-amber-500 text-[10px] uppercase hover:bg-amber-500/10 rounded transition-colors"
                >
                  {a}
                </button>
              ))}
            </div>
          )}

          {gameState.stage === 'done' && (
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 border border-amber-600/50 text-amber-600 text-xs rounded hover:border-amber-600 transition-colors"
            >
              Reset
            </button>
          )}

          {gameState.debt > 0 && (
            <div className="flex flex-col items-center space-y-2">
              <div className="text-[10px] text-red-500/60 font-bold">Debt: {gameState.debt}</div>
              <button
                onClick={handleForgive}
                className="text-[8px] text-amber-900 uppercase hover:text-amber-700 font-bold transition-colors"
              >
                Forgive
              </button>
            </div>
          )}
        </div>

        {/* Wager Box */}
        <div className="w-2/5 flex flex-col pl-4">
          <div className="text-[11px] text-amber-600 mb-2 font-bold text-right">WAGER ({totals.wager})</div>
          <div
            ref={el => { boxesRef.current.wager = el }}
            className="flex-1 border border-amber-900/40 bg-black/20 rounded relative overflow-hidden"
          >
            {coins.filter(c => c.originBox === 'wager').map(c => (
              <Coin key={c.id} data={c} onDrop={handleDrop} containerRef={containerRef} />
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .bj-triptych-container {
          position: relative;
          overflow: hidden;
        }

        .preserve-3d {
          transform-style: preserve-3d;
        }

        .coin-glow {
          animation: glow 3s infinite ease-in-out;
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(184, 134, 11, 0.2), inset 0 0 8px rgba(184, 134, 11, 0.1);
          }
          50% {
            box-shadow: 0 0 15px rgba(184, 134, 11, 0.5), inset 0 0 12px rgba(184, 134, 11, 0.2);
          }
        }

        /* Touch action for mobile stability */
        @supports (touch-action: none) {
          .coin-glow {
            touch-action: none;
          }
        }
      `}</style>
    </div>
  )
}
