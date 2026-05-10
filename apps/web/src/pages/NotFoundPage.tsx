import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">404</p>
      <h1 className="text-4xl font-semibold">页面不存在</h1>
      <p className="max-w-md text-slate-500 dark:text-slate-400">你访问的路由暂时还没有接入。</p>
      <Link
        to="/"
        className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
      >
        返回首页
      </Link>
    </div>
  )
}
