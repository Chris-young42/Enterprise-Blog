import { fetchMomentTimeline } from '@/api/moments'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

export function TimelinePage() {
  const timelineQuery = useQuery({
    queryKey: ['site', 'timeline'],
    queryFn: fetchMomentTimeline,
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Badge className="mb-2">时光轴</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">时间线归档</h1>
      </div>

      <div className="space-y-4">
        {(timelineQuery.data ?? []).map((group) => (
          <Card key={group.date} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>{group.date}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
                  <Link to={`/moments/${item.slug}`} className="hover:text-sky-600 dark:hover:text-sky-400">
                    {item.title}
                  </Link>
                  <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
