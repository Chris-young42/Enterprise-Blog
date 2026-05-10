import { httpRequest } from './http'
import type {
  BlockedCommentUser,
  CommentCaptcha,
  CommentItem,
  CommentListResult,
  CommentPolicy,
  PublicCommentPolicy,
  PendingCommentListResult,
} from '@/types/api'

type ListCommentsQuery = {
  page?: number
  pageSize?: number
  sort?: 'latest' | 'hot'
  onlyAuthor?: 0 | 1
}

type CreateCommentInput = {
  content: string
  parentId?: string
  images?: string[]
  isAnonymous?: boolean
  captchaToken?: string
  captchaAnswer?: string
}

type ReviewCommentInput = {
  status: 'APPROVED' | 'REJECTED'
  reason?: string
}

type UpdateCommentPolicyInput = Partial<CommentPolicy>

function toQueryString(query: ListCommentsQuery) {
  const searchParams = new URLSearchParams()
  if (query.page !== undefined) searchParams.set('page', `${query.page}`)
  if (query.pageSize !== undefined) searchParams.set('pageSize', `${query.pageSize}`)
  if (query.sort) searchParams.set('sort', query.sort)
  if (query.onlyAuthor !== undefined) searchParams.set('onlyAuthor', `${query.onlyAuthor}`)
  const output = searchParams.toString()
  return output.length > 0 ? `?${output}` : ''
}

export function fetchArticleComments(articleId: string, query: ListCommentsQuery = {}) {
  return httpRequest<CommentListResult>(`/articles/${articleId}/comments${toQueryString(query)}`)
}

export function fetchCommentPolicyPublic() {
  return httpRequest<PublicCommentPolicy>('/comments/policy')
}

export function fetchCommentCaptcha() {
  return httpRequest<CommentCaptcha>('/comments/captcha')
}

export function createArticleComment(articleId: string, payload: CreateCommentInput) {
  return httpRequest<CommentItem>(`/articles/${articleId}/comments`, {
    method: 'POST',
    body: payload,
  })
}

export function likeComment(commentId: string) {
  return httpRequest<CommentItem>(`/comments/${commentId}/like`, {
    method: 'POST',
  })
}

export function dislikeComment(commentId: string) {
  return httpRequest<CommentItem>(`/comments/${commentId}/dislike`, {
    method: 'POST',
  })
}

export function reportComment(commentId: string) {
  return httpRequest<CommentItem>(`/comments/${commentId}/report`, {
    method: 'POST',
  })
}

export function fetchPendingComments(page = 1, pageSize = 20) {
  return httpRequest<PendingCommentListResult>(
    `/admin/comments/pending?page=${page}&pageSize=${pageSize}`,
  )
}

export function reviewComment(commentId: string, payload: ReviewCommentInput) {
  return httpRequest<CommentItem>(`/admin/comments/${commentId}/review`, {
    method: 'PATCH',
    body: payload,
  })
}

export function fetchCommentPolicy() {
  return httpRequest<CommentPolicy>('/admin/comments/policy')
}

export function updateCommentPolicy(payload: UpdateCommentPolicyInput) {
  return httpRequest<CommentPolicy>('/admin/comments/policy', {
    method: 'PATCH',
    body: payload,
  })
}

export function fetchBlockedCommentUsers() {
  return httpRequest<BlockedCommentUser[]>('/admin/comments/blocked-users')
}

export function blockCommentUser(userId: string) {
  return httpRequest<CommentPolicy>(`/admin/comments/blocked-users/${userId}`, {
    method: 'POST',
  })
}

export function unblockCommentUser(userId: string) {
  return httpRequest<CommentPolicy>(`/admin/comments/blocked-users/${userId}/unblock`, {
    method: 'POST',
  })
}
