import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchTagAggregate } from '@/api/content-taxonomy'
import { fetchArticles } from '@/api/articles'

export function TagsAggregatePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTagId = searchParams.get('tag') ?? ''
  const [keyword, setKeyword] = useState('')
  const [selectedTagId, setSelectedTagId] = useState<string>(initialTagId)

  const tagsQuery = useQuery({
    queryKey: ['site', 'tags', 'aggregate'],
    queryFn: fetchTagAggregate,
  })

  const selectedTag = useMemo(() => {
    return (tagsQuery.data ?? []).find((tag) => tag.id === selectedTagId) ?? null
  }, [selectedTagId, tagsQuery.data])

  const articlesQuery = useQuery({
    queryKey: ['site', 'articles', 'by-tag', selectedTagId, keyword],
    queryFn: () => {
      const query: { page: number; pageSize: number; tagId?: string; keyword?: string } = {
        page: 1,
        pageSize: 20,
      }
      if (selectedTagId) {
        query.tagId = selectedTagId
      }
      const trimmedKeyword = keyword.trim()
      if (trimmedKeyword) {
        query.keyword = trimmedKeyword
      }
      return fetchArticles(query)
    },
    enabled: selectedTagId.length > 0,
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge>标签聚合</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">标签云与聚合检索</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          展示所有标签及文章数量，支持按标签聚合浏览公开文章。
        </p>
      </div>

      <Card className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>标签云</CardTitle>
          <CardDescription>点击标签筛选文章；字号按内容量分层展示。</CardDescription>
        </CardHeader>
        <CardContent>
          {tagsQuery.isLoading ? <p className="text-sm text-slate-500">标签加载中...</p> : null}
          {tagsQuery.isError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
              {tagsQuery.error instanceof Error ? tagsQuery.error.message : '加载失败'}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {(tagsQuery.data ?? []).map((tag) => {
              const sizeClass =
                tag.articleCount >= 20
                  ? 'text-base'
                  : tag.articleCount >= 10
                    ? 'text-sm'
                    : 'text-xs'
              const selected = selectedTagId === tag.id
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    setSelectedTagId(tag.id)
                    setSearchParams((current) => {
                      const next = new URLSearchParams(current)
                      next.set('tag', tag.id)
                      return next
                    })
                  }}
                  className={`rounded-full border px-3 py-1 transition ${sizeClass} ${
                    selected
                      ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                  }`}
                >
                  #{tag.name} ({tag.articleCount})
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>聚合文章列表</CardTitle>
          <CardDescription>
            {selectedTag ? `当前标签：#${selectedTag.name}` : '先在上方选择标签后查看文章'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="在当前标签内搜索标题/内容"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="w-72"
              disabled={!selectedTagId}
            />
            <Button
              variant="outline"
              onClick={() => {
                void articlesQuery.refetch()
              }}
              disabled={!selectedTagId}
            >
              刷新
            </Button>
          </div>

          {!selectedTagId ? <p className="text-sm text-slate-500">请选择一个标签。</p> : null}
          {articlesQuery.isLoading ? <p className="text-sm text-slate-500">文章加载中...</p> : null}
          {articlesQuery.isError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
              {articlesQuery.error instanceof Error ? articlesQuery.error.message : '加载失败'}
            </p>
          ) : null}

          {(articlesQuery.data?.items ?? []).map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.slug}`}
              className="block rounded-2xl border border-slate-200 p-4 transition hover:border-sky-300 dark:border-slate-800"
            >
              <p className="text-sm font-semibold">{article.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                阅读 {article.views} | 点赞 {article.likes} | 收藏 {article.favorites}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
