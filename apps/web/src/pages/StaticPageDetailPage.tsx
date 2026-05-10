import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { fetchPageBySlug } from '@/api/site-pages'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function StaticPageDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const pageQuery = useQuery({
    queryKey: ['site', 'page', slug],
    queryFn: () => fetchPageBySlug(slug ?? ''),
    enabled: Boolean(slug),
  })

  if (pageQuery.isLoading) return <p className="text-sm text-slate-500">页面加载中...</p>
  if (!pageQuery.data) return <p className="text-sm text-slate-500">页面不存在</p>

  const page = pageQuery.data
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <Badge className="mb-2">独立页</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
      </div>
      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle className="text-base">{page.seoTitle ?? page.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 whitespace-pre-wrap">{page.content}</CardContent>
      </Card>
    </div>
  )
}
