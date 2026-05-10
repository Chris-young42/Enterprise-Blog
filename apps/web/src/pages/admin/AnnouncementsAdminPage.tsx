import { createAnnouncement, deleteAnnouncement, fetchAdminAnnouncements, updateAnnouncement } from '@/api/site-pages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function AnnouncementsAdminPage() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')

  const listQuery = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: fetchAdminAnnouncements,
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] })
    void queryClient.invalidateQueries({ queryKey: ['site', 'announcements'] })
  }

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      setTitle('')
      setContent('')
      setStartsAt('')
      setEndsAt('')
      refresh()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateAnnouncement(id, { isActive }),
    onSuccess: () => {
      refresh()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      refresh()
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第8阶段深化</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">公告管理</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>新建公告</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="公告标题" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input placeholder="公告内容" value={content} onChange={(event) => setContent(event.target.value)} />
          <Input
            type="datetime-local"
            placeholder="开始时间"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          <Input
            type="datetime-local"
            placeholder="结束时间"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
          <Button
            onClick={() => {
              const payload = {
                title: title.trim(),
                content: content.trim(),
                isPopup: true,
                isActive: true,
                ...(startsAt ? { startsAt: new Date(startsAt).toISOString() } : {}),
                ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
              }
              void createMutation.mutateAsync(payload)
            }}
          >
            发布公告
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {(listQuery.data ?? []).map((item) => (
          <Card key={item.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="font-medium">{item.title}</p>
              <p className="text-slate-500">{item.content}</p>
              <p className="text-xs text-slate-500">
                时间窗：{item.startsAt ?? '无'} ~ {item.endsAt ?? '无'}
              </p>
              <p className="text-xs text-slate-500">状态：{item.isActive ? '启用' : '停用'} / 弹窗：{item.isPopup ? '是' : '否'}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={item.isActive ? 'secondary' : 'default'}
                  onClick={() => void updateMutation.mutateAsync({ id: item.id, isActive: !item.isActive })}
                >
                  {item.isActive ? '停用' : '启用'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void deleteMutation.mutateAsync(item.id)}>
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
