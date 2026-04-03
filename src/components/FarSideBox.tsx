'use client'

import React from 'react'
import { BOX_SHELL } from '@/src/styles/tokens'

export function FarSideBox() {
  return (
    <div style={{ ...BOX_SHELL, height: 'fit-content' }}>
      <img
        src="/03.22.86.jpg"
        alt="The Far Side"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          objectFit: 'cover',
        }}
      />
    </div>
  )
}
