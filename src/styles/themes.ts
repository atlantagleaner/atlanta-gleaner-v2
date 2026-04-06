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
      hoverBg:      '#EEEDEB',
      hoverText:    '#FFFFFF',
      border:       '#f0f0f0',
      citation:     '#666',
      gradientFade: '#EEEDEB',
    },
  },

  classical: {
    /**
     * Core palette colors — heritage/vintage theme
     */
    palette: {
      white:     '#E0E0E0',
      warm:      '#FFFFFF',
      black:     '#000000',
      accent:    '#333333',
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
     * Interactive state colors — pure white hover with dark charcoal text
     */
    interactive: {
      hoverBg:      '#FFFFFF',
      hoverText:    '#333333',
      border:       '#FFFFFF',
      citation:     '#333333',
      gradientFade: '#FFFFFF',
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
      hoverBg:      '#00FF41',
      hoverText:    '#00FF41',
      border:       '#f0f0f0',
      citation:     '#666',
      gradientFade: '#000000',
    },
  },
} as const

export type ThemeName = keyof typeof THEMES
export type Theme = typeof THEMES[ThemeName]
