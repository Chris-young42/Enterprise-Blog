import { useQuery } from '@tanstack/react-query'
import { fetchRoles } from '@/api/content-taxonomy'
import type { RoleListItem } from '@/types/api'
import { ResourcePanel } from '@/components/admin/ResourcePanel'

export function RolesPage() {
  const query = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: fetchRoles,
  })

  const items: RoleListItem[] = query.data ?? []
  const error =
    query.error instanceof Error ? query.error.message : '加载失败（需要管理员角色）'

  return (
    <ResourcePanel
      title="角色权限"
      description="RBAC 可视化（仅管理员可见）"
      loading={query.isLoading}
      error={query.isError ? error : null}
      onReload={() => {
        void query.refetch()
      }}
      items={items}
      renderItem={(item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-sm font-semibold">{item.name}</p>
          <p className="text-xs text-slate-500">{item.code}</p>
          <p className="mt-2 text-xs text-slate-500">权限数：{item.permissions.length}</p>
        </div>
      )}
    />
  )
}
