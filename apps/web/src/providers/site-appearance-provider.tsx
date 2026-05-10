import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchPublicAppearanceConfig, type AppearanceConfig } from '@/api/site-pages'
import { normalizeAppearance } from '@/lib/appearance'

type SiteAppearanceContextValue = {
  appearance: AppearanceConfig
  isLoading: boolean
}

const SiteAppearanceContext = createContext<SiteAppearanceContextValue | null>(null)

export function SiteAppearanceProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ['site', 'config', 'appearance'],
    queryFn: fetchPublicAppearanceConfig,
  })

  const value = useMemo<SiteAppearanceContextValue>(
    () => ({
      appearance: normalizeAppearance(query.data),
      isLoading: query.isLoading,
    }),
    [query.data, query.isLoading],
  )

  return <SiteAppearanceContext.Provider value={value}>{children}</SiteAppearanceContext.Provider>
}

export function useSiteAppearance() {
  const context = useContext(SiteAppearanceContext)
  if (!context) {
    throw new Error('useSiteAppearance must be used within SiteAppearanceProvider')
  }
  return context
}