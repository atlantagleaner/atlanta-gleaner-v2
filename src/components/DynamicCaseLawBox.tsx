'use client'

import React, { type CSSProperties } from 'react'
// We import your exact design tokens so it perfectly matches the site
import { PALETTE, FONT, T, BOX_SHELL, BOX_HEADER } from '@/src/styles/tokens'

interface DynamicCaseLawBoxProps {
  htmlContent: string;
  slugTitle: string;
  style?: CSSProperties;
}

export function DynamicCaseLawBox({ htmlContent, slugTitle, style }: DynamicCaseLawBoxProps) {
  // Clean up the URL slug to make it look like a case title
  const formattedTitle = slugTitle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div style={{ height: '100%', ...style }}>
      <div style={BOX_SHELL}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          
          {/* 1. The Header Section (Matches your original layout) */}
          <div style={{ padding: '20px 20px 16px' }}>
            <h2 style={{ ...BOX_HEADER, margin: '0 0 16px 0' }}>Case Law Archive</h2>
            <h3 style={{
              ...FONT.serif,
              fontSize:   'clamp(1.6rem, 3.5vw, 2.6rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              color:      PALETTE.black,
              margin:     0,
              textShadow: '0 0 1px rgba(0,0,0,0.2)',
            }}>
              {formattedTitle}
            </h3>
          </div>

          {/* 2. The Opinion Section */}
          <div style={{ padding: '20px 20px 28px' }}>
            <h4 style={{
              ...FONT.serif,
              fontSize:      '24px',
              fontWeight:    700,
              margin:        '0 0 16px 0',
              borderBottom:  '1px solid rgba(0,0,0,0.10)',
              paddingBottom: '8px',
            }}>
              Opinion Transcript
            </h4>
            
            {/* 3. The Injection Zone */}
            {/* We wrap the raw HTML in a div that forces your typography rules onto the Word Doc text */}
            <div 
              className="dynamic-opinion-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }} 
              style={{ 
                ...T.prose, 
                color: PALETTE.black,
                lineHeight: 1.72 
              }} 
            />
          </div>

        </div>
      </div>
      
      {/* We add a tiny style block here to ensure the injected Word Doc paragraphs 
        and bold tags follow the Gleaner's design system.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        .dynamic-opinion-content p {
          margin: 0 0 1.1em 0;
        }
        .dynamic-opinion-content strong {
          font-weight: 600;
        }
      `}} />
    </div>
  )
}