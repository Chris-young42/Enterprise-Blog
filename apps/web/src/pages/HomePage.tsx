import { ArrowRight, BarChart3, BookOpen, MessageSquareMore, Search, ShieldCheck, Sparkles, Tags, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PopularArticlesPanel } from '@/components/PopularArticlesPanel'
import { MotionModal } from '@/components/motion/MotionModal'
import { useState } from 'react'

const features = [
  { icon: BookOpen, title: '内容全流程', description: '草稿、发布、定时、置顶、推荐、归档一体化。' },
  { icon: MessageSquareMore, title: '评论社交', description: '楼中楼、审核、通知与互动策略完整闭环。' },
  { icon: ShieldCheck, title: '安全防护', description: '鉴权、限流、验证码、敏感词、审计全链路。' },
  { icon: BarChart3, title: '统计可视化', description: '流量、内容、设备、蜘蛛、安全维度联动。' },
]

export function HomePage() {
  const [showGuide, setShowGuide] = useState(false)
  return (
    <div className="space-y-8 pb-10 sm:space-y-10 sm:pb-14">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          className="site-glass relative overflow-hidden rounded-3xl p-5 sm:p-7"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.13),transparent_42%)]" />
          <div className="relative space-y-5">
            <Badge className="w-fit">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Enterprise Blog System / Monorepo
            </Badge>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              现代内容平台的
              <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-500 bg-clip-text text-transparent"> 高级工程化底座</span>
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
              全站进入统一视觉与动效体系，前后台保持一致的高级质感与流畅交互。核心模块支持持续扩展，满足企业级长期迭代。
            </p>
            <div className="flex flex-wrap gap-2.5">
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
              <Button variant="secondary" size="lg" onClick={() => setShowGuide(true)}>
                快速导览
              </Button>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {[
                ['80+', '需求追踪项'],
                ['100%', '前后端分离'],
                ['RBAC', '权限基线'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/45 bg-white/72 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/72">
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-slate-900/10 bg-slate-950 p-5 text-white shadow-[0_40px_120px_rgba(2,6,23,0.45)] sm:p-7"
        >
          <p className="mb-4 text-xs font-medium tracking-[0.2em] text-slate-300 uppercase">Phase Snapshot</p>
          <div className="grid gap-3">
            {[
              ['后端模块', '10+'],
              ['关键接口', '60+'],
              ['安全策略', '完整闭环'],
              ['动效体系', 'Framer Motion'],
            ].map((item) => (
              <motion.div
                key={item[0]}
                whileHover={{ x: 3 }}
                className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3"
              >
                <p className="text-xs text-slate-300">{item[0]}</p>
                <p className="mt-1 text-xl font-semibold">{item[1]}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.42, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/78 dark:border-slate-800 dark:bg-slate-950/70">
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

      <section className="grid gap-4 lg:grid-cols-[1.06fr_0.94fr]">
        <Card>
          <CardHeader>
            <CardTitle>全站检索入口</CardTitle>
            <CardDescription>标题、正文、标签关键词统一检索入口。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="搜索文章、标签、专题..." />
            <div className="flex flex-wrap gap-2">
              {['SEO', 'NestJS', '评论系统', 'MySQL', '权限'].map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>工程规范</CardTitle>
            <CardDescription>模块化、角色隔离、异常处理、校验与审计。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            {[
              '前端：路由懒加载 + 鉴权状态 + 受保护路由',
              '后端：NestJS模块化 + JWT + RBAC守卫',
              '数据层：MySQL + Prisma + 软删除 + 索引',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <Zap className="mt-0.5 h-4 w-4 text-sky-500" />
                <span className="min-w-0">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.06fr_0.94fr]">
        <PopularArticlesPanel />
        <Card>
          <CardHeader>
            <CardTitle>快速阅读入口</CardTitle>
            <CardDescription>从热门榜单与标签聚合进入详情阅读。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
              文章详情页支持公开阅读与密码访问，自动展示字数、阅读时长、版权标识和标签跳转。
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

      <MotionModal
        open={showGuide}
        onClose={() => setShowGuide(false)}
        title="快速导览"
        description="三步进入系统核心路径"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowGuide(false)}>
              关闭
            </Button>
            <Button asChild>
              <Link to="/admin">进入后台</Link>
            </Button>
          </div>
        }
      >
        <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-800">1. 先看后台总览的全站数据和日志趋势。</li>
          <li className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-800">2. 进入文章管理和评论审核，验证内容全流程。</li>
          <li className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-800">3. 到安全策略与审计页查看风控和可视化分析。</li>
        </ol>
      </MotionModal>
    </div>
  )
}
