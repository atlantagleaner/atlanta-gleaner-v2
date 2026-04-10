'use client'

import { useReducer, useEffect, useState } from 'react'
import { BlackjackCard } from './BlackjackCard'
import './BlackjackModule.css'

let Game: any = null
let actions: any = null

// Lazy load the blackjack-engine library
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

interface GameState {
  game: any
  stage: string
  dealerCards: any[]
  playerHands: any[][]
  dealerValue: number
  result: string | null
  betPlaced: boolean
}

type GameAction =
  | { type: 'INIT_GAME'; payload: any }
  | { type: 'DISPATCH_ACTION'; payload: any }
  | { type: 'SET_STAGE'; payload: string }
  | { type: 'RESET_GAME' }

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'INIT_GAME': {
      return { ...state, game: action.payload, stage: 'ready' }
    }
    case 'DISPATCH_ACTION': {
      const game = state.game
      game.dispatch(action.payload)
      const gameState = game.getState()
      
      // Map engine stages (STAGE_READY, STAGE_PLAYERS_TURN, etc.) to component stages
      const engineStage = gameState.stage.name || ''
      let stage = 'ready'
      if (engineStage === 'STAGE_PLAYERS_TURN') stage = 'players-turn'
      if (engineStage === 'STAGE_DONE' || engineStage === 'STAGE_SHOWDOWN') stage = 'done'
      if (engineStage === 'STAGE_READY') stage = 'ready'

      // Extract dealer cards
      const dealerCards = gameState.dealerCards || []
      
      // Extract player hands from the first player
      const playerHands = (gameState.players && gameState.players[0]?.hands) 
        ? gameState.players[0].hands.map((h: any) => h.cards) 
        : [[]]

      // Extract dealer value
      const dealerValue = gameState.dealerValue?.hi || 0

      return {
        ...state,
        stage,
        dealerCards,
        playerHands,
        dealerValue,
        game,
      }
    }
    case 'SET_STAGE': {
      return { ...state, stage: action.payload }
    }
    case 'RESET_GAME': {
      const newGame = new Game()
      return {
        game: newGame,
        stage: 'ready',
        dealerCards: [],
        playerHands: [[]],
        dealerValue: 0,
        result: null,
        betPlaced: false,
      }
    }
    default:
      return state
  }
}

