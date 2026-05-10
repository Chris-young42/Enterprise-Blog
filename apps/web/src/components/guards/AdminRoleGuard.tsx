import { Outlet } from 'react-router-dom'
import { RequireRole } from './RequireRole'

export function AdminRoleGuard() {
  return (
    <RequireRole roles={['SUPER_ADMIN', 'ADMIN']}>
      <Outlet />
    </RequireRole>
  )
}
