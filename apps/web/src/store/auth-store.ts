import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { tokenStorage } from '@/lib/storage'
import type { AuthUser, UserProfile } from '@/types/api'

type AuthState = {
  token: string | null
  user: AuthUser | null
  profile: UserProfile | null
  isHydrated: boolean
  setTokenAndUser: (token: string, user: AuthUser) => void
  setProfile: (profile: UserProfile | null) => void
  setHydrated: (hydrated: boolean) => void
  logout: () => void
  hasAnyRole: (roles: string[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      profile: null,
      isHydrated: false,
      setTokenAndUser: (token, user) => {
        tokenStorage.set(token)
        set({ token, user })
      },
      setProfile: (profile) => set({ profile }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      logout: () => {
        tokenStorage.clear()
        set({ token: null, user: null, profile: null })
      },
      hasAnyRole: (roles) => {
        const current = get().user
        if (!current) {
          return false
        }
        return roles.some((role) => current.roleCodes.includes(role))
      },
    }),
    {
      name: 'enterprise-blog-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true)
        }
      },
    },
  ),
)
