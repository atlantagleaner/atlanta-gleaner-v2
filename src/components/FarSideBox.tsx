'use client'

import React from 'react'
import { PALETTE, FONT, T, BOX_SHELL, BOX_HEADER } from '@/src/styles/tokens'

export function FarSideBox() {
  return (
    <div style={{ 
      ...BOX_SHELL, 
      height: 'fit-content', // Forces the box to wrap strictly around content
      border: `1px solid ${PALETTE.black}`, 
      display: 'flex', 
      flexDirection: 'column', 
      background: PALETTE.white 
    }}>
      
      {/* 1. Header Bar */}
      <div style={{ padding: '12px 16px', background: PALETTE.black }}>
        <h2 style={{ ...BOX_HEADER, color: PALETTE.white, margin: 0 }}>
          Roll-C · The Far Side
        </h2>
      </div>

      {/* 2. Content Area */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        
        <h3 style={{ ...FONT.sans, fontSize: '14px', fontWeight: 900, letterSpacing: '0.1em', margin: '0 0 8px 0', color: PALETTE.black }}>
          THE FAR SIDE
        </h3>
        
        <hr style={{ border: 'none', borderTop: '2px solid black', margin: '0 0 24px 0' }} />

        {/* 3. The Image Placeholder (Locked to Square) */}
        <div style={{ 
          width: '100%', 
          aspectRatio: '1 / 1', // Keeps the comic area a perfect square
          background: '#E5E5E5', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid #D1D1D1',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎞️</div>
          <p style={{ ...FONT.sans, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', margin: 0 }}>
            [ COMIC AWAITING SCAN ]
          </p>
        </div>

        {/* 4. The Caption */}
        <p style={{ 
          ...FONT.serif, 
          fontSize: '16px', 
          lineHeight: 1.5, 
          fontStyle: 'italic', 
          textAlign: 'center', 
          color: PALETTE.black,
          padding: '0 10px',
          margin: 0
        }}>
          "Suddenly, Ted remembered he had left the primordial soup on."
        </p>

      </div>
    </div>
  )
}