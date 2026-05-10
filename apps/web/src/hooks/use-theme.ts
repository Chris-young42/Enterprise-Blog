import { useEffect, useMemo, useState } from 'react'
import { useSiteAppearance } from '@/providers/site-appearance-provider'

export type ThemeMode = 'light' | 'dark' | 'system'

const storageKey = 'enterprise-blog-theme'

export function useThemeMode() {
  const { appearance } = useSiteAppearance()
  const [manualTheme, setManualTheme] = useState<'light' | 'dark' | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem(storageKey)
    if (stored === 'light' || stored === 'dark') return stored
    return null
  })

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setSystemTheme(media.matches ? 'dark' : 'light')
    handler()
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const themeMode = appearance.themeMode
  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (manualTheme) return manualTheme
    if (themeMode === 'light') return 'light'
    if (themeMode === 'dark') return 'dark'
    return systemTheme
  }, [manualTheme, systemTheme, themeMode])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolvedTheme
    root.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const setTheme = (theme: 'light' | 'dark') => {
    setManualTheme(theme)
    window.localStorage.setItem(storageKey, theme)
  }

  const clearManualTheme = () => {
    setManualTheme(null)
    window.localStorage.removeItem(storageKey)
  }

  return useMemo(
    () => ({
      theme: resolvedTheme,
      themeMode,
      setTheme,
      clearManualTheme,
      toggleTheme: () => {
        if (resolvedTheme === 'dark') {
          setTheme('light')
          return
        }
        setTheme('dark')
      },
    }),
    [resolvedTheme, themeMode],
  )
}