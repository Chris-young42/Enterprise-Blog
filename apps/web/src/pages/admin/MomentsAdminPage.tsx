import { createMoment, deleteMoment, fetchMoments, updateMoment } from '@/api/moments'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function MomentsAdminPage() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingSummary, setEditingSummary] = useState('')
  const [editingContent, setEditingContent] = useState('')

  const listQuery = useQuery({
    queryKey: ['admin', 'moments'],
    queryFn: () => fetchMoments(false),
  })

  const refreshMoments = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'moments'] })
    void queryClient.invalidateQueries({ queryKey: ['site', 'moments'] })
    void queryClient.invalidateQueries({ queryKey: ['site', 'timeline'] })
  }

  const createMutation = useMutation({
    mutationFn: createMoment,
    onSuccess: () => {
      setTitle('')
      setContent('')
      refreshMoments()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateMoment>[1] }) => updateMoment(id, payload),
    onSuccess: () => {
      setEditingId(null)
      setEditingTitle('')
      setEditingSummary('')
      setEditingContent('')
      refreshMoments()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMoment,
    onSuccess: () => {
      refreshMoments()
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第8阶段深化</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">随笔动态管理</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>发布动态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="标题" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input placeholder="内容" value={content} onChange={(event) => setContent(event.target.value)} />
          <Button onClick={() => void createMutation.mutateAsync({ title: title.trim(), content: content.trim(), isPublished: true })}>
            发布动态
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {(listQuery.data ?? []).map((item) => (
          <Card key={item.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardContent className="p-4 text-sm">
              <p className="font-medium">{item.title}</p>
              <p className="text-slate-500">{item.summary ?? '无摘要'}</p>
              <p className="line-clamp-2 text-xs text-slate-500">{item.content}</p>
              <p className="mt-1 text-xs text-slate-500">
                状态：{item.isPublished ? '已发布' : '草稿'} / Slug：{item.slug}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(item.id)
                    setEditingTitle(item.title)
                    setEditingSummary(item.summary ?? '')
                    setEditingContent(item.content)
                  }}
                >
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant={item.isPublished ? 'secondary' : 'default'}
                  onClick={() =>
                    void updateMutation.mutateAsync({ id: item.id, payload: { isPublished: !item.isPublished } })
                  }
                >
                  {item.isPublished ? '转为草稿' : '发布'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void deleteMutation.mutateAsync(item.id)}>
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingId ? (
        <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>编辑动态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="标题" value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
            <Input placeholder="摘要" value={editingSummary} onChange={(event) => setEditingSummary(event.target.value)} />
            <Input placeholder="内容" value={editingContent} onChange={(event) => setEditingContent(event.target.value)} />
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  void updateMutation.mutateAsync({
                    id: editingId,
                    payload: {
                      title: editingTitle.trim(),
                      summary: editingSummary.trim() || null,
                      content: editingContent.trim(),
                    },
                  })
                }
              >
                保存
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null)
                  setEditingTitle('')
                  setEditingSummary('')
                  setEditingContent('')
                }}
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
