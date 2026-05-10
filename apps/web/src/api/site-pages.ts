import { httpRequest } from './http'

type PageItem = {
  id: string
  title: string
  slug: string
  content: string
  seoTitle: string | null
  seoDescription: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

type MessageBoardItem = {
  id: string
  userId: string | null
  content: string
  isAnonymous: boolean
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  sensitiveHits?: string[]
  createdAt: string
  updatedAt: string
}

type FriendLinkItem = {
  id: string
  name: string
  url: string
  logo: string | null
  description: string | null
  email: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  sortOrder: number
  createdAt: string
  updatedAt: string
}

type AnnouncementItem = {
  id: string
  title: string
  content: string
  startsAt: string | null
  endsAt: string | null
  isPopup: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type AppearanceConfig = {
  themeMode: 'light' | 'dark' | 'system'
  themePreset: 'ocean' | 'sunset' | 'forest'
  wallpaperUrl?: string
  fontFamily: 'sans' | 'serif' | 'mono'
  fontScale: 'sm' | 'md' | 'lg'
  widgets: {
    hotArticles: boolean
    latestArticles: boolean
    tagCloud: boolean
    archive: boolean
  }
  animations: {
    pageLoad: boolean
    contentReveal: boolean
    interactive: boolean
  }
  backToTop: boolean
  floatingAction: boolean
  customCss?: string
  customJs?: string
  customHeadHtml?: string
  customFooterHtml?: string
}

export type { PageItem, MessageBoardItem, FriendLinkItem, AnnouncementItem }

export function fetchPages(published = true) {
  return httpRequest<PageItem[]>(`/pages?published=${published ? 'true' : 'false'}`)
}

export function fetchPageBySlug(slug: string) {
  return httpRequest<PageItem>(`/pages/${slug}`)
}

export function createPage(payload: {
  title: string
  slug: string
  content: string
  seoTitle?: string
  seoDescription?: string
  isPublished?: boolean
}) {
  return httpRequest<PageItem>('/pages', {
    method: 'POST',
    body: payload,
  })
}

export function updatePage(
  id: string,
  payload: {
    title?: string
    slug?: string
    content?: string
    seoTitle?: string | null
    seoDescription?: string | null
    isPublished?: boolean
  },
) {
  return httpRequest<PageItem>(`/pages/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deletePage(id: string) {
  return httpRequest<{ id: string }>(`/pages/${id}`, {
    method: 'DELETE',
  })
}

type MessageBoardListResponse = {
  items: MessageBoardItem[]
  total: number
  page: number
  pageSize: number
}

export function fetchMessageBoard(params?: { page?: number; pageSize?: number; sort?: 'latest' | 'oldest' }) {
  const queryParts: string[] = []
  if (params?.page) queryParts.push(`page=${params.page}`)
  if (params?.pageSize) queryParts.push(`pageSize=${params.pageSize}`)
  if (params?.sort) queryParts.push(`sort=${params.sort}`)
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  return httpRequest<MessageBoardListResponse>(`/message-board${query}`)
}

export function createMessageBoard(payload: { content: string; isAnonymous?: boolean }) {
  return httpRequest<MessageBoardItem>('/message-board', {
    method: 'POST',
    body: payload,
  })
}

export function fetchAdminMessageBoard(status?: string) {
  const query = status ? `?status=${status}` : ''
  return httpRequest<MessageBoardItem[]>(`/message-board/admin/list${query}`)
}

export function fetchAdminMessageBoardByQuery(params?: {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  isAnonymous?: boolean
}) {
  const queryParts: string[] = []
  if (params?.status) queryParts.push(`status=${params.status}`)
  if (params?.isAnonymous !== undefined) queryParts.push(`isAnonymous=${params.isAnonymous ? 'true' : 'false'}`)
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  return httpRequest<MessageBoardItem[]>(`/message-board/admin/list${query}`)
}

export function reviewMessageBoard(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  return httpRequest<MessageBoardItem>(`/message-board/admin/${id}/review`, {
    method: 'PATCH',
    body: { status },
  })
}

export function batchReviewMessageBoard(ids: string[], status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  return httpRequest<{ affected: number }>('/message-board/admin/batch/review', {
    method: 'PATCH',
    body: { ids, status },
  })
}

export function batchRemoveMessageBoard(ids: string[]) {
  return httpRequest<{ affected: number }>('/message-board/admin/batch/remove', {
    method: 'PATCH',
    body: { ids },
  })
}

export function fetchFriendLinks() {
  return httpRequest<FriendLinkItem[]>('/friend-links')
}

export function applyFriendLink(payload: {
  name: string
  url: string
  logo?: string
  description?: string
  email?: string
  sortOrder?: number
}) {
  return httpRequest<FriendLinkItem>('/friend-links/apply', {
    method: 'POST',
    body: payload,
  })
}

export function fetchAdminFriendLinks() {
  return httpRequest<FriendLinkItem[]>('/friend-links/admin/list')
}

export function createFriendLink(payload: {
  name: string
  url: string
  logo?: string
  description?: string
  email?: string
  sortOrder?: number
}) {
  return httpRequest<FriendLinkItem>('/friend-links', {
    method: 'POST',
    body: payload,
  })
}

export function updateFriendLink(
  id: string,
  payload: {
    name?: string
    url?: string
    logo?: string | null
    description?: string | null
    email?: string | null
    sortOrder?: number
  },
) {
  return httpRequest<FriendLinkItem>(`/friend-links/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteFriendLink(id: string) {
  return httpRequest<{ id: string }>(`/friend-links/${id}`, {
    method: 'DELETE',
  })
}

export function reviewFriendLink(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  return httpRequest<FriendLinkItem>(`/friend-links/admin/${id}/review`, {
    method: 'PATCH',
    body: { status },
  })
}

export function batchReviewFriendLinks(ids: string[], status: 'PENDING' | 'APPROVED' | 'REJECTED') {
  return httpRequest<{ affected: number }>('/friend-links/admin/batch/review', {
    method: 'PATCH',
    body: { ids, status },
  })
}

export function reorderFriendLinks(ids: string[]) {
  return httpRequest<{ affected: number }>('/friend-links/admin/reorder', {
    method: 'PATCH',
    body: { ids },
  })
}

export function fetchAnnouncements() {
  return httpRequest<AnnouncementItem[]>('/announcements')
}

export function fetchAdminAnnouncements() {
  return httpRequest<AnnouncementItem[]>('/announcements/admin/list')
}

export function createAnnouncement(payload: {
  title: string
  content: string
  startsAt?: string
  endsAt?: string
  isPopup?: boolean
  isActive?: boolean
}) {
  return httpRequest<AnnouncementItem>('/announcements', {
    method: 'POST',
    body: payload,
  })
}

export function updateAnnouncement(
  id: string,
  payload: {
    title?: string
    content?: string
    startsAt?: string | null
    endsAt?: string | null
    isPopup?: boolean
    isActive?: boolean
  },
) {
  return httpRequest<AnnouncementItem>(`/announcements/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteAnnouncement(id: string) {
  return httpRequest<{ id: string }>(`/announcements/${id}`, {
    method: 'DELETE',
  })
}

export type SiteNavItem = {
  label: string
  href: string
}

type SiteConfigItem = {
  id: string
  key: string
  value: unknown
  description: string | null
  createdAt: string
  updatedAt: string
}

export function fetchPublicNavConfig() {
  return httpRequest<SiteNavItem[] | null>('/site-configs/public/nav')
}

export function fetchPublicSideNavConfig() {
  return httpRequest<SiteNavItem[] | null>('/site-configs/public/side-nav')
}

export function fetchPublicAppearanceConfig() {
  return httpRequest<AppearanceConfig | null>('/site-configs/public/appearance')
}

export function fetchSiteConfigs() {
  return httpRequest<SiteConfigItem[]>('/site-configs')
}

export function upsertNavConfig(items: SiteNavItem[]) {
  return httpRequest<SiteConfigItem>('/site-configs/nav', {
    method: 'POST',
    body: { items },
  })
}

export function upsertSideNavConfig(items: SiteNavItem[]) {
  return httpRequest<SiteConfigItem>('/site-configs/side-nav', {
    method: 'POST',
    body: { items },
  })
}

export function upsertAppearanceConfig(payload: AppearanceConfig) {
  return httpRequest<SiteConfigItem>('/site-configs/appearance', {
    method: 'POST',
    body: payload,
  })
}