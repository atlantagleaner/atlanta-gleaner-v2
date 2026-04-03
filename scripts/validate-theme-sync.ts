/**
 * validate-theme-sync.ts
 *
 * Validates that src/styles/themes.ts and app/globals.css are in sync.
 *
 * This script:
 * 1. Imports THEMES from src/styles/themes.ts (single source of truth)
 * 2. Parses app/globals.css for CSS variable declarations
 * 3. Verifies all theme names and palette values exist in both files
 * 4. Reports mismatches and exits with code 1 if sync fails
 *
 * Run with: npx ts-node scripts/validate-theme-sync.ts
 */

import * as fs from 'fs'
import * as path from 'path'

// Import the themes (source of truth)
const themesPath = path.resolve(process.cwd(), 'src/styles/themes.ts')
// We can't directly import the TS file at runtime, so we'll parse it
// For now, we'll read and eval it or use regex to extract the values

interface ParsedTheme {
  palette: {
    white?: string
    warm?: string
    black?: string
    accent?: string
  }
  interactive: {
    [key: string]: string
  }
}

interface ParsedThemes {
  [key: string]: ParsedTheme
}

// Parse themes.ts to extract THEMES object using helper function
function extractMatchedBraces(str: string, startIndex: number): string {
  let depth = 0
  let inString = false
  let stringChar = ''
  let result = ''

  for (let i = startIndex; i < str.length; i++) {
    const char = str[i]
    const prevChar = i > 0 ? str[i - 1] : ''

    // Handle strings
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
      }
    }

    if (inString) {
      result += char
      continue
    }

    if (char === '{') {
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0) {
        return result
      }
    }

    result += char
  }

  return result
}

