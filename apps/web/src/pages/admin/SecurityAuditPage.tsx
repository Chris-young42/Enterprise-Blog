import {
  exportSecurityAnalysisCsv,
  exportSecurityExportHistoryCsv,
  fetchSecurityAnalysis,
  fetchSecurityExportHistory,
  type SecurityAction,
} from '@/api/stats'
import { MotionDrawer } from '@/components/motion/MotionDrawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/providers/use-toast'
import { useQuery } from '@tanstack/react-query'
import { motion, useScroll, useTransform } from 'framer-motion'
import { AlertTriangle, Download, Filter, Radar, ShieldBan, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'

const ACTION_OPTIONS: Array<{ label: string; value: 'ALL' | SecurityAction }> = [
  { label: '全部事件', value: 'ALL' },
  { label: 'IP_BAN_HIT', value: 'IP_BAN_HIT' },
  { label: 'RATE_LIMIT_HIT', value: 'RATE_LIMIT_HIT' },
  { label: 'MALICIOUS_REFERRER_HIT', value: 'MALICIOUS_REFERRER_HIT' },
  { label: 'REDIS_HEALTH_DEGRADED', value: 'REDIS_HEALTH_DEGRADED' },
  { label: 'REDIS_HEALTH_RECOVERED', value: 'REDIS_HEALTH_RECOVERED' },
]

export function SecurityAuditPage() {
  const { showToast } = useToast()
  const [days, setDays] = useState(30)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [eventAction, setEventAction] = useState<'ALL' | SecurityAction>('ALL')
  const [ipKeyword, setIpKeyword] = useState('')
  const [exportActorKeyword, setExportActorKeyword] = useState('')
  const [exportAction, setExportAction] = useState<'ALL' | 'SECURITY_ANALYSIS_EXPORT' | 'SECURITY_EXPORT_HISTORY_EXPORT'>('ALL')
  const [exportMinCount, setExportMinCount] = useState('')
  const [exportMaxCount, setExportMaxCount] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 780], [0, -32])

  const rangeParams = useMemo(() => {
    if (fromDate && toDate) {
      return {
        from: new Date(`${fromDate}T00:00:00`).toISOString(),
        to: new Date(`${toDate}T23:59:59`).toISOString(),
        ...(eventAction !== 'ALL' ? { action: eventAction } : {}),
        ...(ipKeyword.trim() ? { ip: ipKeyword.trim() } : {}),
      }
    }
    return {
      days,
      ...(eventAction !== 'ALL' ? { action: eventAction } : {}),
      ...(ipKeyword.trim() ? { ip: ipKeyword.trim() } : {}),
    }
  }, [days, fromDate, toDate, eventAction, ipKeyword])

  const query = useQuery({
    queryKey: ['stats', 'security-analysis', rangeParams],
    queryFn: () => fetchSecurityAnalysis(rangeParams),
  })

  const exportHistoryParams = useMemo(
    () => ({
      ...(fromDate && toDate
        ? {
            from: new Date(`${fromDate}T00:00:00`).toISOString(),
            to: new Date(`${toDate}T23:59:59`).toISOString(),
          }
        : { days }),
      page: 1,
      pageSize: 10,
      ...(exportActorKeyword.trim() ? { keyword: exportActorKeyword.trim() } : {}),
      ...(exportAction !== 'ALL' ? { action: exportAction } : {}),
      ...(ipKeyword.trim() ? { ip: ipKeyword.trim() } : {}),
      ...(exportMinCount.trim() ? { minCount: Number(exportMinCount) } : {}),
      ...(exportMaxCount.trim() ? { maxCount: Number(exportMaxCount) } : {}),
    }),
    [days, fromDate, toDate, exportActorKeyword, exportAction, ipKeyword, exportMinCount, exportMaxCount],
  )

  const exportHistoryQuery = useQuery({
    queryKey: ['stats', 'security-analysis', 'export-history', exportHistoryParams],
    queryFn: () => fetchSecurityExportHistory(exportHistoryParams),
  })

  const series = query.data?.series ?? []
  const totals = query.data?.totals ?? []
  const recent = query.data?.recent ?? []
  const ipSegments = query.data?.ipSegments ?? []
  const maxCount = Math.max(1, ...series.flatMap((item) => item.points.map((point) => point.count)))
  const totalHits = totals.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-6 overflow-x-hidden">
      <motion.section
        style={{ y: heroY }}
        className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/75 p-5 shadow-[0_32px_96px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-7 dark:border-slate-800/80 dark:bg-slate-950/75"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.2),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(248,113,113,0.16),transparent_40%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Badge>第12阶段 / 安全审计</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">安全事件控制台</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">限流、封禁与恶意来源事件统一可视化与导出审计。</p>
          </div>
          <Button variant="secondary" onClick={() => setShowFilters(true)}>
            <Filter className="h-4 w-4" />
            筛选与导出
          </Button>
        </div>
      </motion.section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { key: 'total', label: '事件总数', value: totalHits, icon: Radar },
          { key: 'uniqueIp', label: 'IP段数', value: ipSegments.length, icon: ShieldBan },
          { key: 'recent', label: '最近事件', value: recent.length, icon: AlertTriangle },
          { key: 'exports', label: '导出任务', value: exportHistoryQuery.data?.total ?? 0, icon: Download },
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

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>安全事件趋势</CardTitle>
            <CardDescription>不同事件按时间桶统计，支持横向滚动查看完整序列。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {series.length === 0 ? (
              <p className="text-sm text-slate-500">当前筛选条件下暂无趋势数据。</p>
            ) : (
              series.map((item, seriesIndex) => (
                <motion.div
                  key={item.action}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.42, delay: seriesIndex * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">{item.action}</p>
                    <p className="text-xs text-slate-500">
                      总计 {item.points.reduce((sum, point) => sum + point.count, 0)}
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex h-28 min-w-[720px] items-end gap-1.5">
                      {item.points.map((point, pointIndex) => {
                        const height = Math.max(6, Math.round((point.count / maxCount) * 100))
                        return (
                          <motion.div
                            key={`${item.action}-${point.bucket}`}
                            initial={{ opacity: 0, y: 8 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-20px' }}
                            transition={{ duration: 0.26, delay: pointIndex * 0.008, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -3 }}
                            className="flex min-w-5 flex-1 flex-col items-center gap-1"
                            title={`${point.bucket}: ${point.count}`}
                          >
                            <div
                              className="w-full rounded-t-md bg-gradient-to-t from-slate-900 to-sky-500 dark:from-slate-100 dark:to-cyan-300"
                              style={{ height: `${height}%` }}
                            />
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IP段命中聚合</CardTitle>
            <CardDescription>支持识别高频风险网段。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ipSegments.length === 0 ? <p className="text-sm text-slate-500">暂无聚合数据</p> : null}
            {ipSegments.map((item, index) => (
              <motion.div
                key={item.segment}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.28, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-800"
              >
                <p className="min-w-0 truncate font-medium">{item.segment}</p>
                <p className="ml-2 shrink-0">{item.count}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近安全事件</CardTitle>
            <CardDescription>最新风控命中与系统事件。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {recent.length === 0 ? <p className="text-slate-500">暂无事件</p> : null}
            {recent.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                <p className="font-medium">
                  [{item.action}] {item.ip ?? 'unknown'}
                </p>
                <p className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>导出任务历史</CardTitle>
            <CardDescription>审计导出轨迹，支持按人/动作/条数过滤。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={exportActorKeyword} onChange={(event) => setExportActorKeyword(event.target.value)} placeholder="操作者关键词" />
              <select
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                value={exportAction}
                onChange={(event) => setExportAction(event.target.value as 'ALL' | 'SECURITY_ANALYSIS_EXPORT' | 'SECURITY_EXPORT_HISTORY_EXPORT')}
              >
                <option value="ALL">全部导出类型</option>
                <option value="SECURITY_ANALYSIS_EXPORT">SECURITY_ANALYSIS_EXPORT</option>
                <option value="SECURITY_EXPORT_HISTORY_EXPORT">SECURITY_EXPORT_HISTORY_EXPORT</option>
              </select>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={exportMinCount} onChange={(event) => setExportMinCount(event.target.value)} placeholder="最小条数" />
              <Input value={exportMaxCount} onChange={(event) => setExportMaxCount(event.target.value)} placeholder="最大条数" />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await exportSecurityExportHistoryCsv({
                    ...exportHistoryParams,
                  })
                  showToast({ title: '导出历史 CSV 已生成', tone: 'success' })
                } catch (error) {
                  showToast({
                    title: '导出历史失败',
                    description: error instanceof Error ? error.message : '请稍后重试',
                    tone: 'error',
                  })
                }
              }}
            >
              <Download className="h-4 w-4" />
              导出历史 CSV
            </Button>
            {(exportHistoryQuery.data?.items ?? []).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                <p className="font-medium">{item.filename}</p>
                <p className="min-w-0 break-all text-slate-500">
                  {new Date(item.createdAt).toLocaleString()} / {item.action} / by {item.user?.username ?? 'unknown'} / ip {item.ip ?? 'unknown'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <MotionDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        header={<p className="text-sm font-semibold">安全筛选与导出</p>}
      >
        <div className="space-y-6">
          <section className="space-y-2">
            <p className="text-sm font-medium">时间范围</p>
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
            <p className="text-sm font-medium">事件过滤</p>
            <select
              className="h-10 w-full rounded-xl border border-slate-300/80 bg-white/85 px-2 text-sm dark:border-slate-700 dark:bg-slate-950/80"
              value={eventAction}
              onChange={(event) => setEventAction(event.target.value as 'ALL' | SecurityAction)}
            >
              {ACTION_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <Input value={ipKeyword} onChange={(event) => setIpKeyword(event.target.value)} placeholder="按 IP 过滤" />
          </section>

          <Button
            className="w-full"
            variant="outline"
            onClick={async () => {
              try {
                await exportSecurityAnalysisCsv(rangeParams)
                showToast({ title: '安全审计 CSV 已生成', tone: 'success' })
              } catch (error) {
                showToast({
                  title: '导出失败',
                  description: error instanceof Error ? error.message : '请稍后重试',
                  tone: 'error',
                })
              }
            }}
          >
            <ShieldCheck className="h-4 w-4" />
            导出安全审计 CSV
          </Button>
        </div>
      </MotionDrawer>
    </div>
  )
}
