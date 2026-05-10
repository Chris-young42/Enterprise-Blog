import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  fetchSiteConfigs,
  upsertAppearanceConfig,
  upsertNavConfig,
  upsertSideNavConfig,
  type AppearanceConfig,
} from '@/api/site-pages'
import { defaultAppearance, normalizeUnknownAppearance } from '@/lib/appearance'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type NavRow = { label: string; href: string }

type SiteConfigItem = {
  id: string
  key: string
  value: unknown
  description: string | null
  createdAt: string
  updatedAt: string
}

type WidgetKey = keyof AppearanceConfig['widgets']
type AnimationKey = keyof AppearanceConfig['animations']
type OptionalAppearanceKey = 'wallpaperUrl' | 'customCss' | 'customJs' | 'customHeadHtml' | 'customFooterHtml'

const widgetEntries: Array<{ key: WidgetKey; label: string }> = [
  { key: 'hotArticles', label: '热门文章' },
  { key: 'latestArticles', label: '最新文章' },
  { key: 'tagCloud', label: '标签云' },
  { key: 'archive', label: '归档组件' },
]

const animationEntries: Array<{ key: AnimationKey; label: string }> = [
  { key: 'pageLoad', label: '页面加载动画' },
  { key: 'contentReveal', label: '内容渐入动画' },
  { key: 'interactive', label: '交互动画' },
]

function parseNav(configs: SiteConfigItem[] | undefined, key: string) {
  const row = configs?.find((item) => item.key === key)
  if (!row || !Array.isArray(row.value)) return []
  return row.value as NavRow[]
}

function withOptionalAppearanceField(prev: AppearanceConfig, key: OptionalAppearanceKey, rawValue: string): AppearanceConfig {
  const trimmed = rawValue.trim()
  if (trimmed.length > 0) {
    return {
      ...prev,
      [key]: trimmed,
    }
  }

  const { [key]: _omitted, ...rest } = prev;
  void _omitted;
  return rest
}

function renderEditor(
  title: string,
  workingItems: NavRow[],
  setItems: Dispatch<SetStateAction<NavRow[]>>,
  current: NavRow[],
  onSave: () => void,
) {
  return (
    <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
                  (prev.length > 0 ? prev : current).map((row, i) => (i === index ? { ...row, label: value } : row)),
                )
              }}
            />
            <Input
              value={item.href}
              onChange={(event) => {
                const value = event.target.value
                setItems((prev) =>
                  (prev.length > 0 ? prev : current).map((row, i) => (i === index ? { ...row, href: value } : row)),
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
                    const next = [...(prev.length > 0 ? prev : current)]
                    const currentRow = next[index]
                    const upperRow = next[index - 1]
                    if (!currentRow || !upperRow) return next
                    next[index - 1] = currentRow
                    next[index] = upperRow
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
                    const next = [...(prev.length > 0 ? prev : current)]
                    const currentRow = next[index]
                    const lowerRow = next[index + 1]
                    if (!currentRow || !lowerRow) return next
                    next[index + 1] = currentRow
                    next[index] = lowerRow
                    return next
                  })
                }}
              >
                下移
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setItems((prev) => (prev.length > 0 ? prev : current).filter((_, i) => i !== index))}
              >
                删除
              </Button>
            </div>
          </div>
        ))}
        <Button onClick={onSave} disabled={workingItems.length === 0}>
          保存配置
        </Button>
      </CardContent>
    </Card>
  )
}

