'use client'

import React from 'react'
import { BOX_SHELL } from '@/src/styles/tokens'
import { useThemeDetection } from '@/src/hooks'

export function FarSideBox() {
  const isMatrixTheme = useThemeDetection('matrix')

  return (
    <div style={{ ...BOX_SHELL, height: 'fit-content' }}>
      <img
        src="/01.23.88.jpg"
        alt="The Far Side"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          objectFit: 'cover',
          filter: isMatrixTheme ? 'brightness(0.85) contrast(0.9)' : 'none',
          transition: 'filter 0.3s ease',
        }}
      />
    </div>
  )
}
