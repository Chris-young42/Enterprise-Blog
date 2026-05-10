import { useQuery } from '@tanstack/react-query'
import { fetchHotArticles } from '@/api/articles'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'

export function PopularArticlesPanel() {
  const hotQuery = useQuery({
    queryKey: ['site', 'articles', 'hot'],
    queryFn: () => fetchHotArticles(8),
  })

  return (
    <Card className="border-white/60 bg-white/75 dark:border-slate-800/80 dark:bg-slate-950/80">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>热门文章</CardTitle>
          <Badge className="border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            自动排行
          </Badge>
        </div>
        <CardDescription>按浏览、点赞、收藏综合排序。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {hotQuery.isLoading ? <p className="text-sm text-slate-500">加载中...</p> : null}
        {hotQuery.isError ? (
          <p className="text-sm text-rose-600 dark:text-rose-300">
            {hotQuery.error instanceof Error ? hotQuery.error.message : '加载失败'}
          </p>
        ) : null}
        {(hotQuery.data ?? []).map((item, index) => (
          <Link
            key={item.id}
            to={`/articles/${item.slug}`}
            className="block rounded-xl border border-slate-200 px-3 py-2 transition hover:border-sky-300 dark:border-slate-800"
          >
            <p className="text-sm font-semibold">
              {index + 1}. {item.title}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              浏览 {item.views} | 点赞 {item.likes} | 收藏 {item.favorites}
            </p>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
