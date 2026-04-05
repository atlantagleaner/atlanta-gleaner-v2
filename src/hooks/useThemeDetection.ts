import { useState, useEffect } from 'react'

/**
 * Hook that detects the current theme from [data-theme] attribute on document.documentElement.
 * Updates when theme changes via MutationObserver.
 *
 * @param targetTheme - Optional theme name to check for. If provided, returns boolean. Otherwise returns the theme string.
 * @returns Boolean if targetTheme is provided, otherwise the theme string ('default', 'classical', 'matrix', etc.)
 */
export function useThemeDetection(targetTheme?: string) {
  const [theme, setTheme] = useState<string>('')

  useEffect(() => {
    const html = document.documentElement
    const checkTheme = () => {
      const currentTheme = html.dataset.theme || 'default'
      setTheme(currentTheme)
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  if (targetTheme) {
    return theme === targetTheme
  }
  return theme
}
