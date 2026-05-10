import {
  batchReviewFriendLinks,
  createFriendLink,
  deleteFriendLink,
  fetchAdminFriendLinks,
  reorderFriendLinks,
  reviewFriendLink,
  updateFriendLink,
} from '@/api/site-pages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

export function FriendLinksAdminPage() {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingUrl, setEditingUrl] = useState('')
  const [editingDescription, setEditingDescription] = useState('')

  const listQuery = useQuery({
    queryKey: ['admin', 'friend-links'],
    queryFn: fetchAdminFriendLinks,
  })

  const orderedIds = useMemo(() => {
    const rows = [...(listQuery.data ?? [])]
    rows.sort((a, b) => a.sortOrder - b.sortOrder)
    return rows.map((item) => item.id)
  }, [listQuery.data])

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'friend-links'] })
    void queryClient.invalidateQueries({ queryKey: ['site', 'friend-links'] })
  }

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' }) => reviewFriendLink(id, status),
    onSuccess: () => refresh(),
  })

  const batchMutation = useMutation({
    mutationFn: ({ status }: { status: 'PENDING' | 'APPROVED' | 'REJECTED' }) => batchReviewFriendLinks(selectedIds, status),
    onSuccess: () => {
      setSelectedIds([])
      refresh()
    },
  })

  const reorderMutation = useMutation({
    mutationFn: reorderFriendLinks,
    onSuccess: () => refresh(),
  })

  const createMutation = useMutation({
    mutationFn: createFriendLink,
    onSuccess: () => {
      setName('')
      setUrl('')
      setDescription('')
      refresh()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateFriendLink>[1] }) => updateFriendLink(id, payload),
    onSuccess: () => {
      setEditingId(null)
      setEditingName('')
      setEditingUrl('')
      setEditingDescription('')
      refresh()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFriendLink,
    onSuccess: () => {
      setSelectedIds([])
      refresh()
    },
  })

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const idx = orderedIds.findIndex((itemId) => itemId === id)
    if (idx < 0) return
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= orderedIds.length) return
    const next = [...orderedIds]
    const current = next[idx]
    const swap = next[target]
    if (!current || !swap) return
    next[idx] = swap
    next[target] = current
    void reorderMutation.mutateAsync(next)
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第8阶段深化</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">友链审核与管理</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>后台新增友链</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Input placeholder="站点名" value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="站点URL" value={url} onChange={(event) => setUrl(event.target.value)} />
          <Input placeholder="简介" value={description} onChange={(event) => setDescription(event.target.value)} />
          <Button
            onClick={() =>
              void createMutation.mutateAsync({
                name: name.trim(),
                url: url.trim(),
                ...(description.trim() ? { description: description.trim() } : {}),
              })
            }
          >
            创建并通过
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Button size="sm" disabled={selectedIds.length === 0} onClick={() => void batchMutation.mutateAsync({ status: 'APPROVED' })}>
            批量通过（{selectedIds.length}）
          </Button>
          <Button size="sm" variant="outline" disabled={selectedIds.length === 0} onClick={() => void batchMutation.mutateAsync({ status: 'REJECTED' })}>
            批量拒绝
          </Button>
        </div>

        {(listQuery.data ?? [])
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => (
            <Card key={item.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
              <CardHeader>
                <CardTitle className="text-base">{item.name}（{item.status}）</CardTitle>
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
                <a href={item.url} target="_blank" rel="noreferrer" className="text-sky-600 dark:text-sky-400">
                  {item.url}
                </a>
                <p className="text-xs text-slate-500">排序：{item.sortOrder}</p>
                <p className="text-xs text-slate-500">简介：{item.description ?? '无'}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void reviewMutation.mutateAsync({ id: item.id, status: 'APPROVED' })}>通过</Button>
                  <Button size="sm" variant="outline" onClick={() => void reviewMutation.mutateAsync({ id: item.id, status: 'REJECTED' })}>拒绝</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(item.id)
                      setEditingName(item.name)
                      setEditingUrl(item.url)
                      setEditingDescription(item.description ?? '')
                    }}
                  >
                    编辑
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moveItem(item.id, 'up')}>
                    上移
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moveItem(item.id, 'down')}>
                    下移
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void deleteMutation.mutateAsync(item.id)}>
                    删除
                  </Button>
                </div>

                {editingId === item.id ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <Input value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                    <Input value={editingUrl} onChange={(event) => setEditingUrl(event.target.value)} />
                    <Input value={editingDescription} onChange={(event) => setEditingDescription(event.target.value)} />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          void updateMutation.mutateAsync({
                            id: item.id,
                            payload: {
                              name: editingName.trim(),
                              url: editingUrl.trim(),
                              description: editingDescription.trim() || null,
                            },
                          })
                        }
                      >
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null)
                          setEditingName('')
                          setEditingUrl('')
                          setEditingDescription('')
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
