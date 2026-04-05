'use client'

import { CSSProperties, useRef } from 'react'
import { PALETTE, PALETTE_CSS, SPACING, T, ANIMATION } from '@/src/styles/tokens'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  resultCount?: number | null
  noResults?: boolean
}

export function SearchInput({
  value,
  onChange,
  resultCount,
  noResults,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear()
    }
  }

  const containerStyle: CSSProperties = {
    marginBottom: SPACING.lg,
  }

  const inputStyle: CSSProperties = {
    ...T.body,
    width: '100%',
    border: `1px solid ${PALETTE_CSS.border}`,
    background: PALETTE.white,
    padding: `${SPACING.md} ${SPACING.md}`,
    color: PALETTE.black,
    boxSizing: 'border-box',
    transition: `border-color ${ANIMATION.fast} ${ANIMATION.ease}`,
    outline: 'none',
  }

  const inputStyleFocus: CSSProperties = {
    ...inputStyle,
    borderColor: PALETTE_CSS.meta,
  }

  const resultCountStyle: CSSProperties = {
    ...T.micro,
    color: noResults ? PALETTE_CSS.meta : PALETTE_CSS.muted,
    marginTop: SPACING.sm,
    minHeight: '16px',
  }

  const noResultsStyle: CSSProperties = {
    ...T.body,
    color: PALETTE_CSS.meta,
    marginTop: SPACING.sm,
  }

  return (
    <div style={containerStyle}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search cases..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = PALETTE_CSS.meta
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = PALETTE_CSS.border
          }}
        />
        {value && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: SPACING.md,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              color: PALETTE_CSS.muted,
              fontSize: '16px',
              lineHeight: 1,
              transition: `color ${ANIMATION.fast} ${ANIMATION.ease}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = PALETTE.black
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = PALETTE_CSS.muted
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {value && (
        <div>
          {noResults ? (
            <div style={noResultsStyle}>No cases found</div>
          ) : (
            <div style={resultCountStyle}>
              Found {resultCount} {resultCount === 1 ? 'case' : 'cases'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
