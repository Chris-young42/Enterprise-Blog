import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type ResourcePanelProps<T> = {
  title: string
  description: string
  loading: boolean
  error: string | null
  onReload: () => void
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

export function ResourcePanel<T>({
  title,
  description,
  loading,
  error,
  onReload,
  items,
  renderItem,
}: ResourcePanelProps<T>) {
  return (
    <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
            {error}
          </p>
        ) : null}
        {loading ? <p className="text-sm text-slate-500">加载中...</p> : null}
        {!loading && items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">暂无数据</p>
        ) : null}
        {!loading && items.length > 0 ? (
          <div className="space-y-2">{items.map((item) => renderItem(item))}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}
