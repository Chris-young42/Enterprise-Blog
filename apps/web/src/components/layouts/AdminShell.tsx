import { LayoutDashboard, LogOut, ShieldAlert, Tags, UserRound, FolderTree, LibraryBig, FileText, MessageSquare, Image, PanelsTopLeft, Link2, Megaphone, Settings2, Clock3, BellRing, DatabaseBackup, ShieldBan, Building2, Shield, Radar } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { PageMotion, StaggerGroup, StaggerItem } from '@/components/motion/motion-shell'

const navItems = [
  { to: '/admin', label: '总览', icon: LayoutDashboard, end: true },
  { to: '/admin/articles', label: '文章管理', icon: FileText },
  { to: '/admin/comments', label: '评论审核', icon: MessageSquare },
  { to: '/admin/users', label: '用户中心', icon: UserRound },
  { to: '/admin/categories', label: '分类管理', icon: FolderTree },
  { to: '/admin/tags', label: '标签管理', icon: Tags },
  { to: '/admin/series', label: '专题管理', icon: LibraryBig },
  { to: '/admin/media', label: '媒体中心', icon: Image },
  { to: '/admin/site-pages', label: '独立页面', icon: PanelsTopLeft },
  { to: '/admin/message-board', label: '留言审核', icon: MessageSquare },
  { to: '/admin/friend-links', label: '友链审核', icon: Link2 },
  { to: '/admin/announcements', label: '公告管理', icon: Megaphone },
  { to: '/admin/moments', label: '随笔动态', icon: Clock3 },
  { to: '/admin/site-configs', label: '站点配置', icon: Settings2 },
  { to: '/admin/site-profile', label: '基础信息', icon: Building2 },
  { to: '/admin/sensitive-words', label: '敏感词库', icon: ShieldBan },
  { to: '/admin/notifications', label: '消息中心', icon: BellRing },
  { to: '/admin/security', label: '安全策略', icon: Shield },
  { to: '/admin/security-audit', label: '安全审计', icon: Radar },
  { to: '/admin/ops', label: '运维控制', icon: DatabaseBackup },
  { to: '/admin/ops-approvals', label: '审批记录', icon: ShieldAlert },
  { to: '/admin/roles', label: '角色权限', icon: ShieldAlert },
]

export function AdminShell() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

  const handleLogout = () => {
    logout()
    navigate('/auth/login', { replace: true })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="h-fit rounded-3xl border border-white/60 bg-white/82 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/82"
      >
        <div className="mb-4 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">当前账号</p>
          <p className="mt-1 text-sm font-semibold">{user?.nickname ?? user?.username ?? '未登录'}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user?.roleCodes.join(' / ')}</p>
        </div>
        <StaggerGroup>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const end = item.end === true
              return (
                <StaggerItem key={item.to}>
                  <NavLink
                    to={item.to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                        isActive
                          ? 'bg-slate-950 text-white shadow-[0_14px_36px_rgba(2,6,23,0.3)] dark:bg-white dark:text-slate-950'
                          : 'text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/80'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                </StaggerItem>
              )
            })}
          </nav>
        </StaggerGroup>
        <Button variant="outline" className="mt-4 w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          退出登录
        </Button>
      </motion.aside>
      <section>
        <PageMotion>
          <Outlet />
        </PageMotion>
      </section>
    </div>
  )
}
