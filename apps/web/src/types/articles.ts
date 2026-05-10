import type { ArticleOrigin, ArticleStatus, ContentVisibility } from './api'

export type CreateArticleInput = {
  title: string
  slug: string
  contentMarkdown: string
  summary?: string
  contentHtml?: string
  seoTitle?: string
  seoDescription?: string
  status?: ArticleStatus
  origin?: ArticleOrigin
  visibility?: ContentVisibility
  accessPassword?: string
  categoryId?: string
  seriesId?: string
  tagIds?: string[]
  isPinned?: boolean
  isRecommended?: boolean
  publishAt?: string
  scheduledAt?: string
}

export type ListArticlesQuery = {
  page?: number
  pageSize?: number
  keyword?: string
  tagId?: string
  categoryId?: string
  status?: ArticleStatus
  year?: string
  month?: string
}

export type ArticlePasswordAccessInput = {
  password: string
}
