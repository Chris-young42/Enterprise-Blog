import { followUser, fetchUserFollowers, fetchUserFollowing, fetchUserProfile, unfollowUser } from '@/api/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'
import type { UserFollowCard } from '@/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function avatarLabel(name: string) {
  return name.slice(0, 1).toUpperCase()
}

function UserCard({ item }: { item: UserFollowCard }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
        {avatarLabel(item.nickname ?? item.username)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{item.nickname ?? item.username}</p>
          {item.isMutual ? <Badge>互相关注</Badge> : null}
        </div>
        <p className="text-xs text-slate-500">@{item.username}</p>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          {item.signature ?? item.bio ?? '暂无简介'}
        </p>
      </div>
    </div>
  )
}

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const [tab, setTab] = useState<'followers' | 'following'>('followers')

  const profileQuery = useQuery({
    queryKey: ['site', 'users', id],
    queryFn: () => fetchUserProfile(id ?? ''),
    enabled: Boolean(id),
  })

  const followersQuery = useQuery({
    queryKey: ['site', 'users', id, 'followers'],
    queryFn: () => fetchUserFollowers(id ?? ''),
    enabled: Boolean(id),
  })

  const followingQuery = useQuery({
    queryKey: ['site', 'users', id, 'following'],
    queryFn: () => fetchUserFollowing(id ?? ''),
    enabled: Boolean(id),
  })

  const followMutation = useMutation({
    mutationFn: () => followUser(id ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site', 'users', id] })
      void queryClient.invalidateQueries({ queryKey: ['site', 'users', id, 'followers'] })
      void queryClient.invalidateQueries({ queryKey: ['site', 'users', id, 'following'] })
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(id ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['site', 'users', id] })
      void queryClient.invalidateQueries({ queryKey: ['site', 'users', id, 'followers'] })
      void queryClient.invalidateQueries({ queryKey: ['site', 'users', id, 'following'] })
    },
  })

  const profile = profileQuery.data ?? null
  const list = useMemo(() => {
    return tab === 'followers' ? followersQuery.data ?? [] : followingQuery.data ?? []
  }, [followersQuery.data, followingQuery.data, tab])

  if (!id) {
    return <p className="text-sm text-slate-500">用户地址无效。</p>
  }

  if (profileQuery.isLoading) {
    return <p className="text-sm text-slate-500">个人主页加载中...</p>
  }

  if (profileQuery.isError) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
        {profileQuery.error instanceof Error ? profileQuery.error.message : '加载失败'}
      </p>
    )
  }

  if (!profile) {
    return <p className="text-sm text-slate-500">用户不存在。</p>
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-2xl font-semibold text-white dark:bg-white dark:text-slate-950">
                {avatarLabel(profile.nickname ?? profile.username)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{profile.nickname ?? profile.username}</h1>
                  {profile.isSelf ? <Badge>我自己</Badge> : null}
                </div>
                <p className="text-sm text-slate-500">@{profile.username}</p>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                  {profile.signature ?? profile.bio ?? '这个用户还没有写简介。'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.isSelf ? (
                <Button asChild variant="outline">
                  <Link to="/admin/users">编辑资料</Link>
                </Button>
              ) : currentUser ? (
                profile.isFollowing ? (
                  <Button
                    variant="outline"
                    onClick={() => void unfollowMutation.mutateAsync()}
                    disabled={unfollowMutation.isPending}
                  >
                    取消关注
                  </Button>
                ) : (
                  <Button onClick={() => void followMutation.mutateAsync()} disabled={followMutation.isPending}>
                    关注
                  </Button>
                )
              ) : (
                <Button asChild>
                  <Link to="/auth/login">登录后关注</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['文章', profile.articleCount],
          ['粉丝', profile.followerCount],
          ['关注', profile.followingCount],
        ].map(([label, value]) => (
          <Card key={label} className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle>{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant={tab === 'followers' ? 'default' : 'outline'} onClick={() => setTab('followers')}>
                粉丝
              </Button>
              <Button size="sm" variant={tab === 'following' ? 'default' : 'outline'} onClick={() => setTab('following')}>
                关注
              </Button>
            </div>
            <CardDescription>展示 {tab === 'followers' ? '粉丝' : '关注'} 列表。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {list.length === 0 ? <p className="text-sm text-slate-500">暂无数据。</p> : null}
            {list.map((item) => (
              <UserCard key={`${tab}-${item.id}-${item.followedAt}`} item={item} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>主页信息</CardTitle>
            <CardDescription>公开资料与关注状态。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              个人主页：{profile.website ?? '未填写'}
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              所在地：{profile.location ?? '未填写'}
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              {profile.isFollowing ? '你已关注该用户' : '你还未关注该用户'}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
