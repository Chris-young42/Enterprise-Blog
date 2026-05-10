import { ArrowUpRight, MoonStar, Sparkles, SunMedium } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { siteConfig } from '@/lib/site-config'
import { useTheme } from '@/providers/theme-provider'
import { useSiteAppearance } from '@/providers/site-appearance-provider'
import { fetchAnnouncements, fetchPublicNavConfig, fetchPublicSideNavConfig } from '@/api/site-pages'
import { fetchArticles, fetchArticleArchive } from '@/api/articles'
import { fetchTagAggregate } from '@/api/content-taxonomy'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { HoverFloatCard, PageMotion, StaggerGroup, StaggerItem } from '@/components/motion/motion-shell'

const ANNOUNCEMENT_DISMISSED_KEY = 'enterprise-blog:announcement-dismissed-id'
const HEAD_INJECT_ID = 'site-custom-head'
const FOOTER_INJECT_ID = 'site-custom-footer'
const CSS_INJECT_ID = 'site-custom-css'
const JS_INJECT_ID = 'site-custom-js'

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function applyThemePreset(preset: 'ocean' | 'sunset' | 'forest') {
  const root = document.documentElement
  if (preset === 'sunset') {
    root.style.setProperty('--site-accent-rgb', '217, 119, 6')
    return {
      background:
        'radial-gradient(circle at top left, rgba(251,146,60,0.24), transparent 30%), radial-gradient(circle at bottom right, rgba(244,63,94,0.18), transparent 28%), linear-gradient(180deg, #fff7ed 0%, #ffedd5 45%, #fff7ed 100%)',
      darkBackground:
        'radial-gradient(circle at top left, rgba(251,146,60,0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(244,63,94,0.16), transparent 28%), linear-gradient(180deg, #0c0a09 0%, #1c1917 45%, #0c0a09 100%)',
    }
  }
  if (preset === 'forest') {
    root.style.setProperty('--site-accent-rgb', '22, 101, 52')
    return {
      background:
        'radial-gradient(circle at top left, rgba(74,222,128,0.2), transparent 30%), radial-gradient(circle at bottom right, rgba(16,185,129,0.18), transparent 28%), linear-gradient(180deg, #f0fdf4 0%, #dcfce7 45%, #f0fdf4 100%)',
      darkBackground:
        'radial-gradient(circle at top left, rgba(74,222,128,0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(16,185,129,0.12), transparent 28%), linear-gradient(180deg, #052e16 0%, #022c22 45%, #052e16 100%)',
    }
  }

  root.style.setProperty('--site-accent-rgb', '14, 116, 144')
  return {
    background:
      'radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(129,140,248,0.14), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #eff6ff 45%, #f8fafc 100%)',
    darkBackground:
      'radial-gradient(circle at top left, rgba(34,211,238,0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(99,102,241,0.14), transparent 28%), linear-gradient(180deg, #020617 0%, #0f172a 45%, #020617 100%)',
  }
}

