'use client'

import React from 'react'
import { BOX_SHELL, BOX_HEADER, BOX_PADDING } from '@/src/styles/tokens'

export function FarSideBox() {
  return (
    <div style={{ ...BOX_SHELL, height: 'fit-content' }}>
      <div style={{ padding: BOX_PADDING }}>
        <h2 style={{ ...BOX_HEADER }}>The Far Side</h2>
      </div>
    </div>
  )
}
