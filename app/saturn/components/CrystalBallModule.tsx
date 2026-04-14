'use client'

import React, { useState, useEffect } from 'react'

export function CrystalBallModule() {
  const [isGazing, setIsGazing] = useState(false)
  const [displayedText, setDisplayedText] = useState("")
  const [fullText, setFullText] = useState("TOUCH THE GLASS TO PEEK THROUGH THE VEIL...")
  const [revealIndex, setRevealIndex] = useState(0)

  const fortunes = [
    "I SEE A CHAIR... IT IS EMPTY, YET IT FEELS QUITE HEAVY.",
    "THE FUTURE IS A MIRROR IN A DARK ROOM. YOU ARE STANDING BEHIND YOURSELF.",
    "YOU WILL FIND A KEY. YOU WILL SOON LOSE THE DOOR.",
    "THE STARS ARE LAUGHING. NOT AT YOU. JUST IN GENERAL.",
    "I SEE A MICROWAVE FIREPLACE. IT PROVIDES A LIFETIME OF WARMTH IN A SINGLE BREATH.",
    "YOUR SKELETON IS PLANNING A VACATION. IT DOES NOT INTEND TO BRING YOUR SKIN.",
    "THE VACUUM IN THE HALLWAY IS REMARKABLY QUIET. IT ONLY CONSUMES THE STATIC OF SOULS.",
    "YOU WILL BUY A RESIDENCE ON A ONE-WAY DEAD-END ROAD. THE GEOGRAPHY IS SIMPLE.",
    "I SEE A TELEPHONE WITH NO DIAL. IT ONLY RINGS WHEN THE HOUSE HAS A GRIEVANCE.",
    "THE EMERGENCY EXIT IS MERELY A HIGH-RESOLUTION PHOTOGRAPH OF A DOOR.",
    "YOUR HEARTBEAT IS A RHYTHMIC COUNTDOWN. I AM SYNCHRONIZING MY WATCH.",
    "I SEE DEHYDRATED WATER. YOU LACK THE VITAL FLUID TO MAKE IT FLOW.",
    "THE MIRROR SHOWS ME THE PERSON STANDING DIRECTLY BEHIND YOU.",
    "SOME DESCENTS ARE DESIGNED WITHOUT THE POSSIBILITY OF A PARACHUTE.",
    "I SEE A MAP OF YOUR CENTRAL NERVOUS SYSTEM. SEVERAL CORRIDORS LEAD TO NOTHING.",
    "THE RADIATOR ISN'T MAKING NOISE. IT IS SCREAMING IN A FREQUENCY YOU CANNOT HEAR."
  ]

  // Typewriter effect logic
  useEffect(() => {
    if (revealIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[revealIndex])
        setRevealIndex(prev => prev + 1)
      }, 40) // Standard SNES dialogue speed
      return () => clearTimeout(timer)
    }
  }, [revealIndex, fullText])

  const handleGaze = () => {
    if (isGazing) return

    setIsGazing(true)
    setDisplayedText("")
    setRevealIndex(0)
    setFullText("GAZING INTO THE MIST...")

    // Dramatic pause for the "gaze"
    setTimeout(() => {
      const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)]
      setFullText(randomFortune)
      setDisplayedText("")
      setRevealIndex(0)
      setIsGazing(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-[#0a050d] text-[#e0d0b0] p-4 font-mono flex flex-col items-center selection:bg-[#5e2d8a] relative overflow-hidden seance-bg">
      {/* Retro Overlays */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px]" />
      <div className="fixed inset-0 pointer-events-none z-40 flicker-overlay" />

      <div className="w-full max-w-2xl flex flex-col gap-10 z-10 pt-10">

        {/* Module Title */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-[0.3em] text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] uppercase italic flicker-title">
            The Crystal Eye
          </h1>
          <div className="h-1 w-32 bg-[#d4af37] mx-auto mt-2 opacity-30" />
        </div>

        {/* Central Crystal Ball Visual */}
        <div className="relative flex justify-center py-10">
          <div
            onClick={handleGaze}
            className={`group relative w-64 h-64 rounded-full border-8 border-[#2d1e12] shadow-[0_0_50px_rgba(94,45,138,0.3)] bg-black overflow-hidden cursor-pointer transition-transform active:scale-95 ${isGazing ? 'animate-pulse' : ''}`}
          >
            {/* The "Ball" Interior */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${isGazing ? 'opacity-100' : 'opacity-40'}`}>
              {/* Swirling Mist / Static Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#5e2d8a_0%,transparent_70%)] animate-spin-slow" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50" />
              <div className={`absolute inset-0 bg-indigo-500/20 mix-blend-overlay ${isGazing ? 'animate-flicker' : ''}`} />
            </div>

            {/* Reflection Glint */}
            <div className="absolute top-8 left-12 w-16 h-8 bg-white/20 rounded-full blur-xl -rotate-45" />

            {/* Inner Glow */}
            <div className={`absolute inset-0 shadow-[inset_0_0_40px_rgba(212,175,55,0.2)] group-hover:shadow-[inset_0_0_60px_rgba(212,175,55,0.4)] transition-shadow duration-500`} />
          </div>

          {/* Decorative Pedestal (SNES Sprite Style) */}
          <div className="absolute bottom-4 w-40 h-12 bg-[#1a0f1f] border-t-4 border-x-4 border-[#2d1e12] shadow-[0_10px_0_#000]">
            <div className="flex justify-around mt-2">
              <div className="w-2 h-2 bg-[#d4af37] rounded-full opacity-50" />
              <div className="w-2 h-2 bg-[#d4af37] rounded-full opacity-50" />
            </div>
          </div>
        </div>

        {/* Dialogue / Fortune Box */}
        <div className="border-4 border-[#5e2d8a] bg-[#000] p-8 min-h-[180px] flex items-start justify-center text-center relative shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
          {/* Ornate Corner Accents */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#5e2d8a] border-2 border-[#d4af37] flex items-center justify-center rotate-45">
            <div className="w-2 h-2 bg-[#d4af37] rounded-full -rotate-45" />
          </div>
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#5e2d8a] border-2 border-[#d4af37] flex items-center justify-center rotate-45">
            <div className="w-2 h-2 bg-[#d4af37] rounded-full -rotate-45" />
          </div>
          <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-[#5e2d8a] border-2 border-[#d4af37] flex items-center justify-center rotate-45">
            <div className="w-2 h-2 bg-[#d4af37] rounded-full -rotate-45" />
          </div>
          <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[#5e2d8a] border-2 border-[#d4af37] flex items-center justify-center rotate-45">
            <div className="w-2 h-2 bg-[#d4af37] rounded-full -rotate-45" />
          </div>

          <div className="text-xl sm:text-2xl italic text-[#c0a0e0] tracking-wider leading-relaxed font-serif typewriter-text">
            {displayedText}
            <span className="inline-block w-3 h-6 bg-[#c0a0e0] ml-1 animate-pulse" />
          </div>
        </div>

        {/* Legend / Controls */}
        <div className="flex justify-center mt-4">
          <div className="px-6 py-2 border-2 border-[#5e2d8a]/40 bg-black/40 text-[10px] uppercase tracking-[0.3em] font-mono text-[#d4af37]/60">
            {isGazing ? "Communing with the Mist..." : "Gaze into the Glass"}
          </div>
        </div>

      </div>

      <style>{`
        .seance-bg {
          background: radial-gradient(circle at center, #1a0f1f 0%, #05050a 100%);
        }
        @keyframes flicker {
          0%, 100% { background: rgba(212, 175, 55, 0.02); }
          50% { background: rgba(212, 175, 55, 0.06); }
          75% { background: rgba(212, 175, 55, 0.03); }
        }
        @keyframes flicker-title {
          0%, 19%, 22%, 62%, 64%, 65%, 70%, 100% { opacity: 1; filter: blur(0px); }
          20%, 21%, 63%, 66%, 69% { opacity: 0.5; filter: blur(1px); }
        }
        .flicker-overlay {
          animation: flicker 4s infinite linear;
          pointer-events: none;
        }
        .flicker-title {
          animation: flicker-title 8s infinite step-end;
        }
        .animate-spin-slow {
          animation: spin 15s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .font-serif {
          font-family: 'Georgia', serif;
        }
      `}</style>
    </div>
  )
}
