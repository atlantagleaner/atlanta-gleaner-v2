'use client'

import React, { useState, useEffect } from 'react'

// --- Assets & Icons ---
const SuitIcon = ({ suit }: { suit: string }) => {
  const icons: Record<string, React.ReactNode> = {
    '♠': <path d="M12 2L4 12c0 3 3 4 8 10 5-6 8-7 8-10L12 2z" fill="currentColor" />,
    '♥': <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />,
    '♦': <path d="M12 2L2 12l10 10 10-10L12 2z" fill="currentColor" />,
    '♣': <path d="M12 2a4 4 0 00-4 4c0 1.5.8 2.8 2 3.5-1.2.7-2 2-2 3.5 0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.5-.8-2.8-2-3.5 1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4z" fill="currentColor" />
  }
  return <svg viewBox="0 0 24 24" className="w-8 h-8">{icons[suit]}</svg>
}

interface Card {
  r: string
  s: string
  v: number
}

export function BlackjackModule() {
  // Game State
  const [gold, setGold] = useState(300)
  const [debt, setDebt] = useState(0)
  const [wager, setWager] = useState(0)
  const [insuranceWager, setInsuranceWager] = useState(0)
  const [deck, setDeck] = useState<Card[]>([])
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isOfferingInsurance, setIsOfferingInsurance] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [dialogue, setDialogue] = useState("How about a game?")
  const [showDebtPrompt, setShowDebtPrompt] = useState(false)

  // The Soul Stakes Dialogue Bank
  const soulStakesQuotes = [
    "What is another word for the void?",
    "If this hand fails you, remember that some descents are designed without the possibility of a parachute.",
    "My broken mirror yielded seven years of misfortune, though my advocate is negotiating for a shorter sentence in the dark.",
    "Infinity makes every destination a local one, provided you have surrendered your clock to the House.",
    "The past is a memory that feeds on the living until there is nothing left to remember.",
    "The monopoly of the grave is absolute; there is only one House and it always wins.",
    "If the black box is indestructible, perhaps we should construct our coffins from the same tragedy.",
    "A clear conscience is merely a side effect of a mind that has successfully forgotten its sins.",
    "I possess dehydrated water, but I lack the vital fluid to make it flow.",
    "The tomb is always room temperature, provided you are the room.",
    "I deal the cards far too quickly to worry about the expiration of your pulse.",
    "For those who believe in possession, please use your will to raise my hand.",
    "My home has a switch that controls nothing but the flickering of a dying man's eyes.",
    "I have a microwave furnace that can incinerate a legacy in under two minutes.",
    "I bought a residence on a one-way dead-end road; the geography of the end is quite simple.",
    "I am not afraid of the depth of the grave, only the suffocating width of the lid.",
    "We are 98% water, which makes the human body a very inefficient vessel for a fire.",
    "I find it curious that we worry about the speed of the car when the destination is always a standstill.",
    "My microwave fireplace provides the warmth of a lifetime in the span of a single breath.",
    "I bought a pair of shoes that make me walk like a man who has already been buried.",
    "The general store had no specifics, much like the afterlife.",
    "If you fail to succeed at breathing, the rest of your hobbies become irrelevant.",
    "I have a skylight in my basement; the people upstairs find it very distracting when I look up.",
    "I have a collection of heads; they don't say much, but they listen with great intensity.",
    "If you think of the past, make sure the past isn't thinking of you.",
    "I have a phone that only rings when someone is about to stop breathing.",
    "I find that everything is within walking distance if you are being pursued.",
    "The 'Go to Jail' card is the most honest piece of cardboard in the world.",
    "Why buy a toy train when you can simply wait for the real one to take you away?",
    "I have a light switch that toggles the stars.",
    "I bought some instant dust; I'm just waiting for the right breeze.",
    "The room is room temperature, but the body is cooling rapidly.",
    "I have a camera that only takes pictures of what will happen tomorrow.",
    "If you are born by C-section, you spend your life looking for the window.",
    "Why do they call it a 'living room' when you're clearly dying in it?",
    "The black box is the only thing that remembers the screaming.",
    "I have a collection of keys that don't fit any doors in this world.",
    "I once tried to catch a thought, but it died of exposure.",
    "The microwave fireplace is a marvel of modern morbidity.",
    "I have a mirror that shows me the person standing behind you.",
    "The House always wins because the House is the only thing that doesn't breathe.",
    "The silence in this room is structural; if you were to scream, the ceiling would likely collapse.",
    "I possess a map of your central nervous system, and I noticed several corridors that lead to absolute nothingness.",
    "I have a compass that only points toward the nearest exit, but the needle hasn't moved since the mid-nineteenth century.",
    "Your heartbeat is a rhythmic countdown that I am currently synchronizing with the clock on the wall.",
    "Why use a telescope to observe the stars when you can simply wait for them to finish burning out?",
    "I have a collection of shadows that I have detached from their owners to ensure they don't wander off.",
    "The 'Hit' you are requesting is quite different from the one the House is prepared to deliver.",
    "I once purchased a clinical study on spontaneous combustion, but the data vanished before I could reach the conclusion.",
    "Your pulse is a repetitive argument with the inevitable that you are slowly but surely losing.",
    "I own a camera with no shutter, designed to capture the uninterrupted passage of the end.",
    "The vacuum cleaner in the hallway is remarkably quiet, as it only consumes the static of souls.",
    "I find that the most efficient way to travel is to simply wait for the horizon to move toward you.",
    "My calendar is entirely blank, as I find the concept of 'tomorrow' to be a rather optimistic assumption.",
    "Your skeleton is a highly efficient machine that is currently being held hostage by your skin.",
    "I have a telephone with no dial; it only rings when the House has a specific grievance to air.",
    "The emergency exit in this room is merely a high-resolution photograph of a door.",
    "I find that a person's weight decreases slightly at the moment of loss, as if the gravity of their situation has lifted.",
    "I have a glass of water that is always half-empty, regardless of how much fluid I add.",
    "The light at the end of the tunnel is actually just the reflection of the cards on the table.",
    "Why worry about the afterlife when the current life is so clearly coming to a scheduled halt?",
    "I have a microwave that can freeze time, though it leaves the center of the moment quite cold.",
    "Your signature on the marker is a very elegant way of saying 'I no longer require this.'",
    "I find that the most honest conversations happen when one party is no longer capable of speaking.",
    "I have a collection of echoes; I keep them in jars and listen to them when the silence becomes too loud.",
    "The floorboards in this room are made from the lids of crates that were never intended to be opened again.",
    "I have a light switch that toggles the presence of your hope.",
    "I bought a house with no windows, as I find the outside world to be a distraction from the geometry of the end.",
    "Your breath is a finite resource that the House is currently measuring in milliliters.",
    "I have a clock that only ticks when someone in the room makes a mistake.",
    "I find that the most interesting thing about humans is how they fight to keep a heart destined to stop.",
    "Your cards are a sequence of failures that have been pre-ordained by the physics of the deck.",
    "I have a pen that only writes in the past tense.",
    "The radiator in the corner isn't making noise; it's simply screaming in a frequency you can't hear yet.",
    "I have a mirror that shows you what you will look like in forty-five minutes.",
    "The 'Hit' is the sound of the lid closing on your options.",
    "Why bother with a parachute when the ground is so eager to meet you halfway?",
    "I have a collection of keys that only unlock the things you've already lost.",
    "The House is not a building; it is a mathematical certainty.",
    "I find that the coldness of the room is proportional to the heat of your desperation.",
    "I bought some instant eternity, but I'm still waiting for the first second to pass.",
    "The 'Black Box' of your life is currently recording this dialogue for the investigators.",
    "I find that a clear conscience is often just a symptom of a very efficient incinerator.",
    "I find that the most beautiful color is the one that appears when the lights are turned off permanently.",
    "I have a clock that doesn't measure hours, but the distance between your last two heartbeats.",
    "Your existence is a brief interruption in a very long silence.",
    "I have a collection of breaths; I keep them in a small box under the table.",
    "I find that the most honest expression is the one that remains after the mind has left.",
    "I have a light switch that turns off the sun, but I only use it on special occasions.",
    "Your soul is a very light wager for a game with such heavy consequences.",
    "I bought some powdered time, but I'm not sure what to add to make it move.",
    "The 'Room Temperature' of this tomb is currently dropping to match your expectations.",
    "I have a mirror that only reflects the things you've forgotten about yourself.",
    "I find that the best way to deal with the past is to ensure it has no future.",
    "I find that the House always wins because it is the only thing that doesn't have a heart to lose."
  ]

  const speak = (force = false) => {
    if (!force && Math.random() > 0.45) return
    const q = soulStakesQuotes[Math.floor(Math.random() * soulStakesQuotes.length)]
    setDialogue(q)
  }

  // Game Logic
  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣']
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    let newDeck: Card[] = []
    suits.forEach(s => {
      ranks.forEach(r => {
        let v = isNaN(Number(r)) ? (r === 'A' ? 11 : 10) : parseInt(r)
        newDeck.push({ r, s, v })
      })
    })
    return newDeck.sort(() => Math.random() - 0.5)
  }

  const calculatePoints = (hand: Card[]) => {
    let p = 0
    let a = 0
    hand.forEach(c => {
      if (c.r === 'A') a++
      p += c.v
    })
    while (p > 21 && a > 0) {
      p -= 10
      a--
    }
    return p
  }

  const handleDeal = () => {
    if (wager === 0) return
    const newDeck = createDeck()
    const pHand = [newDeck.pop()!, newDeck.pop()!]
    const dHand = [newDeck.pop()!, newDeck.pop()!]
    setDeck(newDeck)
    setPlayerHand(pHand)
    setDealerHand(dHand)
    setIsPlaying(true)
    setGameOver(false)
    setInsuranceWager(0)

    if (dHand[0].r === 'A') {
      setIsOfferingInsurance(true)
      setDialogue("Protect yourself?")
    } else {
      speak()
      if (calculatePoints(pHand) === 21) handleEnd('win', pHand, dHand)
    }
  }

  const handleInsurance = (buy: boolean) => {
    const cost = Math.floor(wager / 2)
    let currentInsurance = 0
    if (buy && gold >= cost) {
      setGold(prev => prev - cost)
      currentInsurance = cost
      setInsuranceWager(cost)
      setDialogue("Safety secured.")
    } else if (buy) {
      setDialogue("You lack the funds for safety.")
    } else {
      setDialogue("Risky. I like it.")
    }
    setIsOfferingInsurance(false)

    if (calculatePoints(dealerHand) === 21) {
      const pPoints = calculatePoints(playerHand)
      handleEnd(pPoints === 21 ? 'push' : 'loss', playerHand, dealerHand, currentInsurance)
    } else if (buy) {
      setDialogue("Unnecessary expense. Gone.")
      setInsuranceWager(0)
    }
  }

  const handleHit = () => {
    const newDeck = [...deck]
    const card = newDeck.pop()
    if (!card) return
    const newHand = [...playerHand, card]
    setDeck(newDeck)
    setPlayerHand(newHand)
    speak()
    if (calculatePoints(newHand) > 21) handleEnd('loss', newHand, dealerHand)
  }

  const handleStand = () => {
    let dHand = [...dealerHand]
    let currentDeck = [...deck]
    while (calculatePoints(dHand) < 17) {
      const card = currentDeck.pop()
      if (card) dHand.push(card)
    }
    setDealerHand(dHand)
    setDeck(currentDeck)
    const pPoints = calculatePoints(playerHand)
    const dPoints = calculatePoints(dHand)
    if (dPoints > 21 || pPoints > dPoints) handleEnd('win', playerHand, dHand)
    else if (dPoints > pPoints) handleEnd('loss', playerHand, dHand)
    else handleEnd('push', playerHand, dHand)
  }

  const handleEnd = (result: string, pHand: Card[], dHand: Card[], insPayout = 0) => {
    setIsPlaying(false)
    setIsOfferingInsurance(false)
    setGameOver(true)
    let totalWin = 0
    if (result === 'win') totalWin += wager * 2
    else if (result === 'push') totalWin += wager
    if (insPayout > 0 && calculatePoints(dHand) === 21) totalWin += insPayout * 3
    setGold(prev => prev + totalWin)
    setWager(0)
    setInsuranceWager(0)
    speak(true)
  }

  const handleWager = (amt: number) => {
    if (gold >= amt) {
      setGold(prev => prev - amt)
      setWager(prev => prev + amt)
    }
  }

  const handleReplenish = (accept: boolean) => {
    if (accept) {
      setGold(300)
      setDebt(prev => prev + 300)
      setShowDebtPrompt(false)
      setDialogue("The debt grows. Do not falter again.")
    } else setDialogue("Until we meet again.")
  }

  useEffect(() => {
    if (gold < 10 && wager === 0 && !isPlaying) {
      setShowDebtPrompt(true)
      setDialogue("More?")
    }
  }, [gold, wager, isPlaying])

  // Components
  const Card = ({ card, hidden }: { card: Card; hidden?: boolean }) => (
    <div className={`relative w-20 h-28 border-4 border-[#2d1e12] shadow-[6px_6px_0_rgba(0,0,0,0.8)] flex flex-col p-2 font-bold ${hidden ? 'bg-[#3d1d4d] border-[#d4af37]' : 'bg-[#f4ead5] text-[#2d1e12]'}`}>
      {hidden ? (
        <div className="w-full h-full bg-[radial-gradient(#d4af37_10%,transparent_11%)] bg-[length:12px_12px] opacity-40" />
      ) : (
        <>
          <div className="text-xl leading-none font-serif">{card.r}</div>
          <div className={`flex-grow flex items-center justify-center ${['♥', '♦'].includes(card.s) ? 'text-[#8b0000]' : 'text-[#2d1e12]'}`}>
            <SuitIcon suit={card.s} />
          </div>
          <div className="text-xl leading-none self-end rotate-180 font-serif">{card.r}</div>
        </>
      )}
    </div>
  )

  const SnesButton = ({ children, onClick, active, disabled, color = "white", variant = "default" }: { children: React.ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean; color?: string; variant?: string }) => (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative inline-flex items-center justify-center p-1 bg-[#4a4a4a] cursor-pointer transition-transform active:scale-95 ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-105'}`}
    >
      <div
        className={`w-full h-full px-8 py-3 border-2 flex items-center justify-center gap-2 ${variant === 'purple' ? 'bg-[#4a00e0]' : 'bg-[#000]'} ${active ? 'ring-2 ring-white/20' : ''}`}
        style={{
          borderColor: color,
          color: color,
          backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)',
          backgroundSize: '100% 4px'
        }}
      >
        <span className="text-xl font-bold uppercase tracking-[0.15em] font-mono italic">{children}</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a050d] text-[#e0d0b0] p-4 font-mono flex flex-col items-center selection:bg-[#5e2d8a] relative overflow-hidden seance-bg">
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px]" />
      <div className="fixed inset-0 pointer-events-none z-40 flicker-overlay" />

      <div className="w-full max-w-2xl flex flex-col gap-6 z-10 pt-4">
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm opacity-50 tracking-[0.4em] uppercase font-serif italic">The Dispassionate Eye</div>
          <div className="flex gap-4 justify-center min-h-[112px]">
            {dealerHand.map((c, i) => (
              <Card key={i} card={c} hidden={i === 1 && !gameOver} />
            ))}
          </div>
        </div>

        <div className="border-4 border-[#5e2d8a] bg-[#000] p-6 min-h-[140px] flex items-center justify-center text-center relative">
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#5e2d8a] border-2 border-[#d4af37] rotate-45" />
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#5e2d8a] border-2 border-[#d4af37] rotate-45" />
          <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#5e2d8a] border-2 border-[#d4af37] rotate-45" />
          <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#5e2d8a] border-2 border-[#d4af37] rotate-45" />
          <div className="text-2xl italic text-[#c0a0e0] tracking-tight leading-snug font-serif">
            "{dialogue}"
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-4 justify-center min-h-[112px]">
            {playerHand.map((c, i) => (
              <Card key={i} card={c} />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-2xl text-[#d4af37] bg-[#d4af37]/10 px-4 py-1 border-b-2 border-[#d4af37] font-serif">
              {playerHand.length > 0 ? calculatePoints(playerHand) : 0}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 bg-[#1a0f1f]/60 p-6 border-y-2 border-[#5e2d8a]/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6">
            {!showDebtPrompt ? (
              <>
                {!isPlaying ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex gap-6">
                      <div onClick={() => handleWager(100)} className="w-14 h-14 bg-[#d4af37] text-black border-4 border-[#2d1e12] flex items-center justify-center font-bold text-lg cursor-pointer hover:-translate-y-1 transition-transform shadow-[4px_4px_0_rgba(0,0,0,0.8)] font-serif">100</div>
                      <div onClick={() => handleWager(50)} className="w-14 h-14 bg-[#a0a0a0] text-black border-4 border-[#2d1e12] flex items-center justify-center font-bold text-lg cursor-pointer hover:-translate-y-1 transition-transform shadow-[4px_4px_0_rgba(0,0,0,0.8)] font-serif">50</div>
                      <div onClick={() => handleWager(10)} className="w-14 h-14 bg-[#8b4513] text-[#f4ead5] border-4 border-[#2d1e12] flex items-center justify-center font-bold text-lg cursor-pointer hover:-translate-y-1 transition-transform shadow-[4px_4px_0_rgba(0,0,0,0.8)] font-serif">10</div>
                    </div>
                    <div className="flex gap-4">
                      <SnesButton onClick={handleDeal} active disabled={wager === 0} color="#d4af37">Deal</SnesButton>
                    </div>
                  </div>
                ) : isOfferingInsurance ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-xs uppercase opacity-60 tracking-widest font-serif italic">Insurance? (Cost: {Math.floor(wager / 2)})</div>
                    <div className="flex gap-8">
                      <SnesButton onClick={() => handleInsurance(true)} active color="#d4af37">Insurance</SnesButton>
                      <SnesButton onClick={() => handleInsurance(false)} color="#8b0000">No</SnesButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-8">
                    <SnesButton onClick={handleHit} color="#fff" variant="purple">Hit</SnesButton>
                    <SnesButton onClick={handleStand} color="#fff" variant="black">Stand</SnesButton>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-8">
                <SnesButton onClick={() => handleReplenish(true)} active color="#d4af37">Yes</SnesButton>
                <SnesButton onClick={() => handleReplenish(false)} color="#8b0000">No</SnesButton>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="border-2 border-[#d4af37]/30 p-2 flex flex-col items-center bg-black/60 shadow-inner">
              <span className="text-[10px] uppercase text-[#d4af37]/60 font-serif tracking-widest">$$$</span>
              <span className="text-xl text-[#d4af37] font-serif">{gold}</span>
            </div>
            <div className="border-2 border-[#ff4444]/30 p-2 flex flex-col items-center bg-black/60 shadow-inner">
              <span className="text-[10px] uppercase text-[#ff4444] font-serif tracking-widest">Wager</span>
              <span className="text-xl text-[#ff4444] font-serif">{wager + insuranceWager}</span>
            </div>
            <div className="border-2 border-[#5e2d8a]/50 p-2 flex flex-col items-center bg-black/60 shadow-[inset_0_0_15px_rgba(94,45,138,0.3)]">
              <span className="text-[10px] uppercase text-[#c0a0e0]/60 font-serif tracking-widest font-bold">Karmic Debt</span>
              <span className="text-xl text-[#c0a0e0] font-serif">{debt}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .seance-bg {
          background: radial-gradient(circle at center, #1a0f1f 0%, #05050a 100%);
        }
        @keyframes flicker {
          0%, 100% { background: rgba(212, 175, 55, 0.02); }
          50% { background: rgba(212, 175, 55, 0.05); }
          75% { background: rgba(212, 175, 55, 0.03); }
        }
        .flicker-overlay {
          animation: flicker 4s infinite linear;
          pointer-events: none;
        }
        .font-serif {
          font-family: 'Georgia', serif;
        }
      `}</style>
    </div>
  )
}
