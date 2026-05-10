import { useAuthStore } from '@/store/auth-store'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminOverviewPage() {
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Badge className="w-fit">管理后台</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">控制台总览</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">第3阶段已接入鉴权状态、路由权限与API数据层。</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['当前用户', user?.username ?? '未登录'],
          ['昵称', profile?.nickname ?? '--'],
          ['角色', user?.roleCodes.join(' / ') ?? '--'],
          ['邮箱', user?.email ?? '--'],
        ].map(([label, value]) => (
          <Card key={label} className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle>{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>第3阶段完成项</CardTitle>
          <CardDescription>前端工程化基础设施已具备继续扩展业务模块的条件。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            '统一 API 客户端与错误处理',
            'Zustand 鉴权状态持久化',
            '受保护路由与角色路由',
            '后台壳层与模块导航',
            '分类/标签/专题数据看板',
            '角色权限读取与可视化',
          ].map((text) => (
            <div key={text} className="rounded-2xl border border-slate-200 p-3 text-sm dark:border-slate-800">
              {text}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
