/**
 * Atlanta Gleaner — Centralized Theme Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all color palettes and interactive states.
 * Three palettes: default, classical, matrix.
 * Synced with app/globals.css via [data-theme] attribute.
 */

export const THEMES = {
  default: {
    /**
     * Core palette colors
     */
    palette: {
      white:     '#FFFFFF',
      warm:      '#EEEDEB',
      black:     '#000000',
      accent:    '#666666',
    },
    /**
     * Opacity-based derived colors (black-based)
     */
    opacity: {
      border:    'rgba(0,0,0,0.18)',
      rule:      'rgba(0,0,0,0.07)',
      ruleSm:    'rgba(0,0,0,0.05)',
      ruleMd:    'rgba(0,0,0,0.10)',
      ruleLg:    'rgba(0,0,0,0.14)',
      meta:      'rgba(0,0,0,0.45)',
      muted:     'rgba(0,0,0,0.35)',
      subtle:    'rgba(0,0,0,0.09)',
    },
    /**
     * Interactive state colors
     */
    interactive: {
      newsBoxHoverBg:     '#EEEDEB',
      newsBoxHoverText:   '#FFFFFF',
      volumeBoxHoverBg:   '#EEEDEB',
      volumeBoxHoverText: '#000000',
      volumeBoxBorder:    '#f0f0f0',
      volumeBoxCitation:  '#666',
      caseLawGradientFade: '#EEEDEB',
    },
  },

  classical: {
    /**
     * Core palette colors — heritage/vintage theme
     */
    palette: {
      white:     '#F5F2E1',
      warm:      '#F6F0E2',
      black:     '#000000',
      accent:    '#A9C2C6',
    },
    /**
     * Opacity-based derived colors (black-based)
     */
    opacity: {
      border:    'rgba(0,0,0,0.18)',
      rule:      'rgba(0,0,0,0.07)',
      ruleSm:    'rgba(0,0,0,0.05)',
      ruleMd:    'rgba(0,0,0,0.10)',
      ruleLg:    'rgba(0,0,0,0.14)',
      meta:      'rgba(0,0,0,0.45)',
      muted:     'rgba(0,0,0,0.35)',
      subtle:    'rgba(0,0,0,0.09)',
    },
    /**
     * Interactive state colors — dusty blue hover with black text
     */
    interactive: {
      newsBoxHoverBg:     '#A9C2C6',
      newsBoxHoverText:   '#000000',
      volumeBoxHoverBg:   '#A9C2C6',
      volumeBoxHoverText: '#000000',
      volumeBoxBorder:    '#A9C2C6',
      volumeBoxCitation:  '#000000',
      caseLawGradientFade: '#A9C2C6',
    },
  },

  matrix: {
    /**
     * Core palette colors — neon Matrix theme
     */
    palette: {
      white:     '#0D1117',
      warm:      '#000000',
      black:     '#00FF41',
      accent:    '#00FF41',
    },
    /**
     * Opacity-based derived colors (green-based)
     */
    opacity: {
      border:    'rgba(0,255,65,0.25)',
      rule:      'rgba(0,255,65,0.12)',
      ruleSm:    'rgba(0,255,65,0.07)',
      ruleMd:    'rgba(0,255,65,0.15)',
      ruleLg:    'rgba(0,255,65,0.18)',
      meta:      'rgba(0,255,65,0.60)',
      muted:     'rgba(0,255,65,0.40)',
      subtle:    'rgba(0,255,65,0.10)',
    },
    /**
     * Interactive state colors — Matrix green throughout
     */
    interactive: {
      newsBoxHoverBg:     '#00FF41',
      newsBoxHoverText:   '#00FF41',
      volumeBoxHoverBg:   '#00FF41',
      volumeBoxHoverText: '#00FF41',
      volumeBoxBorder:    '#f0f0f0',
      volumeBoxCitation:  '#666',
      caseLawGradientFade: '#000000',
    },
  },
} as const

export type ThemeName = keyof typeof THEMES
export type Theme = typeof THEMES[ThemeName]
