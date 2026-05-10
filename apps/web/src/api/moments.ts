import { httpRequest } from './http'

type MomentItem = {
  id: string
  title: string
  slug: string
  content: string
  summary: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

type MomentTimelineGroup = {
  date: string
  items: MomentItem[]
}

export type { MomentItem, MomentTimelineGroup }

export function fetchMoments(published = true) {
  return httpRequest<MomentItem[]>(`/moments?published=${published ? 'true' : 'false'}`)
}

export function fetchMomentTimeline() {
  return httpRequest<MomentTimelineGroup[]>('/moments/timeline')
}

export function fetchMomentBySlug(slug: string) {
  return httpRequest<MomentItem>(`/moments/${slug}`)
}

export function createMoment(payload: {
  title?: string
  content: string
  summary?: string
  slug?: string
  isPublished?: boolean
}) {
  return httpRequest<MomentItem>('/moments', {
    method: 'POST',
    body: payload,
  })
}

export function updateMoment(
  id: string,
  payload: {
    title?: string
    content?: string
    summary?: string | null
    isPublished?: boolean
  },
) {
  return httpRequest<MomentItem>(`/moments/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteMoment(id: string) {
  return httpRequest<{ id: string }>(`/moments/${id}`, {
    method: 'DELETE',
  })
}
