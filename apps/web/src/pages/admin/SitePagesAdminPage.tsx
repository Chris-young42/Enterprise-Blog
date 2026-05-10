import { createPage, deletePage, fetchPages, updatePage } from '@/api/site-pages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function SitePagesAdminPage() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingSlug, setEditingSlug] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [editingSeoTitle, setEditingSeoTitle] = useState('')
  const [editingSeoDescription, setEditingSeoDescription] = useState('')

  const pagesQuery = useQuery({
    queryKey: ['admin', 'site-pages'],
    queryFn: () => fetchPages(false),
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'site-pages'] })
    void queryClient.invalidateQueries({ queryKey: ['site', 'pages'] })
  }

  const createMutation = useMutation({
    mutationFn: createPage,
    onSuccess: () => {
      setTitle('')
      setContent('')
      setSeoTitle('')
      setSeoDescription('')
      refresh()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updatePage>[1] }) => updatePage(id, payload),
    onSuccess: () => {
      setEditingId(null)
      setEditingTitle('')
      setEditingSlug('')
      setEditingContent('')
      setEditingSeoTitle('')
      setEditingSeoDescription('')
      refresh()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      refresh()
    },
  })

  const slug = toSlug(title)

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第8阶段深化</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">独立页面管理</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>新建独立页</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="标题" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input placeholder="slug（自动）" value={slug} readOnly />
          <textarea
            placeholder="内容（支持长文输入）"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-52 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950"
          />
          <Input placeholder="SEO标题" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
          <Input placeholder="SEO描述" value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} />
          <Button
            onClick={() =>
              void createMutation.mutateAsync({
                title: title.trim(),
                slug,
                content: content.trim(),
                ...(seoTitle.trim() ? { seoTitle: seoTitle.trim() } : {}),
                ...(seoDescription.trim() ? { seoDescription: seoDescription.trim() } : {}),
                isPublished: true,
              })
            }
          >
            创建页面
          </Button>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">实时预览</p>
            <p className="mt-1 font-medium">{seoTitle.trim() || title.trim() || '未命名页面'}</p>
            <p className="text-xs text-slate-500">{seoDescription.trim() || '无SEO描述'}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{content || '暂无内容'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {(pagesQuery.data ?? []).map((page) => (
          <Card key={page.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="font-medium">{page.title}</p>
              <p className="text-slate-500">/{page.slug}</p>
              <p className="text-xs text-slate-500">状态：{page.isPublished ? '已发布' : '草稿'}</p>
              <p className="text-xs text-slate-500">SEO标题：{page.seoTitle ?? '无'}</p>
              <p className="text-xs text-slate-500">SEO描述：{page.seoDescription ?? '无'}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(page.id)
                    setEditingTitle(page.title)
                    setEditingSlug(page.slug)
                    setEditingContent(page.content)
                    setEditingSeoTitle(page.seoTitle ?? '')
                    setEditingSeoDescription(page.seoDescription ?? '')
                  }}
                >
                  编辑
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPreviewId((prev) => (prev === page.id ? null : page.id))}>
                  {previewId === page.id ? '关闭预览' : '预览'}
                </Button>
                <Button
                  size="sm"
                  variant={page.isPublished ? 'secondary' : 'default'}
                  onClick={() => void updateMutation.mutateAsync({ id: page.id, payload: { isPublished: !page.isPublished } })}
                >
                  {page.isPublished ? '转草稿' : '发布'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void deleteMutation.mutateAsync(page.id)}>
                  删除
                </Button>
              </div>

              {editingId === page.id ? (
                <div className="mt-3 space-y-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
                    <Input value={editingSlug} onChange={(event) => setEditingSlug(event.target.value)} />
                  </div>
                  <textarea
                    value={editingContent}
                    onChange={(event) => setEditingContent(event.target.value)}
                    className="min-h-52 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950"
                  />
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input value={editingSeoTitle} onChange={(event) => setEditingSeoTitle(event.target.value)} />
                    <Input value={editingSeoDescription} onChange={(event) => setEditingSeoDescription(event.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        void updateMutation.mutateAsync({
                          id: page.id,
                          payload: {
                            title: editingTitle.trim(),
                            slug: toSlug(editingSlug),
                            content: editingContent.trim(),
                            seoTitle: editingSeoTitle.trim() || null,
                            seoDescription: editingSeoDescription.trim() || null,
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
                        setEditingTitle('')
                        setEditingSlug('')
                        setEditingContent('')
                        setEditingSeoTitle('')
                        setEditingSeoDescription('')
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : null}

              {previewId === page.id ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs text-slate-500">页面预览</p>
                  <p className="mt-1 font-medium">{page.seoTitle ?? page.title}</p>
                  <p className="text-xs text-slate-500">{page.seoDescription ?? '无SEO描述'}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{page.content}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
