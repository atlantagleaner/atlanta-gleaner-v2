'use client'

import { type ReactNode, type CSSProperties } from 'react'
import { BOX_SHELL, BOX_HEADER, BOX_PADDING } from '@/src/styles/tokens'

interface BaseBoxProps {
  /**
   * Main header/title displayed in the box header area with the border rule.
   * Optional — if not provided, no header is rendered.
   */
  header?: ReactNode
  /**
   * Main content of the box.
   * Required.
   */
  children: ReactNode
  /**
   * Footer content displayed after the main content.
   * Optional — if not provided, no footer is rendered.
   */
  footer?: ReactNode
  /**
   * Additional inline styles to merge with BOX_SHELL defaults.
   * Useful for height, custom borders, etc.
   */
  style?: CSSProperties
  /**
   * Custom padding override. Defaults to BOX_PADDING.
   */
  padding?: CSSProperties['padding']
  /**
   * Custom background color override.
   */
  background?: CSSProperties['background']
}

/**
 * BaseBox component — abstraction for the common box pattern used throughout the site.
 *
 * Renders:
 * 1. BOX_SHELL (border, background)
 * 2. Optional header with BOX_HEADER styling (uppercase mono label + bottom rule)
 * 3. Padded content area with children
 * 4. Optional footer
 *
 * Usage:
 * ```tsx
 * <BaseBox header="News Index" footer={<small>...</small>}>
 *   {newsItems}
 * </BaseBox>
 * ```
 */
export function BaseBox({
  header,
  children,
  footer,
  style,
  padding = BOX_PADDING,
  background,
}: BaseBoxProps) {
  return (
    <div style={{ ...BOX_SHELL, background, ...style }}>
      {header && (
        <div style={{ ...BOX_HEADER, padding }}>
          {header}
        </div>
      )}
      <div style={{ padding }}>
        {children}
      </div>
      {footer && (
        <div style={{ padding }}>
          {footer}
        </div>
      )}
    </div>
  )
}
