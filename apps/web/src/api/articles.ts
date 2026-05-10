import { httpRequest } from './http'
import type { ArticleArchiveResult, ArticleItem, ArticleListResult } from '@/types/api'
import type { ArticlePasswordAccessInput, CreateArticleInput, ListArticlesQuery } from '@/types/articles'

function toQueryString(query: ListArticlesQuery) {
  const searchParams = new URLSearchParams()
  if (query.page !== undefined) searchParams.set('page', `${query.page}`)
  if (query.pageSize !== undefined) searchParams.set('pageSize', `${query.pageSize}`)
  if (query.keyword) searchParams.set('keyword', query.keyword)
  if (query.tagId) searchParams.set('tagId', query.tagId)
  if (query.categoryId) searchParams.set('categoryId', query.categoryId)
  if (query.status) searchParams.set('status', query.status)
  if (query.year) searchParams.set('year', query.year)
  if (query.month) searchParams.set('month', query.month)
  const output = searchParams.toString()
  return output.length > 0 ? `?${output}` : ''
}

export function fetchArticles(query: ListArticlesQuery = {}) {
  return httpRequest<ArticleListResult>(`/articles${toQueryString(query)}`)
}

export function fetchArticleArchive() {
  return httpRequest<ArticleArchiveResult>('/articles/archive')
}

export function fetchHotArticles(limit = 10) {
  return httpRequest<ArticleItem[]>(`/articles/hot?limit=${limit}`)
}

export function fetchArticleBySlug(slug: string) {
  return httpRequest<ArticleItem>(`/articles/${slug}`)
}

export function fetchArticleBySlugWithPassword(slug: string, payload: ArticlePasswordAccessInput) {
  return httpRequest<ArticleItem>(`/articles/${slug}/access`, {
    method: 'POST',
    body: payload,
  })
}

export function createArticle(payload: CreateArticleInput) {
  return httpRequest<ArticleItem>('/articles', {
    method: 'POST',
    body: payload,
  })
}

export function updateArticle(id: string, payload: CreateArticleInput) {
  return httpRequest<ArticleItem>(`/articles/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function publishArticle(id: string) {
  return httpRequest<ArticleItem>(`/articles/${id}/publish`, {
    method: 'POST',
  })
}

export function saveDraftArticle(id: string, payload: CreateArticleInput) {
  return httpRequest<ArticleItem>(`/articles/${id}/draft`, {
    method: 'POST',
    body: payload,
  })
}

export function scheduleArticle(id: string, scheduledAt: string) {
  return httpRequest<ArticleItem>(`/articles/${id}/schedule`, {
    method: 'POST',
    body: { scheduledAt },
  })
}

export function batchDeleteArticles(ids: string[]) {
  return httpRequest<{ affected: number }>('/articles/batch/delete', {
    method: 'POST',
    body: { ids },
  })
}

export function batchSetPinned(ids: string[], value: boolean) {
  return httpRequest<{ affected: number }>('/articles/batch/pinned', {
    method: 'POST',
    body: { ids, value },
  })
}

export function batchSetRecommended(ids: string[], value: boolean) {
  return httpRequest<{ affected: number }>('/articles/batch/recommended', {
    method: 'POST',
    body: { ids, value },
  })
}

export function batchMoveCategory(ids: string[], categoryId?: string) {
  const payload: { ids: string[]; categoryId?: string } = { ids }
  if (categoryId) payload.categoryId = categoryId
  return httpRequest<{ affected: number }>('/articles/batch/move-category', {
    method: 'POST',
    body: payload,
  })
}

export function batchMoveSeriesArticles(ids: string[], seriesId?: string) {
  const payload: { ids: string[]; seriesId?: string } = { ids }
  if (seriesId) payload.seriesId = seriesId
  return httpRequest<{ affected: number }>('/articles/batch/move-series', {
    method: 'POST',
    body: payload,
  })
}
