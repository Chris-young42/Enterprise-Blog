import { ArrowUpRight, MoonStar, Sparkles, SunMedium } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/lib/site-config'
import { useTheme } from '@/providers/theme-provider'
import { fetchAnnouncements, fetchPublicNavConfig } from '@/api/site-pages'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

const ANNOUNCEMENT_DISMISSED_KEY = 'enterprise-blog:announcement-dismissed-id'

export function AppShell() {
  const { theme, toggleTheme } = useTheme()
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY)
  })
  const navQuery = useQuery({
    queryKey: ['site', 'config', 'nav'],
    queryFn: fetchPublicNavConfig,
  })
  const announcementsQuery = useQuery({
    queryKey: ['site', 'announcements'],
    queryFn: fetchAnnouncements,
  })
  const navItems = useMemo(() => {
    const remote = navQuery.data
    if (remote && remote.length > 0) return remote
    return siteConfig.nav
  }, [navQuery.data])

  const popupAnnouncement = useMemo(() => {
    return (
      (announcementsQuery.data ?? []).find(
        (item) => item.isPopup && item.isActive && item.id !== dismissedAnnouncementId,
      ) ?? null
    )
  }, [announcementsQuery.data, dismissedAnnouncementId])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_45%,_#f8fafc_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.14),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] dark:text-slate-50">
      {popupAnnouncement ? (
        <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/70 dark:text-amber-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <p className="truncate">
              <span className="font-semibold">{popupAnnouncement.title}</span>：{popupAnnouncement.content}
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (!popupAnnouncement) return
                setDismissedAnnouncementId(popupAnnouncement.id)
                window.localStorage.setItem(ANNOUNCEMENT_DISMISSED_KEY, popupAnnouncement.id)
              }}
            >
              关闭
            </Button>
          </div>
        </div>
      ) : null}
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-sky-500/20 dark:bg-white dark:text-slate-950">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">{siteConfig.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monorepo blog platform</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `text-sm transition hover:text-sky-600 dark:hover:text-sky-400 ${
                    isActive ? 'font-semibold text-slate-950 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="切换主题">
              {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </Button>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/admin">
                后台入口
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