export function AppShell() {
  const { theme, toggleTheme, clearManualTheme } = useTheme()
  const { appearance } = useSiteAppearance()

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
  const sideNavQuery = useQuery({
    queryKey: ['site', 'config', 'side-nav'],
    queryFn: fetchPublicSideNavConfig,
  })

  const latestArticlesQuery = useQuery({
    queryKey: ['site', 'articles', 'latest', 6],
    queryFn: () => fetchArticles({ page: 1, pageSize: 6 }),
    enabled: appearance.widgets.latestArticles,
  })

  const tagCloudQuery = useQuery({
    queryKey: ['site', 'tags', 'aggregate'],
    queryFn: fetchTagAggregate,
    enabled: appearance.widgets.tagCloud,
  })

  const archiveQuery = useQuery({
    queryKey: ['site', 'archive'],
    queryFn: fetchArticleArchive,
    enabled: appearance.widgets.archive,
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

  const sideNavItems = useMemo(() => {
    const remote = sideNavQuery.data
    if (remote && remote.length > 0) return remote
    return siteConfig.sideNav
  }, [sideNavQuery.data])

  const latestItems = latestArticlesQuery.data?.items ?? []
  const tagCloudItems = (tagCloudQuery.data ?? []).slice(0, 12)
  const archiveItems = (archiveQuery.data ?? []).slice(0, 4)

  const [showBackToTop, setShowBackToTop] = useState(false)
  const { scrollY } = useScroll()
  const heroYOffset = useTransform(scrollY, [0, 600], [0, -42])
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.78])

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 280)
    }
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const shellBackground = useMemo(() => {
    const preset = applyThemePreset(appearance.themePreset)
    if (appearance.wallpaperUrl && appearance.wallpaperUrl.trim().length > 0) {
      const escaped = appearance.wallpaperUrl.replace(/"/g, '\\"')
      return {
        background: `linear-gradient(180deg, rgba(255,255,255,0.78), rgba(248,250,252,0.82)), url("${escaped}") center/cover fixed`,
        darkBackground: `linear-gradient(180deg, rgba(2,6,23,0.82), rgba(15,23,42,0.84)), url("${escaped}") center/cover fixed`,
      }
    }
    return preset
  }, [appearance.themePreset, appearance.wallpaperUrl])

  useEffect(() => {
    const root = document.documentElement
    if (appearance.fontFamily === 'serif') {
      root.style.setProperty('--site-font-sans', '"Noto Serif SC"')
    } else if (appearance.fontFamily === 'mono') {
      root.style.setProperty('--site-font-sans', '"JetBrains Mono"')
    } else {
      root.style.setProperty('--site-font-sans', '"Inter"')
    }

    if (appearance.fontScale === 'sm') {
      root.style.setProperty('--site-font-size-base', '14px')
    } else if (appearance.fontScale === 'lg') {
      root.style.setProperty('--site-font-size-base', '18px')
    } else {
      root.style.setProperty('--site-font-size-base', '16px')
    }
  }, [appearance.fontFamily, appearance.fontScale])

  useEffect(() => {
    const cssNode = document.getElementById(CSS_INJECT_ID)
    if (cssNode) cssNode.remove()
    if (appearance.customCss && appearance.customCss.trim().length > 0) {
      const style = document.createElement('style')
      style.id = CSS_INJECT_ID
      style.textContent = appearance.customCss
      document.head.appendChild(style)
    }

    const jsNode = document.getElementById(JS_INJECT_ID)
    if (jsNode) jsNode.remove()
    if (appearance.customJs && appearance.customJs.trim().length > 0) {
      const script = document.createElement('script')
      script.id = JS_INJECT_ID
      script.type = 'text/javascript'
      script.text = appearance.customJs
      document.body.appendChild(script)
    }
  }, [appearance.customCss, appearance.customJs])

  useEffect(() => {
    const headNode = document.getElementById(HEAD_INJECT_ID)
    if (headNode) headNode.remove()
    if (appearance.customHeadHtml && appearance.customHeadHtml.trim().length > 0) {
      const wrapper = document.createElement('div')
      wrapper.id = HEAD_INJECT_ID
      wrapper.innerHTML = appearance.customHeadHtml
      document.head.appendChild(wrapper)
    }

    const footerNode = document.getElementById(FOOTER_INJECT_ID)
    if (footerNode) footerNode.remove()
    if (appearance.customFooterHtml && appearance.customFooterHtml.trim().length > 0) {
      const wrapper = document.createElement('div')
      wrapper.id = FOOTER_INJECT_ID
      wrapper.innerHTML = appearance.customFooterHtml
      document.body.appendChild(wrapper)
    }
  }, [appearance.customHeadHtml, appearance.customFooterHtml])

  return (
    <div
      className={`relative min-h-screen overflow-hidden text-slate-950 dark:text-slate-50 ${
        appearance.animations.pageLoad ? 'site-fade-in' : ''
      }`}
      style={theme === 'dark' ? { background: shellBackground.darkBackground } : { background: shellBackground.background }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        style={{ y: heroYOffset, opacity: heroOpacity }}
      >
        <div className="absolute top-[-240px] left-[-120px] h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(14,116,144,0.24),transparent_72%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(103,232,249,0.16),transparent_72%)]" />
        <div className="absolute right-[-140px] bottom-[-210px] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.2),transparent_72%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(129,140,248,0.18),transparent_72%)]" />
      </motion.div>
      {popupAnnouncement ? (
        <motion.div
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 z-50 border-b border-amber-200/80 bg-amber-50/90 px-4 py-2 text-sm text-amber-900 backdrop-blur-xl dark:border-amber-800/80 dark:bg-amber-950/70 dark:text-amber-100"
        >
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
        </motion.div>
      ) : null}
      <header className="sticky top-0 z-40 border-b border-white/25 bg-white/55 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/45">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-slate-950 text-white shadow-[0_14px_44px_rgba(2,6,23,0.35)] dark:bg-white dark:text-slate-950">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-none">{siteConfig.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Monorepo blog platform</p>
              </div>
            </Link>
          </motion.div>

          <motion.nav
            className="hidden items-center gap-2 rounded-full border border-white/35 bg-white/55 px-2 py-1.5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl md:flex dark:border-slate-800/80 dark:bg-slate-950/55"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </motion.nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="切换主题">
              {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </Button>
            {appearance.themeMode === 'system' ? (
              <Button variant="ghost" size="sm" onClick={clearManualTheme}>
                跟随系统
              </Button>
            ) : null}
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/admin">
                后台入口
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_270px] lg:px-8">
        <PageMotion>
          <div className={appearance.animations.contentReveal ? 'site-fade-in' : ''}>
            <Outlet />
          </div>
        </PageMotion>
        <HoverFloatCard className="h-fit">
          <aside className="space-y-4 rounded-3xl border border-white/60 bg-white/70 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/72">
            <StaggerGroup>
              <StaggerItem>
                <div>
                  <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400">导航</p>
                  <div className="space-y-2">
                    {sideNavItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="block rounded-xl border border-slate-200/85 bg-white/75 px-3 py-2.5 text-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-sky-700 dark:hover:text-sky-300"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </StaggerItem>
              {appearance.widgets.hotArticles ? (
                <StaggerItem>
                  <div>
                    <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">热点</p>
                    <Link
                      to="/tags"
                      className="block rounded-xl border border-slate-200/85 bg-white/75 px-3 py-2.5 text-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-sky-700 dark:hover:text-sky-300"
                    >
                      查看热门榜单
                    </Link>
                  </div>
                </StaggerItem>
              ) : null}

              {appearance.widgets.latestArticles ? (
                <StaggerItem>
                  <div>
                    <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">最新</p>
                    <div className="space-y-2">
                      {latestItems.map((item) => (
                        <Link
                          key={item.id}
                          to={`/articles/${item.slug}`}
                          className="block rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-sky-700 dark:hover:text-sky-300"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              ) : null}

              {appearance.widgets.tagCloud ? (
                <StaggerItem>
                  <div>
                    <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">标签云</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tagCloudItems.map((tag) => (
                        <Badge key={tag.id}>{tag.name}</Badge>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              ) : null}

              {appearance.widgets.archive ? (
                <StaggerItem>
                  <div>
                    <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase dark:text-slate-400">归档</p>
                    <div className="space-y-2">
                      {archiveItems.map((item) => (
                        <div
                          key={item.year}
                          className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950/70"
                        >
                          {item.year} 年 / {item.months.length} 月
                        </div>
                      ))}
                    </div>
                  </div>
                </StaggerItem>
              ) : null}

              <StaggerItem>
                <div className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/70">
                  更新时间：{formatDate(new Date())}
                </div>
              </StaggerItem>
            </StaggerGroup>
          </aside>
        </HoverFloatCard>
      </main>

      {appearance.backToTop && showBackToTop ? (
        <motion.button
          initial={{ opacity: 0, scale: 0.85, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 12 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          type="button"
          className="fixed right-6 bottom-6 z-40 rounded-full border border-slate-300/70 bg-white/85 px-3 py-2 text-xs shadow-[0_20px_50px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/80"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          回到顶部
        </motion.button>
      ) : null}

      {appearance.floatingAction ? (
        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}>
          <Link
            to="/message-board"
            className="fixed right-6 bottom-20 z-40 rounded-full border border-white/30 bg-slate-950 px-3 py-2 text-xs text-white shadow-[0_20px_50px_rgba(2,6,23,0.4)] dark:bg-white dark:text-slate-950"
          >
            树洞留言
          </Link>
        </motion.div>
      ) : null}
    </div>
  )
}
