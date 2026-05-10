import { useQuery } from '@tanstack/react-query'
import { fetchTags } from '@/api/content-taxonomy'
import type { TagItem } from '@/types/api'
import { ResourcePanel } from '@/components/admin/ResourcePanel'

export function TagsPage() {
  const query = useQuery({
    queryKey: ['admin', 'tags'],
    queryFn: fetchTags,
  })

  const items: TagItem[] = query.data ?? []
  const error = query.error instanceof Error ? query.error.message : null

  return (
    <ResourcePanel
      title="标签管理"
      description="文章标签体系（当前为只读看板，下一阶段接入管理表单）"
      loading={query.isLoading}
      error={error}
      onReload={() => {
        void query.refetch()
      }}
      items={items}
      renderItem={(item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-xs text-slate-500">slug: {item.slug}</p>
        </div>
      )}
    />
  )
}
