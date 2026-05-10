export type ApiSuccess<T> = {
  success: true
  code: number
  message: string
  data: T
  timestamp: string
}

export type ApiFailure = {
  success: false
  code: number
  message: string
  path?: string
  timestamp: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export type PublicUserProfile = {
  id: string
  username: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
  signature: string | null
  website: string | null
  location: string | null
  followerCount: number
  followingCount: number
  articleCount: number
  isFollowing: boolean
  isSelf: boolean
}

export type UserProfile = PublicUserProfile & {
  email: string
  roleCodes: string[]
}

export type AuthUser = {
  id: string
  username: string
  email: string
  nickname: string | null
  roleCodes: string[]
}

export type AuthLoginResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: string
  user: AuthUser
}

export type CategoryItem = {
  id: string
  parentId: string | null
  name: string
  slug: string
  description: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type TagItem = {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type TagAggregateItem = {
  id: string
  name: string
  slug: string
  description: string | null
  articleCount: number
  createdAt: string
  updatedAt: string
}

export type SeriesItem = {
  id: string
  title: string
  slug: string
  description: string | null
  coverUrl: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type RoleListItem = {
  id: string
  code: string
  name: string
  description: string | null
  permissions: Array<{
    id: string
    key: string
    name: string
  }>
}

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED'
export type ArticleOrigin = 'ORIGINAL' | 'REPRINT' | 'TRANSLATION'
export type ContentVisibility = 'PUBLIC' | 'FOLLOWER' | 'LOGGED_IN' | 'PRIVATE' | 'PASSWORD'

export type ArticleItem = {
  id: string
  title: string
  slug: string
  summary: string | null
  contentMarkdown: string
  contentHtml: string | null
  status: ArticleStatus
  origin: ArticleOrigin
  visibility: ContentVisibility
  isPinned: boolean
  isRecommended: boolean
  publishAt: string | null
  scheduledAt: string | null
  views: number
  likes: number
  favorites: number
  commentCount: number
  wordCount: number
  readingMinutes: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    nickname: string | null
  }
  category: {
    id: string
    name: string
    slug: string
  } | null
  series: {
    id: string
    title: string
    slug: string
  } | null
  tags: Array<{
    id: string
    name: string
    slug: string
  }>
}

export type ArticleListResult = {
  items: ArticleItem[]
  total: number
  page: number
  pageSize: number
}

export type ArticleArchiveResult = Array<{
  year: string
  months: Array<{
    month: string
    items: Array<{
      id: string
      title: string
      slug: string
      date: string
    }>
  }>
}>

export type CommentReviewState = 'PENDING' | 'APPROVED' | 'REJECTED'

export type CommentItem = {
  id: string
  articleId: string
  parentId: string | null
  rootId: string | null
  content: string
  images: string[]
  isAnonymous: boolean
  isAuthor: boolean
  likes: number
  dislikes: number
  reports: number
  floor: number
  reviewState: CommentReviewState
  createdAt: string
  updatedAt: string
  isMine: boolean
  user: {
    id: string
    username: string
    nickname: string | null
    avatarUrl: string | null
  } | null
}

export type CommentTreeItem = CommentItem & {
  replies: CommentItem[]
}

export type CommentListResult = {
  items: CommentTreeItem[]
  total: number
  page: number
  pageSize: number
}

export type PendingCommentListResult = {
  items: CommentItem[]
  total: number
  page: number
  pageSize: number
}

export type CommentPolicy = {
  guestCommentEnabled: boolean
  autoReviewEnabled: boolean
  reviewMode: 'MANUAL' | 'MIXED'
  sensitiveWords: string[]
  blockedUserIds: string[]
  captchaRequired: boolean
  commentCooldownSeconds: number
  commentMaxPerHour: number
  emailNotificationEnabled: boolean
}

export type PublicCommentPolicy = {
  guestCommentEnabled: boolean
  captchaRequired: boolean
  commentCooldownSeconds: number
}

export type CommentCaptcha = {
  question: string
  token: string
  expiresAt: string
}

export type BlockedCommentUser = {
  id: string
  username: string | null
  nickname: string | null
  email: string | null
}

export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'FILE'

export type MediaAssetItem = {
  id: string
  uploaderId: string | null
  type: MediaType
  bucket: string | null
  objectKey: string
  originalName: string
  mimeType: string
  extension: string | null
  size: number
  width: number | null
  height: number | null
  durationSec: number | null
  checksum: string | null
  status: string
  url: string | null
  createdAt: string
  updatedAt: string
}

export type MediaUploadPlan = {
  provider: string
  bucket: string
  objectKey: string
  uploadMethod: 'PUT'
  uploadUrl: string
  publicUrl: string | null
  headers: Record<string, string>
  expiresInSeconds: number
}

export type AlbumItem = {
  id: string
  sortOrder: number
  mediaAsset: MediaAssetItem
}

export type AlbumEntry = {
  id: string
  name: string
  slug: string
  description: string | null
  coverAssetId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  items: AlbumItem[]
}

export type DownloadResourceItem = {
  id: string
  title: string
  description: string | null
  accessLevel: string
  downloadCount: number
  mediaAsset: MediaAssetItem
  createdAt: string
  updatedAt: string
}

export type ArticleAttachmentItem = {
  id: string
  articleId: string
  sortOrder: number
  mediaAsset: MediaAssetItem
  createdAt: string
  updatedAt: string
}

export type UserFollowCard = {
  id: string
  username: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
  signature: string | null
  website: string | null
  location: string | null
  followedAt: string
  isMutual: boolean
}
