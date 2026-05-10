import { batchRemoveMessageBoard, batchReviewMessageBoard, fetchAdminMessageBoardByQuery, reviewMessageBoard } from '@/api/site-pages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function MessageBoardAdminPage() {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [anonymousFilter, setAnonymousFilter] = useState<'ALL' | 'true' | 'false'>('ALL')

  const listQuery = useQuery({
    queryKey: ['admin', 'message-board', statusFilter, anonymousFilter],
    queryFn: () =>
      fetchAdminMessageBoardByQuery({
        ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
        ...(anonymousFilter === 'ALL' ? {} : { isAnonymous: anonymousFilter === 'true' }),
      }),
  })

  const refresh = () => {
    setSelectedIds([])
    void queryClient.invalidateQueries({ queryKey: ['admin', 'message-board'] })
  }

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' }) => reviewMessageBoard(id, status),
    onSuccess: () => refresh(),
  })

  const batchMutation = useMutation({
    mutationFn: ({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) => batchReviewMessageBoard(selectedIds, status),
    onSuccess: () => refresh(),
  })

  const batchRemoveMutation = useMutation({
    mutationFn: () => batchRemoveMessageBoard(selectedIds),
    onSuccess: () => refresh(),
  })

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第8阶段深化</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">留言审核</h1>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={statusFilter === 'ALL' ? 'default' : 'outline'} onClick={() => setStatusFilter('ALL')}>
            全部状态
          </Button>
          <Button size="sm" variant={statusFilter === 'PENDING' ? 'default' : 'outline'} onClick={() => setStatusFilter('PENDING')}>
            待审核
          </Button>
          <Button size="sm" variant={statusFilter === 'APPROVED' ? 'default' : 'outline'} onClick={() => setStatusFilter('APPROVED')}>
            已通过
          </Button>
          <Button size="sm" variant={statusFilter === 'REJECTED' ? 'default' : 'outline'} onClick={() => setStatusFilter('REJECTED')}>
            已拒绝
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={anonymousFilter === 'ALL' ? 'default' : 'outline'} onClick={() => setAnonymousFilter('ALL')}>
            全部身份
          </Button>
          <Button size="sm" variant={anonymousFilter === 'true' ? 'default' : 'outline'} onClick={() => setAnonymousFilter('true')}>
            仅匿名
          </Button>
          <Button size="sm" variant={anonymousFilter === 'false' ? 'default' : 'outline'} onClick={() => setAnonymousFilter('false')}>
            仅实名
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={selectedIds.length === 0} onClick={() => void batchMutation.mutateAsync({ status: 'APPROVED' })}>
            批量通过（{selectedIds.length}）
          </Button>
          <Button size="sm" variant="outline" disabled={selectedIds.length === 0} onClick={() => void batchMutation.mutateAsync({ status: 'REJECTED' })}>
            批量拒绝
          </Button>
          <Button size="sm" variant="secondary" disabled={selectedIds.length === 0} onClick={() => void batchRemoveMutation.mutateAsync()}>
            批量删除
          </Button>
        </div>

        {(listQuery.data ?? []).map((item) => (
          <Card key={item.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle className="text-base">状态：{item.status} / 身份：{item.isAnonymous ? '匿名' : '实名'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={(event) =>
                    setSelectedIds((prev) =>
                      event.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id),
                    )
                  }
                />
                选中
              </label>
              <p>{item.content}</p>
              <p className="text-xs text-slate-500">敏感词命中：{item.sensitiveHits && item.sensitiveHits.length > 0 ? item.sensitiveHits.join('、') : '无'}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void reviewMutation.mutateAsync({ id: item.id, status: 'APPROVED' })}>通过</Button>
                <Button size="sm" variant="outline" onClick={() => void reviewMutation.mutateAsync({ id: item.id, status: 'REJECTED' })}>拒绝</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
