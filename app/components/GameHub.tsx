'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Play, ChevronDown } from 'lucide-react'
import { CrystalBallModule } from '@/app/saturn/components/CrystalBallModule'
import { BlackjackModule } from '@/app/saturn/components/BlackjackModule'

const games = [
  {
    id: 'sphere',
    name: 'CRYSTAL SPHERE',
    description: 'Fortunes',
  },
  {
    id: 'blackjack',
    name: 'BLACKJACK',
    description: 'Card Game',
  },
]

interface GameHubProps {
  isMobile?: boolean
  isUIVisible?: boolean
  isPlaying?: boolean
  activeGame?: (typeof games)[0]
  onPlayToggle?: () => void
  onGameChange?: (game: (typeof games)[0]) => void
}

export const GameHub: React.FC<GameHubProps> = ({
  isMobile = false,
  isUIVisible = true,
  isPlaying: propIsPlaying,
  activeGame: propActiveGame,
  onPlayToggle,
  onGameChange,
}) => {
  const [internalActiveGame, setInternalActiveGame] = useState(games[0])
  const [internalIsPlaying, setInternalIsPlaying] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeGame = propActiveGame ?? internalActiveGame
  const isPlayingState = propIsPlaying !== undefined ? propIsPlaying : internalIsPlaying

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const setActiveGame = (game: (typeof games)[0]) => {
    if (onGameChange) {
      onGameChange(game)
    } else {
      setInternalActiveGame(game)
    }
  }

  const setIsPlaying = (value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(isPlayingState) : value
    if (onPlayToggle) {
      if (newValue !== isPlayingState) {
        onPlayToggle()
      }
    } else {
      setInternalIsPlaying(newValue)
    }
  }

  const handleGameChange = (game: (typeof games)[0]) => {
    setActiveGame(game)
    setIsPlaying(true)
  }

  const glassStyle: React.CSSProperties = {
    backdropFilter: 'blur(24px)',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '100px',
  }

  const playerStyle: React.CSSProperties = {
    backdropFilter: 'blur(24px)',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '32px',
  }

  const monoStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  }

  // Render game module based on active game
  const renderGameModule = () => {
    switch (activeGame.id) {
      case 'sphere':
        return <CrystalBallModule />
      case 'blackjack':
        return <BlackjackModule />
      default:
        return null
    }
  }

  // When UI is not visible, don't render
  if (!isUIVisible) {
    return null
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div
        style={{
          background: '#050505',
          color: '#FFF',
          padding: '20px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          overflowY: 'auto',
        }}
      >
        {/* Game Selector Dropdown */}
        <div
          style={{
            width: '100%',
            maxWidth: '280px',
            margin: '0 auto',
            position: 'relative',
          }}
          ref={menuRef}
        >
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              ...glassStyle,
              width: '100%',
              padding: '8px 16px',
              color: '#FFF',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <span style={monoStyle}>Station • {activeGame.name}</span>
            <ChevronDown
              size={14}
              style={{
                transition: 'transform 0.2s ease',
                transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
          {isMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: 'rgba(2, 1, 1, 0.8)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                zIndex: 1100,
              }}
            >
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    handleGameChange(game)
                    setIsMenuOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background:
                      activeGame.id === game.id
                        ? 'rgba(255, 179, 71, 0.1)'
                        : 'transparent',
                    color: activeGame.id === game.id ? '#FFB347' : '#FFF',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    transition: 'background 0.2s ease',
                    fontFamily: 'monospace',
                    letterSpacing: '0.15em',
                    textAlign: 'left',
                    textTransform: 'uppercase',
                  }}
                  onMouseEnter={(e) => {
                    if (activeGame.id !== game.id) {
                      e.currentTarget.style.background =
                        'rgba(255, 165, 0, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeGame.id !== game.id) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {game.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Game Container */}
        <div
          style={{
            ...playerStyle,
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
            maxWidth: '280px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
            minHeight: '320px',
            maxHeight: '480px',
          }}
        >
          {!isPlayingState ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20px',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg, rgba(255, 179, 71, 0.1), rgba(255, 179, 71, 0.05))`,
                }}
              />
              <div style={{ position: 'relative', zIndex: 20 }}>
                <button
                  onClick={() => setIsPlaying(true)}
                  style={{
                    ...glassStyle,
                    width: '60px',
                    height: '60px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.borderColor =
                      'rgba(255, 179, 71, 0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.borderColor =
                      'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Play size={24} fill="#FFF" color="#FFF" style={{ marginLeft: '4px' }} />
                </button>
                <h2
                  style={{
                    ...monoStyle,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                  }}
                >
                  {activeGame.name}
                </h2>
                <p
                  style={{
                    ...monoStyle,
                    fontSize: '9px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    margin: 0,
                  }}
                >
                  {activeGame.description}
                </p>
              </div>
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'auto',
              }}
            >
              {renderGameModule()}
            </div>
          )}
        </div>

        {/* Compact Controls */}
        <div
          style={{
            width: '100%',
            maxWidth: '280px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            paddingLeft: '16px',
            paddingRight: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#FFB347',
                animation: 'pulse 2s infinite',
              }}
            />
            <span
              style={{
                ...monoStyle,
                fontSize: '10px',
                color: '#FFB347',
                fontWeight: 'bold',
              }}
            >
              Active Session
            </span>
          </div>
          <button
            onClick={() => setIsPlaying(!isPlayingState)}
            style={{
              ...monoStyle,
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.4)',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '2px',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFB347'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'
            }}
          >
            {isPlayingState ? 'Exit' : 'Enter'}
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  // Desktop layout
  return (
    <div
      style={{
        background: '#050505',
        color: '#FFF',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Game Selector Dropdown */}
      <div style={{ position: 'relative' }} ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            ...glassStyle,
            padding: '10px 24px',
            color: '#FFF',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={monoStyle}>Game • {activeGame.name}</span>
          <ChevronDown
            size={16}
            style={{
              transition: 'transform 0.2s ease',
              transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>
        {isMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px',
              background: 'rgba(2, 1, 1, 0.8)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              zIndex: 1100,
              minWidth: '300px',
            }}
          >
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => {
                  handleGameChange(game)
                  setIsMenuOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background:
                    activeGame.id === game.id
                      ? 'rgba(255, 179, 71, 0.1)'
                      : 'transparent',
                  color: activeGame.id === game.id ? '#FFB347' : '#FFF',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  transition: 'background 0.2s ease',
                  fontFamily: 'monospace',
                  letterSpacing: '0.15em',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                }}
                onMouseEnter={(e) => {
                  if (activeGame.id !== game.id) {
                    e.currentTarget.style.background =
                      'rgba(255, 165, 0, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeGame.id !== game.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {game.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Game Container */}
      <div
        style={{
          ...playerStyle,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
          minHeight: '500px',
          maxHeight: '70vh',
        }}
      >
        {!isPlayingState ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '40px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, rgba(255, 179, 71, 0.1), rgba(255, 179, 71, 0.05))`,
              }}
            />
            <div style={{ position: 'relative', zIndex: 20 }}>
              <button
                onClick={() => setIsPlaying(true)}
                style={{
                  ...glassStyle,
                  width: '80px',
                  height: '80px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginBottom: '24px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                  e.currentTarget.style.borderColor =
                    'rgba(255, 179, 71, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.borderColor =
                    'rgba(255, 255, 255, 0.1)'
                }}
              >
                <Play
                  size={32}
                  fill="#FFF"
                  color="#FFF"
                  style={{ marginLeft: '4px' }}
                />
              </button>
              <h2
                style={{
                  ...monoStyle,
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                }}
              >
                {activeGame.name}
              </h2>
              <p
                style={{
                  ...monoStyle,
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0,
                }}
              >
                {activeGame.description}
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'auto',
            }}
          >
            {renderGameModule()}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#FFB347',
              animation: 'pulse 2s infinite',
            }}
          />
          <span
            style={{
              ...monoStyle,
              fontSize: '10px',
              color: '#FFB347',
              fontWeight: 'bold',
            }}
          >
            Active Session
          </span>
          <div
            style={{
              width: '1px',
              height: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
            }}
          />
          <span
            style={{
              ...monoStyle,
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            Entering Game
          </span>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlayingState)}
          style={{
            ...monoStyle,
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.4)',
            background: 'none',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '2px',
            cursor: 'pointer',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFB347'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'
          }}
        >
          {isPlayingState ? 'Exit Game' : 'Enter Game'}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
