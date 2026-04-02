'use client'

import React from 'react'
import { BOX_SHELL, BOX_HEADER, BOX_PADDING } from '@/src/styles/tokens'

export function AstrologyBox() {
  return (
    <div style={{ ...BOX_SHELL, display: 'flex', flexDirection: 'column' }}>

      {/* Header with label */}
      <div style={{ padding: BOX_PADDING, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ ...BOX_HEADER }}>
          Astrology
        </h2>
      </div>

      {/* Astrology.com iframe container */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* BEGIN ASTROLOGY.COM FREE ASTROLOGY CODE */}
        <div className='syndicate-horoscope-iframe-container'>
          <iframe
            className='syndicate-horoscope-iframe'
            src='/us/syndicate-iframe.aspx'
            title='Choose Your Zodiac Sign'
            name='Syndicate Horoscope with Astrology.com'
            style={{
              border: 'none',
              height: '100%',
              width: '100%',
            }}
            referrerPolicy='no-referrer'
            scrolling='auto'
          />
          <style>{`
            .syndicate-horoscope-iframe-container {
              height: 830px;
            }
            @media all and (min-width: 768px) {
              .syndicate-horoscope-iframe-container {
                height: 770px;
              }
            }
          `}</style>
        </div>
        {/* END ASTROLOGY.COM FREE ASTROLOGY CODE */}
      </div>
    </div>
  )
}