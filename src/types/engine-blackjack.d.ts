declare module 'engine-blackjack' {
  export interface BJCard {
    text:  string
    suite: string
    value: number
    color: 'R' | 'B'
  }

  export interface HandInfo {
    cards:                BJCard[]
    playerValue:          { hi: number; lo: number }
    playerHasBlackjack:   boolean
    playerHasBusted:      boolean
    playerHasSurrendered: boolean
    close:                boolean
    availableActions:     Record<string, boolean>
    bet:                  number
  }

  export interface GameState {
    stage:              string
    initialBet:         number
    finalBet:           number
    finalWin:           number
    wonOnRight:         number
    wonOnLeft:          number
    dealerCards:        BJCard[]
    dealerValue?:       { hi: number; lo: number }
    dealerHasBusted:    boolean
    dealerHasBlackjack: boolean
    handInfo:           { left: Partial<HandInfo>; right: Partial<HandInfo> }
    hits:               number
    deck:               BJCard[]
  }

  export interface Action {
    type:     string
    payload?: Record<string, unknown>
  }

  export const actions: {
    deal:      (opts?: { bet?: number }) => Action
    hit:       (opts?: { position?: string }) => Action
    stand:     (opts?: { position?: string }) => Action
    double:    (opts?: { position?: string }) => Action
    split:     () => Action
    insurance: (opts?: { bet?: number }) => Action
    surrender: () => Action
    showdown:  (opts?: { dealerHoleCardOnly?: boolean }) => Action
    dealerHit: (opts?: { dealerHoleCard?: BJCard }) => Action
    restore:   () => Action
    invalid:   (action: Action, info: string) => Action
  }

  export class Game {
    getState():              GameState
    setState(s: Partial<GameState>): void
    dispatch(action: Action): GameState
  }

  export const engine: Record<string, (...args: unknown[]) => unknown>
  export const constants: Record<string, string>
  export const presets:   Record<string, unknown>
}
