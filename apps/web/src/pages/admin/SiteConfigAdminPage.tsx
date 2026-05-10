import { fetchSiteConfigs, upsertNavConfig } from '@/api/site-pages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

export function SiteConfigAdminPage() {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')
  const [href, setHref] = useState('')
  const [items, setItems] = useState<Array<{ label: string; href: string }>>([])

  const configsQuery = useQuery({
    queryKey: ['admin', 'site-configs'],
    queryFn: fetchSiteConfigs,
  })

  const navCurrent = useMemo(() => {
    const nav = configsQuery.data?.find((item) => item.key === 'site.nav')
    if (!nav || !Array.isArray(nav.value)) return []
    return nav.value as Array<{ label: string; href: string }>
  }, [configsQuery.data])

  const upsertMutation = useMutation({
    mutationFn: upsertNavConfig,
    onSuccess: () => {
      setItems([])
      void queryClient.invalidateQueries({ queryKey: ['admin', 'site-configs'] })
      void queryClient.invalidateQueries({ queryKey: ['site', 'config', 'nav'] })
    },
  })

  const workingItems = items.length > 0 ? items : navCurrent

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第8阶段深化</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">站点导航配置</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>新增导航项</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <Input placeholder="label" value={label} onChange={(event) => setLabel(event.target.value)} />
          <Input placeholder="href" value={href} onChange={(event) => setHref(event.target.value)} />
          <Button
            onClick={() => {
              const next = { label: label.trim(), href: href.trim() }
              if (!next.label || !next.href) return
              setItems((prev) => [...(prev.length > 0 ? prev : navCurrent), next])
              setLabel('')
              setHref('')
            }}
          >
            暂存
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>当前导航配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {workingItems.map((item, index) => (
            <div
              key={`${item.href}-${index}`}
              className="grid gap-2 rounded border border-slate-200 px-3 py-2 md:grid-cols-[1fr_1fr_auto] dark:border-slate-800"
            >
              <Input
                value={item.label}
                onChange={(event) => {
                  const value = event.target.value
                  setItems((prev) =>
                    (prev.length > 0 ? prev : navCurrent).map((row, i) => (i === index ? { ...row, label: value } : row)),
                  )
                }}
              />
              <Input
                value={item.href}
                onChange={(event) => {
                  const value = event.target.value
                  setItems((prev) =>
                    (prev.length > 0 ? prev : navCurrent).map((row, i) => (i === index ? { ...row, href: value } : row)),
                  )
                }}
              />
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (index === 0) return
                    setItems((prev) => {
                      const next = [...(prev.length > 0 ? prev : navCurrent)]
                      const current = next[index]
                      const upper = next[index - 1]
                      if (!current || !upper) return next
                      next[index - 1] = current
                      next[index] = upper
                      return next
                    })
                  }}
                >
                  上移
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (index >= workingItems.length - 1) return
                    setItems((prev) => {
                      const next = [...(prev.length > 0 ? prev : navCurrent)]
                      const current = next[index]
                      const lower = next[index + 1]
                      if (!current || !lower) return next
                      next[index + 1] = current
                      next[index] = lower
                      return next
                    })
                  }}
                >
                  下移
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setItems((prev) => (prev.length > 0 ? prev : navCurrent).filter((_, i) => i !== index))}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
          <Button
            onClick={() =>
              void upsertMutation.mutateAsync(
                workingItems
                  .map((item) => ({ label: item.label.trim(), href: item.href.trim() }))
                  .filter((item) => item.label.length > 0 && item.href.length > 0),
              )
            }
            disabled={workingItems.length === 0}
          >
            保存到系统配置
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
