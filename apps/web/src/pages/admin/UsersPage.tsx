import { useQuery } from '@tanstack/react-query'
import { fetchMyProfile } from '@/api/users'
import type { UserProfile } from '@/types/api'
import { ResourcePanel } from '@/components/admin/ResourcePanel'

export function UsersPage() {
  const query = useQuery({
    queryKey: ['admin', 'users', 'me'],
    queryFn: fetchMyProfile,
  })

  const profile: UserProfile | null = query.data ?? null
  const error = query.error instanceof Error ? query.error.message : null

  return (
    <ResourcePanel
      title="用户信息"
      description="当前登录用户基础资料（后续扩展用户列表、关注粉丝、黑名单管理）"
      loading={query.isLoading}
      error={error}
      onReload={() => {
        void query.refetch()
      }}
      items={profile ? [profile] : []}
      renderItem={(item) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-sm font-medium">{item.nickname ?? item.username}</p>
          <p className="text-xs text-slate-500">{item.email}</p>
          <p className="mt-1 text-xs text-slate-500">角色：{item.roleCodes.join(' / ')}</p>
        </div>
      )}
    />
  )
}
