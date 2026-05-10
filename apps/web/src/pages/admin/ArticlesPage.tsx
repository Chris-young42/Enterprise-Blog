import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  batchDeleteArticles,
  batchMoveSeriesArticles,
  batchMoveCategory,
  batchSetPinned,
  batchSetRecommended,
  createArticle,
  fetchArticleArchive,
  fetchArticles,
  fetchHotArticles,
  publishArticle,
  saveDraftArticle,
  scheduleArticle,
} from '@/api/articles'
import {
  assignArticle,
  batchSetArticleStatus,
  batchSetVisibility,
  fetchArticleAssignments,
} from '@/api/article-collab'
import { fetchCategories } from '@/api/content-taxonomy'
import type { ArticleItem } from '@/types/api'
import type { CreateArticleInput } from '@/types/articles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArticleEditorCard } from '@/components/admin/articles/ArticleEditorCard'

export function ArticlesPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [batchCategoryId, setBatchCategoryId] = useState('')
  const [batchSeriesId, setBatchSeriesId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  const listQuery = useQuery({
    queryKey: ['admin', 'articles', page, keyword],
    queryFn: () => {
      const query: { page: number; pageSize: number; keyword?: string } = {
        page,
        pageSize: 10,
      }
      if (keyword.trim()) {
        query.keyword = keyword.trim()
      }
      return fetchArticles(query)
    },
  })

  const archiveQuery = useQuery({
    queryKey: ['admin', 'articles', 'archive'],
    queryFn: fetchArticleArchive,
  })

  const hotQuery = useQuery({
    queryKey: ['admin', 'articles', 'hot'],
    queryFn: () => fetchHotArticles(10),
  })

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories', 'for-batch-move'],
    queryFn: fetchCategories,
  })

  const assignmentsQuery = useQuery({
    queryKey: ['admin', 'articles', 'assignments'],
    queryFn: () => fetchArticleAssignments(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateArticleInput) => createArticle(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishArticle(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  })

  const draftMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateArticleInput }) => saveDraftArticle(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  })

  const scheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) => scheduleArticle(id, scheduledAt),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => batchDeleteArticles(ids),
    onSuccess: () => {
      setSelectedIds([])
      void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] })
    },
  })

  const batchPinnedMutation = useMutation({
    mutationFn: ({ ids, value }: { ids: string[]; value: boolean }) => batchSetPinned(ids, value),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  })

  const batchRecommendedMutation = useMutation({
    mutationFn: ({ ids, value }: { ids: string[]; value: boolean }) =>
      batchSetRecommended(ids, value),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  })

  const batchMoveMutation = useMutation({
    mutationFn: ({ ids, categoryId }: { ids: string[]; categoryId?: string }) =>
      batchMoveCategory(ids, categoryId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  })

  const batchStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' }) =>
      batchSetArticleStatus(ids, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  })

  const batchSeriesMutation = useMutation({
    mutationFn: ({ ids, seriesId }: { ids: string[]; seriesId?: string }) =>
      batchMoveSeriesArticles(ids, seriesId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  })

  const batchVisibilityMutation = useMutation({
    mutationFn: ({ ids, visibility }: { ids: string[]; visibility: 'PUBLIC' | 'FOLLOWER' | 'LOGGED_IN' | 'PRIVATE' | 'PASSWORD' }) =>
      batchSetVisibility(ids, visibility),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      assignArticle(id, { assigneeId: userId, status: 'TODO' }),
    onSuccess: () => void assignmentsQuery.refetch(),
  })

  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const pageSize = listQuery.data?.pageSize ?? 10
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const archiveCount = useMemo(() => {
    const rows = archiveQuery.data ?? []
    return rows.reduce((sum, year) => {
      return sum + year.months.reduce((monthSum, month) => monthSum + month.items.length, 0)
    }, 0)
  }, [archiveQuery.data])

  const handleCreated = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] })
  }

  const triggerPublish = (id: string) => {
    void publishMutation.mutateAsync(id)
  }

  const triggerDraft = (article: ArticleItem) => {
    const payload: CreateArticleInput = {
      title: article.title,
      slug: article.slug,
      contentMarkdown: article.contentMarkdown,
    }
    if (article.summary) {
      payload.summary = article.summary
    }
    void draftMutation.mutateAsync({
      id: article.id,
      payload,
    })
  }

  const triggerSchedule = (id: string) => {
    const nextHour = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    void scheduleMutation.mutateAsync({ id, scheduledAt: nextHour })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  const toggleSelectAllCurrentPage = () => {
    const allIds = items.map((item) => item.id)
    const allSelected = allIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !allIds.includes(id)))
    } else {
      setSelectedIds((current) => Array.from(new Set([...current, ...allIds])))
    }
  }

  const performBatchDelete = () => {
    if (selectedIds.length === 0) return
    void batchDeleteMutation.mutateAsync(selectedIds)
  }

  const performBatchPinned = (value: boolean) => {
    if (selectedIds.length === 0) return
    void batchPinnedMutation.mutateAsync({ ids: selectedIds, value })
  }

  const performBatchRecommended = (value: boolean) => {
    if (selectedIds.length === 0) return
    void batchRecommendedMutation.mutateAsync({ ids: selectedIds, value })
  }

  const performBatchMoveCategory = () => {
    if (selectedIds.length === 0) return
    const trimmedCategoryId = batchCategoryId.trim()
    if (!trimmedCategoryId) {
      void batchMoveMutation.mutateAsync({ ids: selectedIds })
      return
    }
    void batchMoveMutation.mutateAsync({
      ids: selectedIds,
      categoryId: trimmedCategoryId,
    })
  }

  const performBatchStatus = (status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED') => {
    if (selectedIds.length === 0) return
    void batchStatusMutation.mutateAsync({ ids: selectedIds, status })
  }

  const performBatchMoveSeries = () => {
    if (selectedIds.length === 0) return
    const trimmed = batchSeriesId.trim()
    if (!trimmed) {
      void batchSeriesMutation.mutateAsync({ ids: selectedIds })
      return
    }
    void batchSeriesMutation.mutateAsync({ ids: selectedIds, seriesId: trimmed })
  }

  const performBatchVisibility = (visibility: 'PUBLIC' | 'FOLLOWER' | 'LOGGED_IN' | 'PRIVATE' | 'PASSWORD') => {
    if (selectedIds.length === 0) return
    void batchVisibilityMutation.mutateAsync({ ids: selectedIds, visibility })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="mb-2">文章全流程管理</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">文章管理中心</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            支持新增、草稿、定时、发布、归档检索与权限可见性。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="按标题/内容/标签搜索"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setPage(1)
            }}
            className="w-64"
          />
          <Button
            variant="outline"
            onClick={() => {
              void listQuery.refetch()
              void archiveQuery.refetch()
            }}
          >
            刷新
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <CardDescription>文章总数</CardDescription>
            <CardTitle>{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <CardDescription>当前页</CardDescription>
            <CardTitle>
              {page} / {totalPages}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <CardDescription>归档文章</CardDescription>
            <CardTitle>{archiveCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <ArticleEditorCard
        onCreate={async (payload) => createMutation.mutateAsync(payload)}
        onCreated={handleCreated}
      />

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>文章列表</CardTitle>
          <CardDescription>支持发布、草稿、定时和批量管理操作。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={toggleSelectAllCurrentPage}>
                本页全选/取消
              </Button>
              <Button size="sm" variant="outline" onClick={() => performBatchPinned(true)}>
                批量置顶
              </Button>
              <Button size="sm" variant="outline" onClick={() => performBatchPinned(false)}>
                批量取消置顶
              </Button>
              <Button size="sm" variant="outline" onClick={() => performBatchRecommended(true)}>
                批量推荐
              </Button>
              <Button size="sm" variant="outline" onClick={() => performBatchRecommended(false)}>
                批量取消推荐
              </Button>
              <select
                value={batchCategoryId}
                onChange={(event) => setBatchCategoryId(event.target.value)}
                className="h-9 w-56 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">迁移到：无分类</option>
                {(categoriesQuery.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={performBatchMoveCategory}>
                批量迁移分类
              </Button>
              <Input
                value={batchSeriesId}
                onChange={(event) => setBatchSeriesId(event.target.value)}
                placeholder="seriesId"
                className="h-9 w-44"
              />
              <Button size="sm" variant="outline" onClick={performBatchMoveSeries}>
                批量迁移系列
              </Button>
              <Button size="sm" variant="outline" onClick={() => performBatchStatus('DRAFT')}>
                批量转草稿
              </Button>
              <Button size="sm" variant="outline" onClick={() => performBatchStatus('PUBLISHED')}>
                批量发布
              </Button>
              <Button size="sm" variant="outline" onClick={() => performBatchVisibility('PUBLIC')}>
                批量公开
              </Button>
              <Button size="sm" variant="outline" onClick={() => performBatchVisibility('PRIVATE')}>
                批量私密
              </Button>
              <Button size="sm" variant="outline" onClick={performBatchDelete}>
                批量删除
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">已选 {selectedIds.length} 篇文章</p>
          </div>
          {listQuery.isLoading ? <p className="text-sm text-slate-500">加载中...</p> : null}
          {listQuery.isError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
              {listQuery.error instanceof Error ? listQuery.error.message : '加载失败'}
            </p>
          ) : null}
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="mb-1 inline-flex items-center gap-2 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                    选择
                  </label>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    slug: {item.slug} | status: {item.status} | visibility: {item.visibility}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={assigneeId}
                    onChange={(event) => setAssigneeId(event.target.value)}
                    placeholder="协作者 userId"
                    className="h-8 w-40 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!assigneeId.trim()) return
                      void assignMutation.mutateAsync({ id: item.id, userId: assigneeId.trim() })
                    }}
                  >
                    分配协作
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => triggerDraft(item)}>
                    草稿
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => triggerSchedule(item.id)}>
                    定时
                  </Button>
                  <Button size="sm" onClick={() => triggerPublish(item.id)}>
                    发布
                  </Button>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                字数 {item.wordCount} | 预计阅读 {item.readingMinutes} 分钟 | 浏览 {item.views}
              </p>
            </div>
          ))}
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

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>协作任务列表</CardTitle>
          <CardDescription>多作者分工状态（TODO / IN_PROGRESS / REVIEW / DONE）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {(assignmentsQuery.data?.items ?? []).map((assignment) => (
            <div key={assignment.id} className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
              <p className="font-medium">[{assignment.status}] {assignment.article.title}</p>
              <p>assignee: {assignment.assignee.nickname ?? assignment.assignee.username}</p>
              <p>assigner: {assignment.assigner?.nickname ?? assignment.assigner?.username ?? '-'}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>归档预览</CardTitle>
          <CardDescription>按年/月时间轴分组。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(archiveQuery.data ?? []).map((year) => (
            <div key={year.year}>
              <p className="text-sm font-semibold">{year.year}</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {year.months.map((month) => (
                  <div key={`${year.year}-${month.month}`} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
                    <p>
                      {year.year}-{month.month}（{month.items.length}）
                    </p>
                    <ul className="mt-2 space-y-1 text-slate-500">
                      {month.items.slice(0, 3).map((article) => (
                        <li key={article.id}>{article.title}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>热门文章</CardTitle>
          <CardDescription>按阅读量、点赞、收藏综合排序。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(hotQuery.data ?? []).map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-slate-500">
                浏览 {item.views} | 点赞 {item.likes} | 收藏 {item.favorites}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
