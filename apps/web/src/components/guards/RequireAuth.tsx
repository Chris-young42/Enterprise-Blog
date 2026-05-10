import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const location = useLocation()

  if (!isHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        正在恢复登录状态...
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
