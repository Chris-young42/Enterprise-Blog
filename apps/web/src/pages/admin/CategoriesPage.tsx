import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '@/api/content-taxonomy'
import type { CategoryItem } from '@/types/api'
import { ResourcePanel } from '@/components/admin/ResourcePanel'

export function CategoriesPage() {
  const query = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: fetchCategories,
  })

  const items: CategoryItem[] = query.data ?? []
  const error = query.error instanceof Error ? query.error.message : null

  return (
    <ResourcePanel
      title="分类管理"
      description="支持多级分类配置（当前为只读看板，下一阶段接入表单增删改）"
      loading={query.isLoading}
      error={error}
      onReload={() => {
        void query.refetch()
      }}
      items={items}
      renderItem={(item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-xs text-slate-500">
            slug: {item.slug} | sort: {item.sortOrder}
          </p>
          {item.parentId ? <p className="text-xs text-slate-500">parent: {item.parentId}</p> : null}
        </div>
      )}
    />
  )
}
