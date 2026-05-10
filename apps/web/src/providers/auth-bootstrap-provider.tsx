import { useEffect, type ReactNode } from 'react'
import { fetchAuthMe } from '@/api/auth'
import { useAuthStore } from '@/store/auth-store'
import { HttpError } from '@/api/http'

export function AuthBootstrapProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token)
  const profile = useAuthStore((state) => state.profile)
  const setProfile = useAuthStore((state) => state.setProfile)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    let canceled = false
    if (!token || profile) {
      return
    }

    fetchAuthMe()
      .then((data) => {
        if (!canceled) {
          setProfile(data)
        }
      })
      .catch((error: unknown) => {
        if (canceled) {
          return
        }
        if (error instanceof HttpError && error.status === 401) {
          logout()
          return
        }
        setProfile(null)
      })

    return () => {
      canceled = true
    }
  }, [token, profile, setProfile, logout])

  return children
}
