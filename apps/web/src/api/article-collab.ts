import { httpRequest } from './http'
import type { ContentVisibility } from '@/types/api'

export type ArticleAssignmentItem = {
  id: string
  articleId: string
  assigneeId: string
  assignerId: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  note: string | null
  dueAt: string | null
  createdAt: string
  updatedAt: string
  article: {
    id: string
    title: string
    slug: string
    status: string
  }
  assignee: {
    id: string
    username: string
    nickname: string | null
  }
  assigner: {
    id: string
    username: string
    nickname: string | null
  } | null
}

export type ArticleAssignmentsResult = {
  items: ArticleAssignmentItem[]
}

export function batchSetArticleStatus(ids: string[], status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED') {
  return httpRequest<{ affected: number }>('/articles/batch/status', {
    method: 'POST',
    body: { ids, status },
  })
}

export function batchMoveSeries(ids: string[], seriesId?: string) {
  const payload: { ids: string[]; seriesId?: string } = { ids }
  if (seriesId) payload.seriesId = seriesId
  return httpRequest<{ affected: number }>('/articles/batch/move-series', {
    method: 'POST',
    body: payload,
  })
}

export function batchSetVisibility(ids: string[], visibility: ContentVisibility) {
  return httpRequest<{ affected: number }>('/articles/batch/visibility', {
    method: 'POST',
    body: { ids, visibility },
  })
}

export function assignArticle(
  id: string,
  payload: {
    assigneeId: string
    status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
    note?: string
    dueAt?: string
  },
) {
  return httpRequest<ArticleAssignmentItem>(`/articles/${id}/assign`, {
    method: 'POST',
    body: payload,
  })
}

export function fetchArticleAssignments(params?: {
  assigneeId?: string
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
}) {
  const query = new URLSearchParams()
  if (params?.assigneeId) query.set('assigneeId', params.assigneeId)
  if (params?.status) query.set('status', params.status)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpRequest<ArticleAssignmentsResult>(`/articles/assignments/list${suffix}`)
}
