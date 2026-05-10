import { createMessageBoard, fetchMessageBoard } from '@/api/site-pages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

export function MessageBoardPage() {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'latest' | 'oldest'>('latest')

  const listQuery = useQuery({
    queryKey: ['site', 'message-board', page, sort],
    queryFn: () => fetchMessageBoard({ page, pageSize: 10, sort }),
  })

  const createMutation = useMutation({
    mutationFn: createMessageBoard,
    onSuccess: () => {
      setContent('')
      setPage(1)
      void queryClient.invalidateQueries({ queryKey: ['site', 'message-board'] })
    },
  })

  const totalPages = useMemo(() => {
    const total = listQuery.data?.total ?? 0
    const pageSize = listQuery.data?.pageSize ?? 10
    return Math.max(1, Math.ceil(total / pageSize))
  }, [listQuery.data])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Badge className="mb-2">留言板</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">匿名树洞留言</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>发表留言</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="写下你的留言..." value={content} onChange={(event) => setContent(event.target.value)} />
          <Button onClick={() => void createMutation.mutateAsync({ content: content.trim(), isAnonymous: true })}>
            提交留言
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button size="sm" variant={sort === 'latest' ? 'default' : 'outline'} onClick={() => setSort('latest')}>
          最新优先
        </Button>
        <Button size="sm" variant={sort === 'oldest' ? 'default' : 'outline'} onClick={() => setSort('oldest')}>
          最早优先
        </Button>
      </div>

      <div className="space-y-3">
        {(listQuery.data?.items ?? []).map((item) => (
          <Card key={item.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardContent className="p-4 text-sm">
              <p>{item.content}</p>
              <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString('zh-CN')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
          上一页
        </Button>
        <span className="text-xs text-slate-500">
          第 {page} / {totalPages} 页
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}