export function BlackjackModule() {
  const [engineLoaded, setEngineLoaded] = useState(false)
  const [state, dispatch] = useReducer(gameReducer, {
    game: null,
    stage: 'ready',
    dealerCards: [],
    playerHands: [[]],
    dealerValue: 0,
    result: null,
    betPlaced: false,
  })

  useEffect(() => {
    const initEngine = async () => {
      await loadEngine()
      if (Game) {
        try {
          const game = new Game()
          dispatch({ type: 'INIT_GAME', payload: game })
          setEngineLoaded(true)
        } catch (error) {
          console.error('Failed to initialize game:', error)
        }
      }
    }
    initEngine()
  }, [])

  if (!state.game) {
    return (
      <div className="bj-container">
        <div className="bj-loading">Initializing...</div>
      </div>
    )
  }

  const handleDeal = () => {
    if (!actions) {
      console.error('Actions not loaded yet')
      return
    }
    // Engine actions expect specific object structures
    dispatch({ type: 'DISPATCH_ACTION', payload: actions.bet({ bet: 10, playerId: 0 }) })
    dispatch({ type: 'DISPATCH_ACTION', payload: actions.dealCards() })
  }

  const handleHit = () => {
    if (!actions) return
    dispatch({ type: 'DISPATCH_ACTION', payload: actions.hit() })
  }

  const handleStand = () => {
    if (!actions) return
    dispatch({ type: 'DISPATCH_ACTION', payload: actions.stand() })
  }

  const handleDouble = () => {
    if (!actions) return
    dispatch({ type: 'DISPATCH_ACTION', payload: actions.double() })
  }

  const handleSplit = () => {
    if (!actions) return
    dispatch({ type: 'DISPATCH_ACTION', payload: actions.split() })
  }

  const handleSurrender = () => {
    if (!actions) return
    dispatch({ type: 'DISPATCH_ACTION', payload: actions.surrender() })
  }

  const handleNewGame = () => {
    dispatch({ type: 'RESET_GAME' })
  }

  const gameState = state.game.getState()
  const isPlayerTurn = state.stage === 'players-turn'
  const isDone = state.stage === 'done'
  const isReady = state.stage === 'ready'

  // Calculate hand values for display using engine logic
  const getHandValue = (cards: any[]) => {
    if (!cards || cards.length === 0) return 0
    let value = 0
    let aces = 0

    for (const card of cards) {
      // engine uses .value or .text
      const rankValue = card.value
      if (rankValue === 11 || card.text === 'A') {
        aces++
        value += 11
      } else {
        value += rankValue
      }
    }

    while (value > 21 && aces > 0) {
      value -= 10
      aces--
    }

    return value
  }

  // Get result message
  const getResultMessage = () => {
    // Check first hand result
    const player = gameState.players?.[0]
    const hand = player?.hands?.[0]
    if (!hand) return ''

    if (hand.playerHasBlackjack) return 'Blackjack! Saturn smiles... for now.'
    if (hand.playerHasBusted) return 'Too far. The table claims its due.'
    
    // Simplistic win/loss check if not blackjack/bust
    const dv = gameState.dealerValue?.hi || 0
    const pv = hand.playerValue?.hi || 0
    
    if (dv > 21 || pv > dv) return 'Fortune favors the bold. You win.'
    if (dv > pv) return 'The house holds. As it was written.'
    return 'A standoff. The balance holds... for now.'
  }

  return (
    <div className="bj-container">
      <div className="bj-label">The Bank</div>

      <div className="bj-dealer-zone">
        <div className="bj-zone-label">Dealer</div>
        <div className="bj-cards-row">
          {state.dealerCards.map((card, idx) => {
            const isHidden = state.stage === 'players-turn' && idx === 1
            const suit = card.suite?.toLowerCase() || 'spades'
            const rank = card.text || 'A'
            return (
              <BlackjackCard
                key={idx}
                suit={suit}
                rank={rank}
                hidden={isHidden}
              />
            )
          })}
        </div>
        {(isDone) && state.dealerCards.length > 0 && (
          <div className="bj-hand-value">Dealer: {state.dealerValue}</div>
        )}
      </div>

      <div className="bj-player-zone">
        <div className="bj-zone-label">Player</div>
        {state.playerHands.map((hand, handIdx) => (
          <div key={handIdx} className="bj-hand">
            <div className="bj-cards-row">
              {hand.map((card: any, cardIdx: number) => (
                <BlackjackCard
                  key={cardIdx}
                  suit={card.suite?.toLowerCase() || 'spades'}
                  rank={card.text || 'A'}
                />
              ))}
            </div>
            <div className="bj-hand-value">
              {hand.length > 0 ? `Value: ${getHandValue(hand)}` : ''}
            </div>
          </div>
        ))}
      </div>

      {isDone && <div className="bj-result">{getResultMessage()}</div>}

      {isPlayerTurn && (
        <div className="bj-action-buttons">
          <button className="bj-btn bj-btn-primary" onClick={handleHit}>
            Hit
          </button>
          <button className="bj-btn bj-btn-primary" onClick={handleStand}>
            Stand
          </button>
          {/* Engine state might have different property names for available actions */}
          <button className="bj-btn bj-btn-primary" onClick={handleDouble}>
            Double
          </button>
          <button className="bj-btn bj-btn-ghost" onClick={handleSurrender}>
            Surrender
          </button>
        </div>
      )}

      {(isReady || isDone) && (
        <div className="bj-deal-bar">
          <button className="bj-deal-button" onClick={isReady ? handleDeal : handleNewGame}>
            {isReady ? 'Deal' : 'New Game'}
          </button>
        </div>
      )}
    </div>
  )
}
