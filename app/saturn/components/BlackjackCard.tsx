'use client'

interface BlackjackCardProps {
  suit?: string
  rank?: string
  hidden?: boolean
}

export function BlackjackCard({ suit, rank, hidden }: BlackjackCardProps) {
  const suitSymbols: Record<string, { symbol: string; color: string }> = {
    hearts: { symbol: '♥', color: '#C85050' },
    diamonds: { symbol: '♦', color: '#C85050' },
    spades: { symbol: '♠', color: '#F5F1E8' },
    clubs: { symbol: '♣', color: '#F5F1E8' },
  }

  const suits = ['hearts', 'diamonds', 'spades', 'clubs']
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

  // Normalize suit and rank
  const normalizedSuit = suit ? suit.toLowerCase().replace(/s$/, '') : 'spades'
  const normalizedRank = rank?.toUpperCase() || 'A'
  const suitInfo = suitSymbols[normalizedSuit] || suitSymbols.spades

  return (
    <svg
      width="80"
      height="120"
      viewBox="0 0 80 120"
      style={{
        display: 'inline-block',
        margin: '4px',
      }}
    >
      {/* Card background and border */}
      <rect x="2" y="2" width="76" height="116" rx="4" fill="#1A1A2E" stroke="#B8860B" strokeWidth="2" />

      {hidden ? (
        <>
          {/* Hidden card pattern */}
          <rect x="4" y="4" width="72" height="112" rx="3" fill="#0B0820" />

          {/* Decorative pattern for hidden card */}
          <g opacity="0.3">
            <circle cx="20" cy="20" r="6" fill="#B8860B" />
            <circle cx="60" cy="30" r="5" fill="#B8860B" />
            <circle cx="25" cy="70" r="4" fill="#B8860B" />
            <circle cx="55" cy="85" r="6" fill="#B8860B" />
            <circle cx="40" cy="50" r="7" fill="#B8860B" />
            <line x1="10" y1="10" x2="70" y2="110" stroke="#B8860B" strokeWidth="0.5" />
            <line x1="70" y1="10" x2="10" y2="110" stroke="#B8860B" strokeWidth="0.5" />
          </g>
        </>
      ) : (
        <>
          {/* Card content background */}
          <rect x="4" y="4" width="72" height="112" rx="3" fill="#1A1A2E" />

          {/* Top-left corner: rank + suit */}
          <text x="10" y="18" fontFamily="IBM Plex Mono" fontSize="10" fontWeight="bold" fill="#F5F1E8">
            {normalizedRank}
          </text>
          <text x="10" y="28" fontSize="8" fill={suitInfo.color}>
            {suitInfo.symbol}
          </text>

          {/* Center: large suit symbol */}
          <text x="40" y="65" fontFamily="IBM Plex Mono" fontSize="42" fill={suitInfo.color} textAnchor="middle" opacity="0.9">
            {suitInfo.symbol}
          </text>

          {/* Bottom-right corner: rank + suit (rotated 180°) */}
          <g transform="translate(70, 112)">
            <text x="0" y="0" fontFamily="IBM Plex Mono" fontSize="10" fontWeight="bold" fill="#F5F1E8" textAnchor="end">
              {normalizedRank}
            </text>
            <text x="0" y="10" fontSize="8" fill={suitInfo.color} textAnchor="end">
              {suitInfo.symbol}
            </text>
          </g>
        </>
      )}
    </svg>
  )
}
