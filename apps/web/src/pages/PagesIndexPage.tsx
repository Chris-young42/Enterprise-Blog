import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchPages } from '@/api/site-pages'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function PagesIndexPage() {
  const pagesQuery = useQuery({
    queryKey: ['site', 'pages'],
    queryFn: () => fetchPages(true),
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Badge className="mb-2">独立页面</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">站点独立页面</h1>
      </div>

      <div className="grid gap-4">
        {(pagesQuery.data ?? []).map((page) => (
          <Card key={page.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>
                <Link to={`/pages/${page.slug}`} className="hover:text-sky-600 dark:hover:text-sky-400">
                  {page.title}
                </Link>
              </CardTitle>
              <CardDescription>{page.seoDescription ?? `slug: ${page.slug}`}</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">最后更新：{new Date(page.updatedAt).toLocaleString('zh-CN')}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
