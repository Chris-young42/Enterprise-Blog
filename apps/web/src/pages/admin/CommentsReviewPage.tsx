import {
  blockCommentUser,
  fetchBlockedCommentUsers,
  fetchCommentPolicy,
  fetchPendingComments,
  reviewComment,
  unblockCommentUser,
  updateCommentPolicy,
} from '@/api/comments'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function CommentsReviewPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [policyWordsText, setPolicyWordsText] = useState<string | null>(null)
  const [blockedUsersText, setBlockedUsersText] = useState<string | null>(null)
  const [cooldownText, setCooldownText] = useState<string | null>(null)
  const [maxPerHourText, setMaxPerHourText] = useState<string | null>(null)
  const [newBlockedUserId, setNewBlockedUserId] = useState('')

  const pendingQuery = useQuery({
    queryKey: ['admin', 'comments', 'pending', page],
    queryFn: () => fetchPendingComments(page, 10),
  })

  const policyQuery = useQuery({
    queryKey: ['admin', 'comments', 'policy'],
    queryFn: fetchCommentPolicy,
  })

  const blockedUsersQuery = useQuery({
    queryKey: ['admin', 'comments', 'blocked-users'],
    queryFn: fetchBlockedCommentUsers,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      reviewComment(id, { status }),
    onSuccess: () => {
      void pendingQuery.refetch()
    },
  })

  const policyMutation = useMutation({
    mutationFn: updateCommentPolicy,
    onSuccess: () => {
      setPolicyWordsText(null)
      setBlockedUsersText(null)
      setCooldownText(null)
      setMaxPerHourText(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments', 'policy'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments', 'blocked-users'] })
    },
  })

  const blockMutation = useMutation({
    mutationFn: (userId: string) => blockCommentUser(userId),
    onSuccess: () => {
      setNewBlockedUserId('')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments', 'policy'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments', 'blocked-users'] })
    },
  })

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => unblockCommentUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments', 'policy'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments', 'blocked-users'] })
    },
  })

  const applyPolicy = () => {
    const sensitiveWords = (policyWordsText ?? policyQuery.data?.sensitiveWords.join(',') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    const blockedUserIds = (blockedUsersText ?? policyQuery.data?.blockedUserIds.join(',') ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    const cooldownValue = Number(cooldownText ?? policyQuery.data?.commentCooldownSeconds ?? 30)
    const maxPerHourValue = Number(maxPerHourText ?? policyQuery.data?.commentMaxPerHour ?? 12)

    void policyMutation.mutateAsync({
      sensitiveWords,
      blockedUserIds,
      commentCooldownSeconds: Number.isNaN(cooldownValue) ? 30 : cooldownValue,
      commentMaxPerHour: Number.isNaN(maxPerHourValue) ? 12 : maxPerHourValue,
    })
  }

  const total = pendingQuery.data?.total ?? 0
  const pageSize = pendingQuery.data?.pageSize ?? 10
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">评论审核与策略</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">评论审核中心</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          支持人工审核 + 敏感词 + 频控 + 验证码 + 黑名单 + 邮件通知通道。
        </p>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>评论策略</CardTitle>
          <CardDescription>配置评论权限、审核模式、敏感词、频控与通知方式。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={policyQuery.data?.guestCommentEnabled ? 'default' : 'outline'}
              onClick={() =>
                void policyMutation.mutateAsync({
                  guestCommentEnabled: !(policyQuery.data?.guestCommentEnabled ?? true),
                })
              }
            >
              游客评论：{policyQuery.data?.guestCommentEnabled ? '开启' : '关闭'}
            </Button>
            <Button
              size="sm"
              variant={policyQuery.data?.reviewMode === 'MANUAL' ? 'default' : 'outline'}
              onClick={() =>
                void policyMutation.mutateAsync({
                  reviewMode: policyQuery.data?.reviewMode === 'MANUAL' ? 'MIXED' : 'MANUAL',
                })
              }
            >
              审核模式：{policyQuery.data?.reviewMode === 'MANUAL' ? '人工' : '混合'}
            </Button>
            <Button
              size="sm"
              variant={policyQuery.data?.autoReviewEnabled ? 'default' : 'outline'}
              onClick={() =>
                void policyMutation.mutateAsync({
                  autoReviewEnabled: !(policyQuery.data?.autoReviewEnabled ?? false),
                })
              }
            >
              自动放行：{policyQuery.data?.autoReviewEnabled ? '开启' : '关闭'}
            </Button>
            <Button
              size="sm"
              variant={policyQuery.data?.captchaRequired ? 'default' : 'outline'}
              onClick={() =>
                void policyMutation.mutateAsync({
                  captchaRequired: !(policyQuery.data?.captchaRequired ?? true),
                })
              }
            >
              评论验证码：{policyQuery.data?.captchaRequired ? '开启' : '关闭'}
            </Button>
            <Button
              size="sm"
              variant={policyQuery.data?.emailNotificationEnabled ? 'default' : 'outline'}
              onClick={() =>
                void policyMutation.mutateAsync({
                  emailNotificationEnabled: !(policyQuery.data?.emailNotificationEnabled ?? false),
                })
              }
            >
              邮件通知：{policyQuery.data?.emailNotificationEnabled ? '开启' : '关闭'}
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <Input
              placeholder="敏感词（英文逗号分隔）"
              value={policyWordsText ?? policyQuery.data?.sensitiveWords.join(',') ?? ''}
              onChange={(event) => setPolicyWordsText(event.target.value)}
            />
            <Input
              placeholder="黑名单用户ID（英文逗号分隔）"
              value={blockedUsersText ?? policyQuery.data?.blockedUserIds.join(',') ?? ''}
              onChange={(event) => setBlockedUsersText(event.target.value)}
            />
            <Input
              placeholder="评论冷却秒数（5-600）"
              value={cooldownText ?? `${policyQuery.data?.commentCooldownSeconds ?? 30}`}
              onChange={(event) => setCooldownText(event.target.value)}
            />
            <Input
              placeholder="每小时评论上限（1-500）"
              value={maxPerHourText ?? `${policyQuery.data?.commentMaxPerHour ?? 12}`}
              onChange={(event) => setMaxPerHourText(event.target.value)}
            />
          </div>
            <Button size="sm" onClick={applyPolicy} disabled={policyMutation.isPending}>
              保存策略配置
            </Button>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>黑名单可视化管理</CardTitle>
          <CardDescription>支持按用户ID添加与移除。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="输入要拉黑的用户ID"
              value={newBlockedUserId}
              onChange={(event) => setNewBlockedUserId(event.target.value)}
              className="w-80"
            />
            <Button
              size="sm"
              onClick={() => {
                const id = newBlockedUserId.trim()
                if (!id) return
                void blockMutation.mutateAsync(id)
              }}
            >
              添加黑名单
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(blockedUsersQuery.data ?? []).map((item) => (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <span>{item.nickname ?? item.username ?? item.id}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2"
                  onClick={() => void unblockMutation.mutateAsync(item.id)}
                >
                  移除
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>待审核评论</CardTitle>
          <CardDescription>
            当前 {total} 条待处理，页码 {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingQuery.isLoading ? <p className="text-sm text-slate-500">加载中...</p> : null}
          {pendingQuery.isError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
              {pendingQuery.error instanceof Error ? pendingQuery.error.message : '加载失败'}
            </p>
          ) : null}

          {(pendingQuery.data?.items ?? []).map((item) => {
            const reviewUserId = item.user?.id
            return (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500">commentId: {item.id}</p>
              <p className="mt-1 text-xs text-slate-500">
                用户：{item.user?.nickname ?? item.user?.username ?? '匿名用户'}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{item.content}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => void reviewMutation.mutateAsync({ id: item.id, status: 'APPROVED' })}
                >
                  通过
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void reviewMutation.mutateAsync({ id: item.id, status: 'REJECTED' })}
                >
                  拒绝
                </Button>
                {reviewUserId ? (
                  <Button size="sm" variant="outline" onClick={() => void blockMutation.mutateAsync(reviewUserId)}>
                    加入黑名单
                  </Button>
                ) : null}
              </div>
              </div>
            )
          })}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              下一页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
