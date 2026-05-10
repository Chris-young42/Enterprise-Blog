import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layouts/AppShell'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { AdminRoleGuard } from '@/components/guards/AdminRoleGuard'
import { AdminShell } from '@/components/layouts/AdminShell'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { HomePage } = await import('@/pages/HomePage')
          return { Component: HomePage }
        },
      },
      {
        path: 'articles/:slug',
        lazy: async () => {
          const { ArticleDetailPage } = await import('@/pages/ArticleDetailPage')
          return { Component: ArticleDetailPage }
        },
      },
      {
        path: 'tags',
        lazy: async () => {
          const { TagsAggregatePage } = await import('@/pages/TagsAggregatePage')
          return { Component: TagsAggregatePage }
        },
      },
      {
        path: 'pages',
        lazy: async () => {
          const { PagesIndexPage } = await import('@/pages/PagesIndexPage')
          return { Component: PagesIndexPage }
        },
      },
      {
        path: 'pages/:slug',
        lazy: async () => {
          const { StaticPageDetailPage } = await import('@/pages/StaticPageDetailPage')
          return { Component: StaticPageDetailPage }
        },
      },
      {
        path: 'message-board',
        lazy: async () => {
          const { MessageBoardPage } = await import('@/pages/MessageBoardPage')
          return { Component: MessageBoardPage }
        },
      },
      {
        path: 'friend-links',
        lazy: async () => {
          const { FriendLinksPage } = await import('@/pages/FriendLinksPage')
          return { Component: FriendLinksPage }
        },
      },
      {
        path: 'moments',
        lazy: async () => {
          const { MomentsPage } = await import('@/pages/MomentsPage')
          return { Component: MomentsPage }
        },
      },
      {
        path: 'moments/:slug',
        lazy: async () => {
          const { MomentDetailPage } = await import('@/pages/MomentDetailPage')
          return { Component: MomentDetailPage }
        },
      },
      {
        path: 'timeline',
        lazy: async () => {
          const { TimelinePage } = await import('@/pages/TimelinePage')
          return { Component: TimelinePage }
        },
      },
      {
        path: 'downloads',
        lazy: async () => {
          const { DownloadsPage } = await import('@/pages/DownloadsPage')
          return { Component: DownloadsPage }
        },
      },
      {
        path: 'media',
        lazy: async () => {
          const { MediaShowcasePage } = await import('@/pages/MediaShowcasePage')
          return { Component: MediaShowcasePage }
        },
      },
      {
        path: 'users/:id',
        lazy: async () => {
          const { UserProfilePage } = await import('@/pages/UserProfilePage')
          return { Component: UserProfilePage }
        },
      },
      {
        path: 'auth/login',
        lazy: async () => {
          const { LoginPage } = await import('@/pages/auth/LoginPage')
          return { Component: LoginPage }
        },
      },
      {
        path: 'admin',
        element: (
          <RequireAuth>
            <AdminShell />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            lazy: async () => {
              const { AdminOverviewPage } = await import('@/pages/admin/AdminOverviewPage')
              return { Component: AdminOverviewPage }
            },
          },
          {
            path: 'articles',
            lazy: async () => {
              const { ArticlesPage } = await import('@/pages/admin/ArticlesPage')
              return { Component: ArticlesPage }
            },
          },
          {
            path: 'comments',
            lazy: async () => {
              const { CommentsReviewPage } = await import('@/pages/admin/CommentsReviewPage')
              return { Component: CommentsReviewPage }
            },
          },
          {
            path: 'users',
            lazy: async () => {
              const { UsersPage } = await import('@/pages/admin/UsersPage')
              return { Component: UsersPage }
            },
          },
          {
            path: 'categories',
            lazy: async () => {
              const { CategoriesPage } = await import('@/pages/admin/CategoriesPage')
              return { Component: CategoriesPage }
            },
          },
          {
            path: 'tags',
            lazy: async () => {
              const { TagsPage } = await import('@/pages/admin/TagsPage')
              return { Component: TagsPage }
            },
          },
          {
            path: 'series',
            lazy: async () => {
              const { SeriesPage } = await import('@/pages/admin/SeriesPage')
              return { Component: SeriesPage }
            },
          },
          {
            path: 'media',
            lazy: async () => {
              const { MediaCenterPage } = await import('@/pages/admin/MediaCenterPage')
              return { Component: MediaCenterPage }
            },
          },
          {
            path: 'site-pages',
            lazy: async () => {
              const { SitePagesAdminPage } = await import('@/pages/admin/SitePagesAdminPage')
              return { Component: SitePagesAdminPage }
            },
          },
          {
            path: 'message-board',
            lazy: async () => {
              const { MessageBoardAdminPage } = await import('@/pages/admin/MessageBoardAdminPage')
              return { Component: MessageBoardAdminPage }
            },
          },
          {
            path: 'friend-links',
            lazy: async () => {
              const { FriendLinksAdminPage } = await import('@/pages/admin/FriendLinksAdminPage')
              return { Component: FriendLinksAdminPage }
            },
          },
          {
            path: 'announcements',
            lazy: async () => {
              const { AnnouncementsAdminPage } = await import('@/pages/admin/AnnouncementsAdminPage')
              return { Component: AnnouncementsAdminPage }
            },
          },
          {
            path: 'site-configs',
            lazy: async () => {
              const { SiteConfigAdminPage } = await import('@/pages/admin/SiteConfigAdminPage')
              return { Component: SiteConfigAdminPage }
            },
          },
          {
            path: 'moments',
            lazy: async () => {
              const { MomentsAdminPage } = await import('@/pages/admin/MomentsAdminPage')
              return { Component: MomentsAdminPage }
            },
          },
          {
            path: 'roles',
            element: <AdminRoleGuard />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const { RolesPage } = await import('@/pages/admin/RolesPage')
                  return { Component: RolesPage }
                },
              },
            ],
          },
          {
            path: 'forbidden',
            lazy: async () => {
              const { ForbiddenPage } = await import('@/pages/admin/ForbiddenPage')
              return { Component: ForbiddenPage }
            },
          },
        ],
      },
      {
        path: 'dashboard',
        lazy: async () => {
          const { DashboardPage } = await import('@/pages/DashboardPage')
          return { Component: DashboardPage }
        },
      },
      {
        path: '*',
        lazy: async () => {
          const { NotFoundPage } = await import('@/pages/NotFoundPage')
          return { Component: NotFoundPage }
        },
      },
    ],
  },
])

export default router
