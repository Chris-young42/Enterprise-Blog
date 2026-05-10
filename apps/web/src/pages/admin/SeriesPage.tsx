import { useQuery } from '@tanstack/react-query'
import { fetchSeries } from '@/api/content-taxonomy'
import type { SeriesItem } from '@/types/api'
import { ResourcePanel } from '@/components/admin/ResourcePanel'

export function SeriesPage() {
  const query = useQuery({
    queryKey: ['admin', 'series'],
    queryFn: fetchSeries,
  })

  const items: SeriesItem[] = query.data ?? []
  const error = query.error instanceof Error ? query.error.message : null

  return (
    <ResourcePanel
      title="专题管理"
      description="专题/文集/连载基础数据（当前为只读看板）"
      loading={query.isLoading}
      error={error}
      onReload={() => {
        void query.refetch()
      }}
      items={items}
      renderItem={(item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-sm font-medium">{item.title}</p>
          <p className="text-xs text-slate-500">
            slug: {item.slug} | sort: {item.sortOrder}
          </p>
        </div>
      )}
    />
  )
}
