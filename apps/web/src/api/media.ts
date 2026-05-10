import { httpRequest } from './http'
import type {
  AlbumEntry,
  ArticleAttachmentItem,
  DownloadResourceItem,
  MediaAssetItem,
  MediaUploadPlan,
  MediaType,
} from '@/types/api'

type CreateAssetInput = {
  type: MediaType
  objectKey: string
  originalName: string
  mimeType: string
  size: number
  bucket?: string
  extension?: string
  width?: number
  height?: number
  durationSec?: number
}

type CreateUploadPlanInput = {
  type: MediaType
  originalName: string
  mimeType: string
  folder?: string
}

type UploadLocalAssetsInput = {
  files: File[]
  type?: MediaType
  folder?: string
}

type CreateAlbumInput = {
  name: string
  slug: string
  description?: string
  coverAssetId?: string
  sortOrder?: number
}

type AttachAlbumItemInput = {
  mediaAssetId: string
  sortOrder?: number
}

type CreateResourceInput = {
  title: string
  mediaAssetId: string
  description?: string
  accessLevel?: string
}

type AttachArticleAssetInput = {
  articleId: string
  mediaAssetId: string
  sortOrder?: number
}

export function fetchMediaAssets(type?: MediaType) {
  const query = type ? `?type=${type}` : ''
  return httpRequest<MediaAssetItem[]>(`/media/assets${query}`)
}

export function fetchPublicMediaAssets(type?: MediaType) {
  const query = type ? `?type=${type}` : ''
  return httpRequest<MediaAssetItem[]>(`/media/assets/public${query}`)
}

export function createMediaAsset(payload: CreateAssetInput) {
  return httpRequest<MediaAssetItem>('/media/assets', {
    method: 'POST',
    body: payload,
  })
}

export function createMediaUploadPlan(payload: CreateUploadPlanInput) {
  return httpRequest<MediaUploadPlan>('/media/assets/upload-plan', {
    method: 'POST',
    body: payload,
  })
}

export function uploadLocalAssets(payload: UploadLocalAssetsInput) {
  const searchParams = new URLSearchParams()
  if (payload.type) {
    searchParams.set('type', payload.type)
  }
  if (payload.folder && payload.folder.trim().length > 0) {
    searchParams.set('folder', payload.folder.trim())
  }
  const query = searchParams.toString()
  const formData = new FormData()
  payload.files.forEach((file) => formData.append('files', file))

  return httpRequest<MediaAssetItem[]>(`/media/assets/upload-local${query ? `?${query}` : ''}`, {
    method: 'POST',
    formData,
  })
}

type SignedUploadAndCreateAssetsInput = {
  files: File[]
  type: MediaType
  folder?: string
}

export async function signedUploadAndCreateAssets(payload: SignedUploadAndCreateAssetsInput) {
  const results: MediaAssetItem[] = []

  for (const file of payload.files) {
    const plan = await createMediaUploadPlan({
      type: payload.type,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      ...(payload.folder && payload.folder.trim().length > 0 ? { folder: payload.folder.trim() } : {}),
    })

    const uploadResponse = await fetch(plan.uploadUrl, {
      method: plan.uploadMethod,
      headers: plan.headers,
      body: file,
    })
    if (!uploadResponse.ok) {
      throw new Error(`上传失败: ${file.name}`)
    }

    const extension = extractExtension(file.name)
    const created = await createMediaAsset({
      type: payload.type,
      bucket: plan.bucket,
      objectKey: plan.objectKey,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      ...(extension ? { extension } : {}),
    })
    results.push(created)
  }

  return results
}

export function removeMediaAsset(id: string) {
  return httpRequest<{ id: string }>(`/media/assets/${id}`, {
    method: 'DELETE',
  })
}

export function fetchAlbums() {
  return httpRequest<AlbumEntry[]>('/media/albums')
}

export function createAlbum(payload: CreateAlbumInput) {
  return httpRequest<AlbumEntry>('/media/albums', {
    method: 'POST',
    body: payload,
  })
}

export function attachAlbumItem(albumId: string, payload: AttachAlbumItemInput) {
  return httpRequest<{ id: string }>(`/media/albums/${albumId}/items`, {
    method: 'POST',
    body: payload,
  })
}

export function detachAlbumItem(id: string) {
  return httpRequest<{ id: string }>(`/media/albums/items/${id}`, {
    method: 'DELETE',
  })
}

export function fetchDownloadResources() {
  return httpRequest<DownloadResourceItem[]>('/media/resources')
}

export function createDownloadResource(payload: CreateResourceInput) {
  return httpRequest<DownloadResourceItem>('/media/resources', {
    method: 'POST',
    body: payload,
  })
}

export function triggerResourceDownload(resourceId: string) {
  return httpRequest<DownloadResourceItem>(`/media/resources/${resourceId}/download`, {
    method: 'POST',
  })
}

export function removeDownloadResource(resourceId: string) {
  return httpRequest<{ id: string }>(`/media/resources/${resourceId}`, {
    method: 'DELETE',
  })
}

export function attachArticleAsset(payload: AttachArticleAssetInput) {
  return httpRequest<{ id: string }>('/media/articles/attachments', {
    method: 'POST',
    body: payload,
  })
}

export function detachArticleAsset(id: string) {
  return httpRequest<{ id: string }>(`/media/articles/attachments/${id}`, {
    method: 'DELETE',
  })
}

export function fetchArticleAttachments(articleId: string) {
  return httpRequest<ArticleAttachmentItem[]>(`/media/articles/${articleId}/attachments`)
}

function extractExtension(name: string) {
  const idx = name.lastIndexOf('.')
  if (idx <= 0 || idx >= name.length - 1) return undefined
  const ext = name.slice(idx + 1).toLowerCase()
  if (!/^[a-z0-9]{1,16}$/.test(ext)) return undefined
  return ext
}