export function SiteConfigAdminPage() {
  const queryClient = useQueryClient()
  const [topLabel, setTopLabel] = useState('')
  const [topHref, setTopHref] = useState('')
  const [sideLabel, setSideLabel] = useState('')
  const [sideHref, setSideHref] = useState('')
  const [topItems, setTopItems] = useState<NavRow[]>([])
  const [sideItems, setSideItems] = useState<NavRow[]>([])

  const configsQuery = useQuery({
    queryKey: ['admin', 'site-configs'],
    queryFn: fetchSiteConfigs,
  })

  const configList = configsQuery.data as SiteConfigItem[] | undefined
  const topCurrent = useMemo(() => parseNav(configList, 'site.nav'), [configList])
  const sideCurrent = useMemo(() => parseNav(configList, 'site.side-nav'), [configList])
  const appearanceCurrent = useMemo(() => {
    const row = configList?.find((item) => item.key === 'site.appearance')
    return normalizeUnknownAppearance(row?.value)
  }, [configList])

  const [appearance, setAppearance] = useState<AppearanceConfig>(defaultAppearance)
  const [appearanceDirty, setAppearanceDirty] = useState(false)
  if (!appearanceDirty && appearance !== appearanceCurrent) {
    setAppearance(appearanceCurrent)
  }

  const upsertTopMutation = useMutation({
    mutationFn: upsertNavConfig,
    onSuccess: () => {
      setTopItems([])
      void queryClient.invalidateQueries({ queryKey: ['admin', 'site-configs'] })
      void queryClient.invalidateQueries({ queryKey: ['site', 'config', 'nav'] })
    },
  })

  const upsertSideMutation = useMutation({
    mutationFn: upsertSideNavConfig,
    onSuccess: () => {
      setSideItems([])
      void queryClient.invalidateQueries({ queryKey: ['admin', 'site-configs'] })
      void queryClient.invalidateQueries({ queryKey: ['site', 'config', 'side-nav'] })
    },
  })

  const upsertAppearanceMutation = useMutation({
    mutationFn: upsertAppearanceConfig,
    onSuccess: () => {
      setAppearanceDirty(false)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'site-configs'] })
      void queryClient.invalidateQueries({ queryKey: ['site', 'config', 'appearance'] })
    },
  })

  const workingTopItems = topItems.length > 0 ? topItems : topCurrent
  const workingSideItems = sideItems.length > 0 ? sideItems : sideCurrent

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第10阶段深化</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">站点外观与导航配置</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>外观主题配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2 md:grid-cols-3">
            <label className="space-y-1">
              <p className="text-xs text-slate-500">主题模式</p>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                value={appearance.themeMode}
                onChange={(event) => {
                  setAppearanceDirty(true)
                  setAppearance((prev) => ({ ...prev, themeMode: event.target.value as AppearanceConfig['themeMode'] }))
                }}
              >
                <option value="light">light</option>
                <option value="dark">dark</option>
                <option value="system">system</option>
              </select>
            </label>
            <label className="space-y-1">
              <p className="text-xs text-slate-500">主题预设</p>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                value={appearance.themePreset}
                onChange={(event) => {
                  setAppearanceDirty(true)
                  setAppearance((prev) => ({ ...prev, themePreset: event.target.value as AppearanceConfig['themePreset'] }))
                }}
              >
                <option value="ocean">ocean</option>
                <option value="sunset">sunset</option>
                <option value="forest">forest</option>
              </select>
            </label>
            <label className="space-y-1">
              <p className="text-xs text-slate-500">背景壁纸URL</p>
              <Input
                value={appearance.wallpaperUrl ?? ''}
                onChange={(event) => {
                  setAppearanceDirty(true)
                  setAppearance((prev) => withOptionalAppearanceField(prev, 'wallpaperUrl', event.target.value))
                }}
              />
            </label>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="space-y-1">
              <p className="text-xs text-slate-500">字体</p>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                value={appearance.fontFamily}
                onChange={(event) => {
                  setAppearanceDirty(true)
                  setAppearance((prev) => ({ ...prev, fontFamily: event.target.value as AppearanceConfig['fontFamily'] }))
                }}
              >
                <option value="sans">sans</option>
                <option value="serif">serif</option>
                <option value="mono">mono</option>
              </select>
            </label>
            <label className="space-y-1">
              <p className="text-xs text-slate-500">字号</p>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
                value={appearance.fontScale}
                onChange={(event) => {
                  setAppearanceDirty(true)
                  setAppearance((prev) => ({ ...prev, fontScale: event.target.value as AppearanceConfig['fontScale'] }))
                }}
              >
                <option value="sm">sm</option>
                <option value="md">md</option>
                <option value="lg">lg</option>
              </select>
            </label>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {widgetEntries.map((entry) => (
              <label key={entry.key} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={appearance.widgets[entry.key]}
                  onChange={(event) => {
                    setAppearanceDirty(true)
                    setAppearance((prev) => ({
                      ...prev,
                      widgets: { ...prev.widgets, [entry.key]: event.target.checked },
                    }))
                  }}
                />
                {entry.label}
              </label>
            ))}
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {animationEntries.map((entry) => (
              <label key={entry.key} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={appearance.animations[entry.key]}
                  onChange={(event) => {
                    setAppearanceDirty(true)
                    setAppearance((prev) => ({
                      ...prev,
                      animations: { ...prev.animations, [entry.key]: event.target.checked },
                    }))
                  }}
                />
                {entry.label}
              </label>
            ))}
            <label className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
              <input
                type="checkbox"
                checked={appearance.backToTop}
                onChange={(event) => {
                  setAppearanceDirty(true)
                  setAppearance((prev) => ({ ...prev, backToTop: event.target.checked }))
                }}
              />
              回到顶部按钮
            </label>
            <label className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
              <input
                type="checkbox"
                checked={appearance.floatingAction}
                onChange={(event) => {
                  setAppearanceDirty(true)
                  setAppearance((prev) => ({ ...prev, floatingAction: event.target.checked }))
                }}
              />
              悬浮交互按钮
            </label>
          </div>

          <label className="space-y-1">
            <p className="text-xs text-slate-500">自定义 CSS</p>
            <textarea
              className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              value={appearance.customCss ?? ''}
              onChange={(event) => {
                setAppearanceDirty(true)
                setAppearance((prev) => withOptionalAppearanceField(prev, 'customCss', event.target.value))
              }}
            />
          </label>
          <label className="space-y-1">
            <p className="text-xs text-slate-500">自定义 JS</p>
            <textarea
              className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              value={appearance.customJs ?? ''}
              onChange={(event) => {
                setAppearanceDirty(true)
                setAppearance((prev) => withOptionalAppearanceField(prev, 'customJs', event.target.value))
              }}
            />
          </label>
          <label className="space-y-1">
            <p className="text-xs text-slate-500">头部自定义代码</p>
            <textarea
              className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              value={appearance.customHeadHtml ?? ''}
              onChange={(event) => {
                setAppearanceDirty(true)
                setAppearance((prev) => withOptionalAppearanceField(prev, 'customHeadHtml', event.target.value))
              }}
            />
          </label>
          <label className="space-y-1">
            <p className="text-xs text-slate-500">底部自定义代码</p>
            <textarea
              className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              value={appearance.customFooterHtml ?? ''}
              onChange={(event) => {
                setAppearanceDirty(true)
                setAppearance((prev) => withOptionalAppearanceField(prev, 'customFooterHtml', event.target.value))
              }}
            />
          </label>

          <Button onClick={() => void upsertAppearanceMutation.mutateAsync(appearance)}>
            保存外观配置
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>新增顶部导航项</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <Input placeholder="label" value={topLabel} onChange={(event) => setTopLabel(event.target.value)} />
          <Input placeholder="href" value={topHref} onChange={(event) => setTopHref(event.target.value)} />
          <Button
            onClick={() => {
              const next = { label: topLabel.trim(), href: topHref.trim() }
              if (!next.label || !next.href) return
              setTopItems((prev) => [...(prev.length > 0 ? prev : topCurrent), next])
              setTopLabel('')
              setTopHref('')
            }}
          >
            暂存
          </Button>
        </CardContent>
      </Card>

      {renderEditor(
        '顶部导航配置',
        workingTopItems,
        setTopItems,
        topCurrent,
        () =>
          void upsertTopMutation.mutateAsync(
            workingTopItems
              .map((item) => ({ label: item.label.trim(), href: item.href.trim() }))
              .filter((item) => item.label.length > 0 && item.href.length > 0),
          ),
      )}

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>新增侧边导航项</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <Input placeholder="label" value={sideLabel} onChange={(event) => setSideLabel(event.target.value)} />
          <Input placeholder="href" value={sideHref} onChange={(event) => setSideHref(event.target.value)} />
          <Button
            onClick={() => {
              const next = { label: sideLabel.trim(), href: sideHref.trim() }
              if (!next.label || !next.href) return
              setSideItems((prev) => [...(prev.length > 0 ? prev : sideCurrent), next])
              setSideLabel('')
              setSideHref('')
            }}
          >
            暂存
          </Button>
        </CardContent>
      </Card>

      {renderEditor(
        '侧边导航配置',
        workingSideItems,
        setSideItems,
        sideCurrent,
        () =>
          void upsertSideMutation.mutateAsync(
            workingSideItems
              .map((item) => ({ label: item.label.trim(), href: item.href.trim() }))
              .filter((item) => item.label.length > 0 && item.href.length > 0),
          ),
      )}
    </div>
  )
}
