import { EB_Garamond, Inter, IBM_Plex_Mono } from 'next/font/google';

/**
 * EB Garamond — Primary Serif
 * Used for branding, opinion titles, and news headers.
 * Sourced via next/font for build-time optimization.
 */
export const serif = EB_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
});

/**
 * Inter — Standard Sans-serif
 * Used for all body copy and prose.
 */
export const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

/**
 * IBM Plex Mono — Technical Monospace
 * Used for labels, navigation, and metadata.
 */
export const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});
