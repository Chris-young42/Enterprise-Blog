import { createContext, useContext, type ReactNode } from 'react'
import { useThemeMode } from '@/hooks/use-theme'

type ThemeContextValue = ReturnType<typeof useThemeMode>

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useThemeMode()
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}