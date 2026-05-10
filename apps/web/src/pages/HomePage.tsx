import { ArrowRight, BarChart3, BookOpen, MessageSquareMore, Search, ShieldCheck, Sparkles, Tags, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PopularArticlesPanel } from '@/components/PopularArticlesPanel'

const features = [
  { icon: BookOpen, title: '内容全流程', description: '草稿、发布、定时、置顶、推荐与归档一体化管理。' },
  { icon: MessageSquareMore, title: '评论社交', description: '楼中楼、审核、通知、表情与图片回复完整闭环。' },
  { icon: ShieldCheck, title: '安全防护', description: '鉴权、限流、敏感词、验证码与风控策略逐步落地。' },
  { icon: BarChart3, title: '统计分析', description: '阅读、点赞、收藏、访客与蜘蛛访问数据沉淀。' },
]

export function HomePage() {
  return (
    <div className="space-y-10 pb-12">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="space-y-6"
        >
          <Badge className="w-fit border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            pnpm + monorepo / React + NestJS
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              企业级博客系统的工程化底座
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              前后端分离架构已经完成第1、2阶段。当前第3阶段已接入统一 API 层、鉴权状态、路由权限与后台信息架构。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/admin">
                进入后台
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/tags">
                标签聚合
                <Tags className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['80+', '需求追踪项'],
              ['100%', '前后端分离'],
              ['RBAC', '角色权限基线'],
            ].map(([value, label]) => (
              <Card key={label} className="border-white/60 bg-white/70 shadow-none dark:border-slate-800/80 dark:bg-slate-950/70">
                <CardContent className="p-4">
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
        >
          <Card className="relative overflow-hidden border-white/50 bg-slate-950 text-white shadow-[0_40px_120px_rgba(15,23,42,0.35)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.32),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(129,140,248,0.28),_transparent_24%)]" />
            <CardHeader className="relative">
              <Badge className="w-fit border-white/15 bg-white/10 text-white">阶段能力面板</Badge>
              <CardTitle className="text-2xl">当前系统状态</CardTitle>
              <CardDescription className="text-slate-300">
                已具备鉴权、角色守卫、分类标签专题管理与后台入口。
              </CardDescription>
            </CardHeader>
            <CardContent className="relative grid gap-4 sm:grid-cols-2">
              {[
                ['后端模块', '7+', 'bg-cyan-500/15 text-cyan-200'],
                ['REST接口', '20+', 'bg-indigo-500/15 text-indigo-200'],
                ['编译状态', 'PASS', 'bg-emerald-500/15 text-emerald-200'],
                ['下一阶段', '内容管理', 'bg-rose-500/15 text-rose-200'],
              ].map(([label, value, tone]) => (
                <div key={label} className={`rounded-2xl p-4 ${tone}`}>
                  <p className="text-sm opacity-80">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="h-full border-white/60 bg-white/75 dark:border-slate-800/80 dark:bg-slate-950/80">
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card className="border-white/60 bg-white/75 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>检索入口</CardTitle>
            <CardDescription>标题、正文、标签关键词的统一搜索入口（后续接全文检索引擎）。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="搜索文章、标签、专题..." />
            <div className="flex flex-wrap gap-2">
              {['SEO', 'NestJS', '评论系统', 'MySQL', '权限'].map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/75 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>工程规范</CardTitle>
            <CardDescription>统一返回、角色隔离、全局异常、参数校验与模块化分层。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            {[
              '前端：路由懒加载 + 鉴权状态 + 受保护路由',
              '后端：NestJS模块化 + JWT + RBAC守卫',
              '数据层：MySQL + Prisma + 软删除 + 索引',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200/70 p-3 dark:border-slate-800">
                <Zap className="mt-0.5 h-4 w-4 text-sky-500" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <PopularArticlesPanel />
        <Card className="border-white/60 bg-white/75 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>快速阅读入口</CardTitle>
            <CardDescription>从热门榜单或标签聚合页进入文章详情。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-2xl border border-slate-200/70 p-3 dark:border-slate-800">
              文章详情页支持公开阅读与密码访问，自动展示字数、阅读时长、版权标识与标签跳转。
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/tags">
                去标签聚合页
                <Search className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
