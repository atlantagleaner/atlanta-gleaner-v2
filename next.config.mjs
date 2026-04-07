import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Validate palette sync before build
function validateThemeSync() {
  try {
    execSync('node scripts/validate-theme-sync.js', {
      cwd: __dirname,
      stdio: 'inherit',
    })
  } catch (error) {
    console.error('\n❌ Build failed: Palette sync validation error')
    console.error(
      '⚠️  Make sure src/styles/themes.ts and app/globals.css are in sync.\n' +
      '   themes.ts is the source of truth.'
    )
    process.exit(1)
  }
}

// Run validation during the build config phase
if (process.env.NODE_ENV === 'production' || process.argv.includes('build')) {
  validateThemeSync()
}

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default nextConfig