function parseThemesTs(): ParsedThemes {
  const content = fs.readFileSync(themesPath, 'utf-8')

  // Extract the whole THEMES export block
  const themesMatch = content.match(/export const THEMES = \{/)
  if (!themesMatch) {
    console.error('❌ Could not find THEMES export in src/styles/themes.ts')
    process.exit(1)
  }

  const themes: ParsedThemes = {}
  const themeNames = ['default', 'classical', 'matrix']

  for (const themeName of themeNames) {
    // Find where this theme starts
    const themeStart = content.indexOf(`${themeName}: {`)
    if (themeStart === -1) continue

    const braceStart = content.indexOf('{', themeStart)
    const themeContent = extractMatchedBraces(content, braceStart + 1)

    // Extract palette section
    const palette: ParsedTheme['palette'] = {}
    const paletteStart = themeContent.indexOf('palette: {')
    if (paletteStart !== -1) {
      const paletteBraceStart = themeContent.indexOf('{', paletteStart)
      const paletteContent = extractMatchedBraces(themeContent, paletteBraceStart + 1)

      // Match color definitions: white: '#FFFFFF'
      const colorRegex = /(\w+):\s*'#([0-9A-Fa-f]{6})'/g
      let m
      while ((m = colorRegex.exec(paletteContent)) !== null) {
        palette[m[1] as keyof typeof palette] = `#${m[2]}`
      }
    }

    // Extract interactive section
    const interactive: ParsedTheme['interactive'] = {}
    const interactiveStart = themeContent.indexOf('interactive: {')
    if (interactiveStart !== -1) {
      const interactiveBraceStart = themeContent.indexOf('{', interactiveStart)
      const interactiveContent = extractMatchedBraces(themeContent, interactiveBraceStart + 1)

      // Match interactive color definitions
      const interactiveRegex = /(\w+):\s*'(#[0-9A-Fa-f]{6}|rgba\([^)]+\))'/g
      let m
      while ((m = interactiveRegex.exec(interactiveContent)) !== null) {
        interactive[m[1]] = m[2]
      }
    }

    themes[themeName] = { palette, interactive }
  }

  return themes
}

// Parse app/globals.css to extract theme definitions
function parseGlobalsCss(): { [themeName: string]: { [varName: string]: string } } {
  const cssPath = path.resolve(process.cwd(), 'app/globals.css')
  const content = fs.readFileSync(cssPath, 'utf-8')

  const themes: { [themeName: string]: { [varName: string]: string } } = {}

  // Parse :root block
  const rootMatch = content.match(/:root\s*\{([\s\S]*?)\}/m)
  if (rootMatch) {
    themes['default'] = parseVariables(rootMatch[1])
  }

  // Parse [data-theme="..."] blocks
  const themePattern = /\[data-theme="(\w+)"\]\s*\{([\s\S]*?)\}/g
  let match
  while ((match = themePattern.exec(content)) !== null) {
    themes[match[1]] = parseVariables(match[2])
  }

  return themes
}

function parseVariables(block: string): { [varName: string]: string } {
  const vars: { [varName: string]: string } = {}
  const varPattern = /--(palette-[\w-]+|interactive-[\w-]+):\s*([^;]+);/g
  let match
  while ((match = varPattern.exec(block)) !== null) {
    vars[match[1]] = match[2].trim()
  }
  return vars
}

// Main validation logic
function validate() {
  console.log('🔍 Validating palette sync between themes.ts and globals.css...\n')

  const tsThemes = parseThemesTs()
  const cssThemes = parseGlobalsCss()

  const errors: string[] = []

  // Check each theme in themes.ts
  for (const [themeName, theme] of Object.entries(tsThemes)) {
    if (!cssThemes[themeName]) {
      errors.push(`❌ Theme "${themeName}" found in themes.ts but not in globals.css`)
      continue
    }

    const cssVars = cssThemes[themeName]

    // Check palette colors
    for (const [colorName, colorValue] of Object.entries(theme.palette)) {
      const varName = `palette-${colorName}`
      const cssValue = cssVars[varName]
      if (!cssValue) {
        errors.push(`❌ Palette variable "${varName}" for theme "${themeName}" not found in globals.css`)
      } else if (cssValue.toUpperCase() !== colorValue.toUpperCase()) {
        errors.push(
          `❌ Color mismatch for ${themeName}.${colorName}:\n` +
          `   themes.ts: ${colorValue}\n` +
          `   globals.css: ${cssValue}`
        )
      }
    }

    // Check interactive state colors
    for (const [stateName, stateValue] of Object.entries(theme.interactive)) {
      const varName = `interactive-${stateName
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')}`
      const cssValue = cssVars[varName]
      if (cssValue && cssValue.toUpperCase() !== stateValue.toUpperCase()) {
        errors.push(
          `❌ Interactive color mismatch for ${themeName}.${stateName}:\n` +
          `   themes.ts: ${stateValue}\n` +
          `   globals.css: ${cssValue}`
        )
      }
    }
  }

  // Report results
  if (errors.length > 0) {
    console.error(errors.join('\n'))
    console.error(`\n❌ Sync validation FAILED with ${errors.length} error(s)`)
    console.error(
      '\n⚠️  REMEDIATION:\n' +
      '   1. themes.ts is the source of truth for palette values\n' +
      '   2. Update the corresponding [data-theme="..."] selector in app/globals.css\n' +
      '   3. Keep --palette-white, --palette-warm, --palette-black, --palette-accent in sync\n' +
      '   4. Update --palette-hover-bg if it changed'
    )
    process.exit(1)
  }

  console.log('✅ Palette sync validation PASSED')
  console.log(`   Verified ${Object.keys(tsThemes).length} themes:`)
  for (const themeName of Object.keys(tsThemes)) {
    const themeData = tsThemes[themeName]
    const colorCount = Object.keys(themeData.palette).length
    if (colorCount > 0) {
      console.log(`   • ${themeName}:`, Object.entries(themeData.palette).map(([k, v]) => `${k}=${v}`).join(', '))
    }
  }
}

validate()
