import { Activity, Database, ShieldCheck, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const metrics = [
  { icon: Activity, label: '访问趋势', value: '日 +24%', tone: 'text-emerald-600 dark:text-emerald-400' },
  { icon: Database, label: '内容条目', value: '1,248', tone: 'text-sky-600 dark:text-sky-400' },
  { icon: Users, label: '活跃用户', value: '382', tone: 'text-indigo-600 dark:text-indigo-400' },
  { icon: ShieldCheck, label: '安全拦截', value: '37', tone: 'text-rose-600 dark:text-rose-400' },
]

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <Badge className="w-fit">后台仪表盘</Badge>
        <h2 className="text-3xl font-semibold tracking-tight">系统概览</h2>
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          此页作为前台可见的示意看板，真实管理入口请使用 /admin 路由。
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className={`mt-2 text-3xl ${metric.tone}`}>{metric.value}</CardTitle>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="text-sm text-slate-500 dark:text-slate-400">
                该数据用于演示布局，后续将接入真实统计接口。
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>阶段路线图</CardTitle>
          <CardDescription>已完成基础架构与鉴权，下一步进入内容管理主流程。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {['文章管理', '评论系统', '用户关系', '媒体资源', '站点栏目', '统计日志'].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
