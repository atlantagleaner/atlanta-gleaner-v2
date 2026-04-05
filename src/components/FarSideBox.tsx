'use client'

import React, { useState, useEffect } from 'react'
import { BOX_SHELL } from '@/src/styles/tokens'

export function FarSideBox() {
  const [isMatrixTheme, setIsMatrixTheme] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    const checkTheme = () => {
      setIsMatrixTheme(html.dataset.theme === 'matrix')
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

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
          filter: isMatrixTheme ? 'brightness(0.85) contrast(0.9)' : 'none',
          transition: 'filter 0.3s ease',
        }}
      />
    </div>
  )
}
