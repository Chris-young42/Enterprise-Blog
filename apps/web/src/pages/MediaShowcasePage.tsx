import { fetchPublicMediaAssets } from '@/api/media'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'

export function MediaShowcasePage() {
  const imageQuery = useQuery({
    queryKey: ['site', 'media', 'image'],
    queryFn: () => fetchPublicMediaAssets('IMAGE'),
  })
  const audioQuery = useQuery({
    queryKey: ['site', 'media', 'audio'],
    queryFn: () => fetchPublicMediaAssets('AUDIO'),
  })
  const videoQuery = useQuery({
    queryKey: ['site', 'media', 'video'],
    queryFn: () => fetchPublicMediaAssets('VIDEO'),
  })

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Badge className="mb-2">多媒体专栏</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">音视频与图集展示</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">第7阶段前台媒体展示页（IMAGE/AUDIO/VIDEO）。</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">图集</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(imageQuery.data ?? []).map((asset) => (
            <Card key={asset.id} className="overflow-hidden border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
              {asset.url ? <img src={asset.url} alt={asset.originalName} className="h-44 w-full object-cover" /> : null}
              <CardContent className="p-3 text-xs text-slate-500">{asset.originalName}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">音频播客</h2>
        <div className="space-y-3">
          {(audioQuery.data ?? []).map((asset) => (
            <Card key={asset.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
              <CardHeader>
                <CardTitle className="text-base">{asset.originalName}</CardTitle>
                <CardDescription>{asset.mimeType}</CardDescription>
              </CardHeader>
              <CardContent>
                {asset.url ? <audio controls className="w-full" src={asset.url} /> : <p className="text-sm text-slate-500">未配置可播放地址</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">视频专栏</h2>
        <div className="space-y-3">
          {(videoQuery.data ?? []).map((asset) => (
            <Card key={asset.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
              <CardHeader>
                <CardTitle className="text-base">{asset.originalName}</CardTitle>
                <CardDescription>{asset.mimeType}</CardDescription>
              </CardHeader>
              <CardContent>
                {asset.url ? (
                  <video controls className="aspect-video w-full rounded-xl border border-slate-200 dark:border-slate-800" src={asset.url} />
                ) : (
                  <p className="text-sm text-slate-500">未配置可播放地址</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
