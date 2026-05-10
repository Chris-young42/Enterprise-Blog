import { fetchDownloadResources } from '@/api/media'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'

export function DownloadsPage() {
  const resourcesQuery = useQuery({
    queryKey: ['site', 'downloads'],
    queryFn: fetchDownloadResources,
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Badge className="mb-2">下载中心</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">资源下载中心</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">软件下载、文档资料、资源包统一入口。</p>
      </div>

      <div className="grid gap-4">
        {(resourcesQuery.data ?? []).map((resource) => (
          <Card key={resource.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>{resource.title}</CardTitle>
              <CardDescription>{resource.description ?? '暂无描述'}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4 text-sm">
              <div className="space-y-1 text-slate-500 dark:text-slate-400">
                <p>下载次数：{resource.downloadCount}</p>
                <p>权限：{resource.accessLevel}</p>
              </div>
              {resource.mediaAsset.url ? (
                <Button asChild>
                  <a href={resource.mediaAsset.url} target="_blank" rel="noreferrer">
                    下载资源
                  </a>
                </Button>
              ) : (
                <Button disabled>未配置下载地址</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
