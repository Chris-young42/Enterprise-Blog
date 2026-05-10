import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'

type RequireRoleProps = {
  roles: string[]
  children: React.ReactNode
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole)
  const isAllowed = hasAnyRole(roles)

  if (!isAllowed) {
    return <Navigate to="/admin/forbidden" replace />
  }

  return <>{children}</>
}
