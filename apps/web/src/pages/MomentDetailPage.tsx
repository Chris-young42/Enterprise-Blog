import { fetchMomentBySlug } from '@/api/moments'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

export function MomentDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const query = useQuery({
    queryKey: ['site', 'moment', slug],
    queryFn: () => fetchMomentBySlug(slug ?? ''),
    enabled: Boolean(slug),
  })

  if (!query.data) return <p className="text-sm text-slate-500">动态不存在</p>

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Badge className="mb-2">动态详情</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{query.data.title}</h1>
      </div>
      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardContent className="p-5 text-sm leading-7 whitespace-pre-wrap">{query.data.content}</CardContent>
      </Card>
    </div>
  )
}
