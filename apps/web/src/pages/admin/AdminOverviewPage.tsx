import {
  exportAccessLogsCsv,
  exportLoginLogsCsv,
  exportOperationLogsCsv,
  fetchAccessLogs,
  fetchContentRanking,
  fetchLoginLogs,
  fetchOperationLogs,
  fetchSpiderAnalysis,
  fetchStatsOverview,
  fetchTraffic,
  fetchVisitorAnalysis,
} from '@/api/stats'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MotionDrawer } from '@/components/motion/MotionDrawer'
import { useToast } from '@/providers/use-toast'
import { useQuery } from '@tanstack/react-query'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Activity, Bug, ChartNoAxesCombined, ChevronRight, Earth, FileSearch, Funnel, Shield, UserSquare2 } from 'lucide-react'
import { useMemo, useState } from 'react'

const ACCESS_METHODS = ['ALL', 'GET', 'POST', 'PATCH', 'DELETE'] as const
type SpiderFilter = 'ALL' | 'SPIDER' | 'HUMAN'
type LoginSuccessFilter = 'ALL' | 'SUCCESS' | 'FAILED'

export function AdminOverviewPage() {
  const { showToast } = useToast()
  const [days, setDays] = useState(30)
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [accessLogPage, setAccessLogPage] = useState(1)
  const [loginLogPage, setLoginLogPage] = useState(1)
  const [operationLogPage, setOperationLogPage] = useState(1)
  const [accessKeyword, setAccessKeyword] = useState('')
  const [accessMethod, setAccessMethod] = useState<(typeof ACCESS_METHODS)[number]>('ALL')
  const [accessStatusCode, setAccessStatusCode] = useState('')
  const [accessSpiderFilter, setAccessSpiderFilter] = useState<SpiderFilter>('ALL')
  const [loginKeyword, setLoginKeyword] = useState('')
  const [loginSuccessFilter, setLoginSuccessFilter] = useState<LoginSuccessFilter>('ALL')
  const [operationKeyword, setOperationKeyword] = useState('')
  const [operationModule, setOperationModule] = useState('')
  const [operationAction, setOperationAction] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 700], [0, -30])

  const rangeParams = useMemo(() => {
    if (fromDate && toDate) {
      return {
        from: new Date(`${fromDate}T00:00:00`).toISOString(),
        to: new Date(`${toDate}T23:59:59`).toISOString(),
      }
    }
    return { days }
  }, [days, fromDate, toDate])

  const overviewQuery = useQuery({ queryKey: ['stats', 'overview'], queryFn: fetchStatsOverview })
  const trafficQuery = useQuery({
    queryKey: ['stats', 'traffic', rangeParams, granularity],
    queryFn: () => fetchTraffic({ ...rangeParams, granularity }),
  })
  const rankingQuery = useQuery({ queryKey: ['stats', 'ranking'], queryFn: () => fetchContentRanking(8) })
  const visitorQuery = useQuery({ queryKey: ['stats', 'visitor', rangeParams], queryFn: () => fetchVisitorAnalysis(rangeParams) })
  const spiderQuery = useQuery({ queryKey: ['stats', 'spider', rangeParams], queryFn: () => fetchSpiderAnalysis(rangeParams) })

  const accessLogQuery = useQuery({
    queryKey: ['stats', 'logs', 'access', accessLogPage, rangeParams, accessKeyword, accessMethod, accessStatusCode, accessSpiderFilter],
    queryFn: () =>
      fetchAccessLogs({
        page: accessLogPage,
        pageSize: 8,
        ...rangeParams,
        ...(accessKeyword.trim().length > 0 ? { keyword: accessKeyword.trim() } : {}),
        ...(accessMethod !== 'ALL' ? { method: accessMethod } : {}),
        ...(accessStatusCode.trim().length > 0 ? { statusCode: Number(accessStatusCode) } : {}),
        ...(accessSpiderFilter === 'SPIDER' ? { isSpider: true } : {}),
        ...(accessSpiderFilter === 'HUMAN' ? { isSpider: false } : {}),
      }),
  })

  const loginLogQuery = useQuery({
    queryKey: ['stats', 'logs', 'login', loginLogPage, rangeParams, loginKeyword, loginSuccessFilter],
    queryFn: () =>
      fetchLoginLogs({
        page: loginLogPage,
        pageSize: 8,
        ...rangeParams,
        ...(loginKeyword.trim().length > 0 ? { keyword: loginKeyword.trim() } : {}),
        ...(loginSuccessFilter === 'SUCCESS' ? { isSuccess: true } : {}),
        ...(loginSuccessFilter === 'FAILED' ? { isSuccess: false } : {}),
      }),
  })

  const operationLogQuery = useQuery({
    queryKey: ['stats', 'logs', 'operation', operationLogPage, rangeParams, operationKeyword, operationModule, operationAction],
    queryFn: () =>
      fetchOperationLogs({
        page: operationLogPage,
        pageSize: 8,
        ...rangeParams,
        ...(operationKeyword.trim().length > 0 ? { keyword: operationKeyword.trim() } : {}),
        ...(operationModule.trim().length > 0 ? { module: operationModule.trim() } : {}),
        ...(operationAction.trim().length > 0 ? { action: operationAction.trim() } : {}),
      }),
  })

  const overview = overviewQuery.data
  const traffic = trafficQuery.data
  const visitor = visitorQuery.data
  const ranking = rankingQuery.data
  const spider = spiderQuery.data
  const trafficPoints = traffic?.points ?? []
  const maxTraffic = Math.max(1, ...trafficPoints.map((item) => item.visits))

  return (
    <div className="space-y-6 overflow-x-hidden">
      <motion.div style={{ y }} className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/75 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-7 dark:border-slate-800/80 dark:bg-slate-950/75">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(129,140,248,0.14),transparent_38%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Badge>管理后台 / 总览</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">控制台</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">全站数据、日志和安全趋势统一视图。</p>
          </div>
          <Button variant="secondary" onClick={() => setShowFilters(true)}>
            <Funnel className="h-4 w-4" />
            打开筛选面板
          </Button>
        </div>
      </motion.div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { key: 'articleTotal', label: '文章总数', value: `${overview?.articleTotal ?? 0}`, icon: ChartNoAxesCombined },
          { key: 'publishedArticleTotal', label: '发布文章', value: `${overview?.publishedArticleTotal ?? 0}`, icon: FileSearch },
          { key: 'accessLogTotal', label: '访问日志', value: `${overview?.accessLogTotal ?? 0}`, icon: Activity },
          { key: 'spiderVisitTotal', label: '蜘蛛访问', value: `${overview?.spiderVisitTotal ?? 0}`, icon: Bug },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.key}>
              <CardHeader>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-3xl">{item.value}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Icon className="h-4 w-4 text-slate-400" />
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>访问趋势</CardTitle>
            <CardDescription>粒度：{granularity}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {([
                ['day', '按日'],
                ['week', '按周'],
                ['month', '按月'],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={granularity === value ? 'default' : 'outline'}
                  onClick={() => setGranularity(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-slate-500">当前访问</p>
                <p className="text-lg font-semibold">{traffic?.totalVisits ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-slate-500">上期访问</p>
                <p className="text-lg font-semibold">{traffic?.previousTotalVisits ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-slate-500">变化率</p>
                <p className="text-lg font-semibold">{traffic?.changeRate ?? 0}%</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex h-48 min-w-[620px] items-end gap-2">
                {trafficPoints.slice(-24).map((point) => {
                  const percent = Math.max(4, Math.round((point.visits / maxTraffic) * 100))
                  return (
                    <motion.div key={point.bucket} whileHover={{ y: -4 }} className="flex min-w-5 flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-slate-900 to-sky-500 dark:from-slate-100 dark:to-cyan-300"
                        style={{ height: `${percent}%` }}
                      />
                      <p className="text-[10px] text-slate-500">{point.bucket.slice(-5)}</p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>内容排行</CardTitle>
            <CardDescription>阅读、标签、分类热度</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              {(ranking?.articleRanking ?? []).slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  <span className="ml-2 shrink-0 text-xs">{item.views}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                {(ranking?.tagRanking ?? []).slice(0, 4).map((item) => (
                  <div key={item.tagId} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-800">
                    <span>{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {(ranking?.categoryRanking ?? []).slice(0, 4).map((item) => (
                  <div key={item.categoryId ?? item.slug} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-800">
                    <span>{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>访客画像</CardTitle>
            <CardDescription>地域 / 设备 / 浏览器</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500">地域</p>
              {(visitor?.region ?? []).slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-800">
                  <span className="truncate">{item.name}</span>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500">设备</p>
              {(visitor?.deviceType ?? []).slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-800">
                  <span className="truncate">{item.name}</span>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500">浏览器</p>
              {(visitor?.browser ?? []).slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-800">
                  <span className="truncate">{item.name}</span>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>蜘蛛访问</CardTitle>
            <CardDescription>爬虫类型与最近抓取</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {(spider?.bySpider ?? []).slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-800">
                  <span className="truncate">{item.name}</span>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {(spider?.recent ?? []).slice(0, 6).map((item, index) => (
                <div key={`${item.path}-${index}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-800">
                  <p className="font-medium">{item.spiderName}</p>
                  <p className="truncate text-slate-500">{item.path}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>访问日志</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {(accessLogQuery.data?.items ?? []).slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-800">
                <p className="truncate">{item.method} {item.path}</p>
                <p className="truncate text-slate-500">{item.ip ?? 'unknown'} / {item.statusCode}</p>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={() => setAccessLogPage((v) => Math.max(1, v - 1))}>上一页</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const total = accessLogQuery.data?.total ?? 0
                  const pageSize = accessLogQuery.data?.pageSize ?? 8
                  const maxPage = Math.max(1, Math.ceil(total / pageSize))
                  setAccessLogPage((v) => Math.min(maxPage, v + 1))
                }}
              >
                下一页
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>登录日志</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {(loginLogQuery.data?.items ?? []).slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-800">
                <p>{item.username ?? 'unknown'} / {item.isSuccess ? 'SUCCESS' : 'FAILED'}</p>
                <p className="truncate text-slate-500">{item.ip} / {item.deviceType ?? 'unknown'}</p>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={() => setLoginLogPage((v) => Math.max(1, v - 1))}>上一页</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const total = loginLogQuery.data?.total ?? 0
                  const pageSize = loginLogQuery.data?.pageSize ?? 8
                  const maxPage = Math.max(1, Math.ceil(total / pageSize))
                  setLoginLogPage((v) => Math.min(maxPage, v + 1))
                }}
              >
                下一页
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>操作日志</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {(operationLogQuery.data?.items ?? []).slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-800">
                <p className="truncate">{item.module} / {item.action}</p>
                <p className="truncate text-slate-500">{item.resourceId ?? 'N/A'}</p>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button size="sm" variant="outline" onClick={() => setOperationLogPage((v) => Math.max(1, v - 1))}>上一页</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const total = operationLogQuery.data?.total ?? 0
                  const pageSize = operationLogQuery.data?.pageSize ?? 8
                  const maxPage = Math.max(1, Math.ceil(total / pageSize))
                  setOperationLogPage((v) => Math.min(maxPage, v + 1))
                }}
              >
                下一页
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <MotionDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        header={<p className="text-sm font-semibold">高级筛选与导出</p>}
      >
        <div className="space-y-6 text-sm">
          <section className="space-y-2">
            <p className="font-medium">时间筛选</p>
            <div className="flex flex-wrap gap-2">
              {[7, 30, 90].map((value) => (
                <Button key={value} size="sm" variant={days === value ? 'default' : 'outline'} onClick={() => setDays(value)}>
                  最近{value}天
                </Button>
              ))}
            </div>
            <div className="grid gap-2">
              <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
          </section>

          <section className="space-y-2">
            <p className="font-medium">访问日志过滤</p>
            <Input value={accessKeyword} onChange={(event) => setAccessKeyword(event.target.value)} placeholder="关键词 path/ip/ua" />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="h-10 rounded-xl border border-slate-300/80 bg-white/85 px-2 text-sm dark:border-slate-700 dark:bg-slate-950/80"
                value={accessMethod}
                onChange={(event) => setAccessMethod(event.target.value as (typeof ACCESS_METHODS)[number])}
              >
                {ACCESS_METHODS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <Input value={accessStatusCode} onChange={(event) => setAccessStatusCode(event.target.value)} placeholder="状态码" />
            </div>
            <select
              className="h-10 w-full rounded-xl border border-slate-300/80 bg-white/85 px-2 text-sm dark:border-slate-700 dark:bg-slate-950/80"
              value={accessSpiderFilter}
              onChange={(event) => setAccessSpiderFilter(event.target.value as SpiderFilter)}
            >
              <option value="ALL">全部流量</option>
              <option value="SPIDER">仅蜘蛛</option>
              <option value="HUMAN">仅人类</option>
            </select>
            <Button
              className="w-full"
              variant="outline"
              onClick={async () => {
                await exportAccessLogsCsv({
                  ...rangeParams,
                  ...(accessKeyword.trim().length > 0 ? { keyword: accessKeyword.trim() } : {}),
                  ...(accessMethod !== 'ALL' ? { method: accessMethod } : {}),
                  ...(accessStatusCode.trim().length > 0 ? { statusCode: Number(accessStatusCode) } : {}),
                  ...(accessSpiderFilter === 'SPIDER' ? { isSpider: true } : {}),
                  ...(accessSpiderFilter === 'HUMAN' ? { isSpider: false } : {}),
                })
                showToast({ title: '访问日志导出任务已触发', tone: 'success' })
              }}
            >
              <Earth className="h-4 w-4" />
              导出访问日志
            </Button>
          </section>

          <section className="space-y-2">
            <p className="font-medium">登录与操作日志导出</p>
            <Input value={loginKeyword} onChange={(event) => setLoginKeyword(event.target.value)} placeholder="登录关键词" />
            <select
              className="h-10 w-full rounded-xl border border-slate-300/80 bg-white/85 px-2 text-sm dark:border-slate-700 dark:bg-slate-950/80"
              value={loginSuccessFilter}
              onChange={(event) => setLoginSuccessFilter(event.target.value as LoginSuccessFilter)}
            >
              <option value="ALL">全部状态</option>
              <option value="SUCCESS">仅成功</option>
              <option value="FAILED">仅失败</option>
            </select>
            <Input value={operationKeyword} onChange={(event) => setOperationKeyword(event.target.value)} placeholder="操作关键词" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={operationModule} onChange={(event) => setOperationModule(event.target.value)} placeholder="模块" />
              <Input value={operationAction} onChange={(event) => setOperationAction(event.target.value)} placeholder="动作" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await exportLoginLogsCsv({
                    ...rangeParams,
                    ...(loginKeyword.trim().length > 0 ? { keyword: loginKeyword.trim() } : {}),
                    ...(loginSuccessFilter === 'SUCCESS' ? { isSuccess: true } : {}),
                    ...(loginSuccessFilter === 'FAILED' ? { isSuccess: false } : {}),
                  })
                  showToast({ title: '登录日志导出已触发', tone: 'success' })
                }}
              >
                <UserSquare2 className="h-4 w-4" />
                登录日志
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await exportOperationLogsCsv({
                    ...rangeParams,
                    ...(operationKeyword.trim().length > 0 ? { keyword: operationKeyword.trim() } : {}),
                    ...(operationModule.trim().length > 0 ? { module: operationModule.trim() } : {}),
                    ...(operationAction.trim().length > 0 ? { action: operationAction.trim() } : {}),
                  })
                  showToast({ title: '操作日志导出已触发', tone: 'success' })
                }}
              >
                <Shield className="h-4 w-4" />
                操作日志
              </Button>
            </div>
          </section>
        </div>
      </MotionDrawer>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-300/75 bg-white/75 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300"
        >
          更多筛选
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
