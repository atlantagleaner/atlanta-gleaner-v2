const fs = require('fs')
const path = require('path')

const themesPath = path.resolve(process.cwd(), 'src/styles/themes.ts')
const cssPath = path.resolve(process.cwd(), 'app/globals.css')

function extractMatchedBraces(str, startIndex) {
  let depth = 0
  let inString = false
  let stringChar = ''
  let result = ''

  for (let i = startIndex; i < str.length; i++) {
    const char = str[i]
    const prevChar = i > 0 ? str[i - 1] : ''

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

function parseThemesTs() {
  const content = fs.readFileSync(themesPath, 'utf8')
  if (!content.match(/export const THEMES = \{/)) {
    console.error('❌ Could not find THEMES export in src/styles/themes.ts')
    process.exit(1)
  }

  const themes = {}
  for (const themeName of ['default', 'classical', 'matrix']) {
    const themeStart = content.indexOf(`${themeName}: {`)
    if (themeStart === -1) continue

    const braceStart = content.indexOf('{', themeStart)
    const themeContent = extractMatchedBraces(content, braceStart + 1)

    const palette = {}
    const paletteStart = themeContent.indexOf('palette: {')
    if (paletteStart !== -1) {
      const paletteBraceStart = themeContent.indexOf('{', paletteStart)
      const paletteContent = extractMatchedBraces(themeContent, paletteBraceStart + 1)
      let match
      const colorRegex = /(\w+):\s*'#([0-9A-Fa-f]{6})'/g
      while ((match = colorRegex.exec(paletteContent)) !== null) {
        palette[match[1]] = `#${match[2]}`
      }
    }

    const interactive = {}
    const interactiveStart = themeContent.indexOf('interactive: {')
    if (interactiveStart !== -1) {
      const interactiveBraceStart = themeContent.indexOf('{', interactiveStart)
      const interactiveContent = extractMatchedBraces(themeContent, interactiveBraceStart + 1)
      let match
      const interactiveRegex = /(\w+):\s*'(#[0-9A-Fa-f]{6}|rgba\([^)]+\))'/g
      while ((match = interactiveRegex.exec(interactiveContent)) !== null) {
        interactive[match[1]] = match[2]
      }
    }

    themes[themeName] = { palette, interactive }
  }

  return themes
}

function parseVariables(block) {
  const vars = {}
  let match
  const varPattern = /--(palette-[\w-]+|interactive-[\w-]+):\s*([^;]+);/g
  while ((match = varPattern.exec(block)) !== null) {
    vars[match[1]] = match[2].trim()
  }
  return vars
}

function parseGlobalsCss() {
  const content = fs.readFileSync(cssPath, 'utf8')
  const themes = {}

  const rootMatch = content.match(/:root\s*\{([\s\S]*?)\}/m)
  if (rootMatch) {
    themes.default = parseVariables(rootMatch[1])
  }

  const themePattern = /\[data-theme="(\w+)"\]\s*\{([\s\S]*?)\}/g
  let match
  while ((match = themePattern.exec(content)) !== null) {
    themes[match[1]] = parseVariables(match[2])
  }

  return themes
}

function validate() {
  console.log('🔍 Validating palette sync between themes.ts and globals.css...\n')

  const tsThemes = parseThemesTs()
  const cssThemes = parseGlobalsCss()
  const errors = []

  for (const [themeName, theme] of Object.entries(tsThemes)) {
    if (!cssThemes[themeName]) {
      errors.push(`❌ Theme "${themeName}" found in themes.ts but not in globals.css`)
      continue
    }

    const cssVars = cssThemes[themeName]

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

  if (errors.length > 0) {
    console.error(errors.join('\n'))
    console.error(`\n❌ Sync validation FAILED with ${errors.length} error(s)`)
    console.error(
      '\n⚠️  REMEDIATION:\n' +
      '   1. themes.ts is the source of truth for palette values\n' +
      '   2. Update the corresponding [data-theme="..."] selector in app/globals.css\n' +
      '   3. Keep --palette-white, --palette-warm, --palette-black, --palette-accent in sync\n' +
      '   4. Update interactive variables if they changed'
    )
    process.exit(1)
  }

  console.log('✅ Palette sync validation PASSED')
  console.log(`   Verified ${Object.keys(tsThemes).length} themes:`)
  for (const themeName of Object.keys(tsThemes)) {
    const themeData = tsThemes[themeName]
    const colorCount = Object.keys(themeData.palette).length
    if (colorCount > 0) {
      console.log(
        `   • ${themeName}: ` +
        Object.entries(themeData.palette).map(([k, v]) => `${k}=${v}`).join(', ')
      )
    }
  }
}

validate()
