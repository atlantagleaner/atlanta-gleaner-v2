import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'mf-black': '#000000',
        'mf-white': '#F5F5F5',
        'mf-dim': '#A0A0A0',
        'mf-border': 'rgba(245,245,245,0.15)',
        'mf-glow': 'rgba(245,245,245,0.05)',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        mono:  ['IBM Plex Mono', 'monospace'],
        sans:  ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.25em',
      },
    },
  },
  plugins: []