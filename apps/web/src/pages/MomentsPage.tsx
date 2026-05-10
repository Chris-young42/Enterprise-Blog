import { fetchMoments } from '@/api/moments'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

export function MomentsPage() {
  const momentsQuery = useQuery({
    queryKey: ['site', 'moments'],
    queryFn: () => fetchMoments(true),
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Badge className="mb-2">随笔碎碎念</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">动态说说</h1>
      </div>

      <div className="space-y-3">
        {(momentsQuery.data ?? []).map((item) => (
          <Card key={item.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>
                <Link to={`/moments/${item.slug}`} className="hover:text-sky-600 dark:hover:text-sky-400">
                  {item.title}
                </Link>
              </CardTitle>
              <CardDescription>{item.summary ?? '随笔动态'}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{item.content}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
