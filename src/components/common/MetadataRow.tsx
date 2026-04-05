'use client'

import { type ReactNode, type CSSProperties } from 'react'
import { PALETTE, PALETTE_CSS, T, SPACING, ITEM_RULE } from '@/src/styles/tokens'

interface MetadataRowProps {
  /**
   * Label/key displayed on the left (typically 110px wide).
   * Example: "Court", "Docket No.", "Judges"
   */
  label: ReactNode
  /**
   * Value/content displayed on the right.
   * Can be a string, element, or complex component.
   */
  value: ReactNode
  /**
   * Optional custom styles for the entire row.
   */
  style?: CSSProperties
  /**
   * Optional custom label width. Defaults to 110px.
   */
  labelWidth?: string
}

/**
 * MetadataRow component — renders a two-column metadata row with label and value.
 *
 * Used extensively in CaseLawBox for rendering case metadata like court,
 * docket number, date, judges, disposition, etc.
 *
 * Layout:
 * - Left column: label (label width, muted color, mono font)
 * - Right column: value (flex-grow, prose font)
 * - Full-width rule separator between rows
 *
 * Usage:
 * ```tsx
 * <MetadataRow label="Court" value="Court of Appeals of Georgia, First Division" />
 * <MetadataRow label="Docket No." value="A24A1856" />
 * ```
 */
export function MetadataRow({
  label,
  value,
  style,
  labelWidth = '110px',
}: MetadataRowProps) {
  const labelStyle: CSSProperties = {
    ...T.micro,
    color: PALETTE_CSS.meta,
    minWidth: labelWidth,
    textAlign: 'left',
  }

  const valueStyle: CSSProperties = {
    ...T.prose,
    fontWeight: 400,
    lineHeight: 1.4,
    color: PALETTE.black,
    flex: 1,
    wordBreak: 'break-word',
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${labelWidth} 1fr`,
        gap: '0',
        ...ITEM_RULE,
        padding: `${SPACING.sm} 0`,
        alignItems: 'baseline',
        userSelect: 'text',
        ...style,
      }}
    >
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  )
}
