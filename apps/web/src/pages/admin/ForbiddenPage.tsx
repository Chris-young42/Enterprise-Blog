import { ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldX className="h-10 w-10 text-rose-500" />
      <h1 className="text-2xl font-semibold">无权限访问</h1>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">当前账号角色不具备此页面权限。</p>
      <Link
        to="/admin"
        className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950"
      >
        返回后台首页
      </Link>
    </div>
  )
}
