'use client'

import React, { useRef, useEffect, useState } from 'react'

interface GameContainerProps {
  isOpen: boolean
  onClose: () => void
}

const GAMES = [
  { id: 'soul-stakes', label: 'SOUL STAKES', title: 'The Soul Stakes Pro Edition' }
]

export default function GameContainer({ isOpen, onClose }: GameContainerProps) {
  const [selectedGame, setSelectedGame] = useState(GAMES[0].id)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  if (!isOpen) return null

  const currentGame = GAMES.find(g => g.id === selectedGame)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Container */}
      <div className="relative flex flex-col gap-3 max-w-5xl w-full max-h-[90vh]" style={{ pointerEvents: 'auto' }}>

          {/* Game Selector Pill */}
          <div className="flex justify-center" ref={menuRef}>
            <div className="relative inline-block">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="px-6 py-2 bg-gradient-to-r from-[#2b0033]/80 to-[#12001a]/80 border-2 border-[#B8860B] text-[#ffd700] rounded-full font-serif font-bold text-sm uppercase tracking-widest hover:bg-[#3a1f42]/80 transition-colors"
                style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.4)' }}
              >
                {currentGame?.label}
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#0B0820]/95 border-2 border-[#B8860B] rounded-lg overflow-hidden min-w-[200px] z-50" style={{ boxShadow: '6px 6px 0 rgba(0,0,0,0.4)' }}>
                  {GAMES.map(game => (
                    <button
                      key={game.id}
                      onClick={() => {
                        setSelectedGame(game.id)
                        setIsMenuOpen(false)
                      }}
                      className="w-full px-4 py-2 text-left font-serif font-bold uppercase text-sm tracking-widest transition-colors"
                      style={
                        selectedGame === game.id
                          ? { backgroundColor: '#B8860B', color: '#0B0820' }
                          : { color: '#ffd700' }
                      }
                      onMouseEnter={(e) => {
                        if (selectedGame !== game.id) {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(184, 134, 11, 0.2)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedGame !== game.id) {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      {game.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Game Iframe */}
          <div className="bg-[#11001c] border-4 border-[#B8860B] rounded-lg overflow-hidden relative h-[calc(90vh-100px)]" style={{ boxShadow: '8px 8px 0 rgba(0,0,0,0.4)' }}>
            <iframe
              key={selectedGame}
              src={`/soul-stakes-pro.html`}
              title={currentGame?.title || 'Game'}
              className="w-full h-full border-none"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>

          {/* Close Button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#4a0024] border-2 border-[#ff003c] text-[#ff003c] rounded-full font-serif font-bold text-sm uppercase tracking-widest hover:bg-[#5a0030] transition-colors"
              style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.4)' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
