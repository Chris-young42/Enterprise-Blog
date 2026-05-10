import {
  attachAlbumItem,
  attachArticleAsset,
  createAlbum,
  createDownloadResource,
  createMediaAsset,
  createMediaUploadPlan,
  detachAlbumItem,
  detachArticleAsset,
  fetchAlbums,
  fetchArticleAttachments,
  fetchDownloadResources,
  fetchMediaAssets,
  removeDownloadResource,
  removeMediaAsset,
  signedUploadAndCreateAssets,
  triggerResourceDownload,
  uploadLocalAssets,
} from '@/api/media'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { MediaType } from '@/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function MediaCenterPage() {
  const queryClient = useQueryClient()
  const [typeFilter, setTypeFilter] = useState<MediaType | ''>('')

  const [assetType, setAssetType] = useState<MediaType>('IMAGE')
  const [assetObjectKey, setAssetObjectKey] = useState('')
  const [assetOriginalName, setAssetOriginalName] = useState('')
  const [assetMimeType, setAssetMimeType] = useState('image/png')
  const [assetSize, setAssetSize] = useState('0')
  const [uploadPlanName, setUploadPlanName] = useState('demo.png')
  const [uploadPlanMime, setUploadPlanMime] = useState('image/png')
  const [uploadPlanFolder, setUploadPlanFolder] = useState('images')
  const [localFiles, setLocalFiles] = useState<File[]>([])

  const [albumName, setAlbumName] = useState('')
  const [albumDescription, setAlbumDescription] = useState('')
  const [albumAttachAlbumId, setAlbumAttachAlbumId] = useState('')
  const [albumAttachAssetId, setAlbumAttachAssetId] = useState('')

  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceAssetId, setResourceAssetId] = useState('')
  const [resourceDescription, setResourceDescription] = useState('')

  const [attachmentArticleId, setAttachmentArticleId] = useState('')
  const [attachmentAssetId, setAttachmentAssetId] = useState('')

  const assetsQuery = useQuery({
    queryKey: ['admin', 'media', 'assets', typeFilter],
    queryFn: () => fetchMediaAssets(typeFilter || undefined),
  })

  const albumsQuery = useQuery({
    queryKey: ['admin', 'media', 'albums'],
    queryFn: fetchAlbums,
  })

  const resourcesQuery = useQuery({
    queryKey: ['admin', 'media', 'resources'],
    queryFn: fetchDownloadResources,
  })

  const attachmentsQuery = useQuery({
    queryKey: ['admin', 'media', 'attachments', attachmentArticleId],
    queryFn: () => fetchArticleAttachments(attachmentArticleId),
    enabled: attachmentArticleId.trim().length > 0,
  })

  const uploadPlanMutation = useMutation({
    mutationFn: createMediaUploadPlan,
  })

  const createAssetMutation = useMutation({
    mutationFn: createMediaAsset,
    onSuccess: () => {
      setAssetObjectKey('')
      setAssetOriginalName('')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'assets'] })
    },
  })

  const uploadLocalMutation = useMutation({
    mutationFn: uploadLocalAssets,
    onSuccess: () => {
      setLocalFiles([])
      void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'assets'] })
    },
  })

  const signedUploadMutation = useMutation({
    mutationFn: signedUploadAndCreateAssets,
    onSuccess: () => {
      setLocalFiles([])
      void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'assets'] })
    },
  })

  const removeAssetMutation = useMutation({
    mutationFn: removeMediaAsset,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'assets'] }),
  })

  const createAlbumMutation = useMutation({
    mutationFn: createAlbum,
    onSuccess: () => {
      setAlbumName('')
      setAlbumDescription('')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'albums'] })
    },
  })

  const attachAlbumMutation = useMutation({
    mutationFn: ({ albumId, mediaAssetId }: { albumId: string; mediaAssetId: string }) =>
      attachAlbumItem(albumId, { mediaAssetId }),
    onSuccess: () => {
      setAlbumAttachAssetId('')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'albums'] })
    },
  })

  const detachAlbumMutation = useMutation({
    mutationFn: detachAlbumItem,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'albums'] }),
  })

  const createResourceMutation = useMutation({
    mutationFn: createDownloadResource,
    onSuccess: () => {
      setResourceTitle('')
      setResourceAssetId('')
      setResourceDescription('')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'resources'] })
    },
  })

  const downloadMutation = useMutation({
    mutationFn: triggerResourceDownload,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'resources'] }),
  })

  const removeResourceMutation = useMutation({
    mutationFn: removeDownloadResource,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'resources'] }),
  })

  const attachArticleMutation = useMutation({
    mutationFn: attachArticleAsset,
    onSuccess: () => {
      setAttachmentAssetId('')
      if (attachmentArticleId.trim()) {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'attachments', attachmentArticleId] })
      }
    },
  })

  const detachArticleMutation = useMutation({
    mutationFn: detachArticleAsset,
    onSuccess: () => {
      if (attachmentArticleId.trim()) {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'media', 'attachments', attachmentArticleId] })
      }
    },
  })

  const albumSlug = useMemo(() => toSlug(albumName), [albumName])
  const normalizedAlbumDescription = albumDescription.trim()
  const normalizedResourceDescription = resourceDescription.trim()

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">媒体资源中心</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">第7阶段：媒体 & 附件系统</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          覆盖媒体资产、相册图集、下载资源、文章附件挂载四条主流程。
        </p>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>媒体资产入库</CardTitle>
          <CardDescription>支持元数据录入与本地文件直传（multipart）。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <select
            value={assetType}
            onChange={(event) => setAssetType(event.target.value as MediaType)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="IMAGE">IMAGE</option>
            <option value="AUDIO">AUDIO</option>
            <option value="VIDEO">VIDEO</option>
            <option value="FILE">FILE</option>
          </select>
          <Input placeholder="objectKey" value={assetObjectKey} onChange={(event) => setAssetObjectKey(event.target.value)} />
          <Input
            placeholder="原始文件名"
            value={assetOriginalName}
            onChange={(event) => setAssetOriginalName(event.target.value)}
          />
          <Input placeholder="mimeType" value={assetMimeType} onChange={(event) => setAssetMimeType(event.target.value)} />
          <Input placeholder="size(bytes)" value={assetSize} onChange={(event) => setAssetSize(event.target.value)} />
          <Button
            onClick={() =>
              void createAssetMutation.mutateAsync({
                type: assetType,
                objectKey: assetObjectKey.trim(),
                originalName: assetOriginalName.trim(),
                mimeType: assetMimeType.trim(),
                size: Number(assetSize),
              })
            }
          >
            新增资产
          </Button>
          <Input
            type="file"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              setLocalFiles(files)
            }}
          />
          <Button
            variant="outline"
            disabled={localFiles.length === 0}
            onClick={() =>
              void uploadLocalMutation.mutateAsync({
                files: localFiles,
                type: assetType,
                folder: uploadPlanFolder.trim(),
              })
            }
          >
            本地直传（{localFiles.length}）
          </Button>
          <Button
            variant="outline"
            disabled={localFiles.length === 0}
            onClick={() =>
              void signedUploadMutation.mutateAsync({
                files: localFiles,
                type: assetType,
                folder: uploadPlanFolder.trim(),
              })
            }
          >
            签名直传并入库（{localFiles.length}）
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>云存储上传策略</CardTitle>
          <CardDescription>生成上传 objectKey 与预签名策略（当前默认 LOCAL 适配器）。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <Input placeholder="原始文件名" value={uploadPlanName} onChange={(event) => setUploadPlanName(event.target.value)} />
          <Input placeholder="mimeType" value={uploadPlanMime} onChange={(event) => setUploadPlanMime(event.target.value)} />
          <Input placeholder="folder" value={uploadPlanFolder} onChange={(event) => setUploadPlanFolder(event.target.value)} />
          <Button
            variant="outline"
            onClick={() =>
              void uploadPlanMutation.mutateAsync({
                type: assetType,
                originalName: uploadPlanName.trim(),
                mimeType: uploadPlanMime.trim(),
                folder: uploadPlanFolder.trim(),
              })
            }
          >
            生成上传策略
          </Button>
          {uploadPlanMutation.data ? (
            <div className="col-span-full rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
              <p className="font-medium">objectKey: {uploadPlanMutation.data.objectKey}</p>
              <p className="text-slate-500">provider: {uploadPlanMutation.data.provider}</p>
              <p className="text-slate-500">bucket: {uploadPlanMutation.data.bucket}</p>
              <p className="text-slate-500">publicUrl: {uploadPlanMutation.data.publicUrl ?? '-'}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>资产列表</CardTitle>
          <CardDescription>支持类型筛选与删除。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as MediaType | '')}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">全部</option>
              <option value="IMAGE">IMAGE</option>
              <option value="AUDIO">AUDIO</option>
              <option value="VIDEO">VIDEO</option>
              <option value="FILE">FILE</option>
            </select>
          </div>
          {(assetsQuery.data ?? []).map((asset) => (
            <div key={asset.id} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
              <p className="font-medium">{asset.originalName}</p>
              <p className="text-slate-500">{asset.id}</p>
              <p className="text-slate-500">{asset.type} | {asset.mimeType} | {asset.size} bytes</p>
              <p className="text-slate-500">{asset.url ?? asset.objectKey}</p>
              <Button size="sm" variant="outline" onClick={() => void removeAssetMutation.mutateAsync(asset.id)}>
                删除资产
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>相册图集</CardTitle>
            <CardDescription>创建相册并挂载/解绑资产。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="相册名称" value={albumName} onChange={(event) => setAlbumName(event.target.value)} />
            <Input placeholder="slug（自动）" value={albumSlug} readOnly />
            <Input
              placeholder="相册描述"
              value={albumDescription}
              onChange={(event) => setAlbumDescription(event.target.value)}
            />
            <Button
              onClick={() => {
                const payload = {
                  name: albumName.trim(),
                  slug: albumSlug,
                  ...(normalizedAlbumDescription ? { description: normalizedAlbumDescription } : {}),
                }
                void createAlbumMutation.mutateAsync(payload)
              }}
            >
              创建相册
            </Button>
            <Input
              placeholder="挂载目标相册ID"
              value={albumAttachAlbumId}
              onChange={(event) => setAlbumAttachAlbumId(event.target.value)}
            />
            <Input
              placeholder="挂载资产ID"
              value={albumAttachAssetId}
              onChange={(event) => setAlbumAttachAssetId(event.target.value)}
            />
            <Button
              variant="outline"
              onClick={() =>
                void attachAlbumMutation.mutateAsync({
                  albumId: albumAttachAlbumId.trim(),
                  mediaAssetId: albumAttachAssetId.trim(),
                })
              }
            >
              挂载到相册
            </Button>
            <div className="space-y-2">
              {(albumsQuery.data ?? []).map((album) => (
                <div key={album.id} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
                  <p className="font-medium">{album.name} ({album.items.length})</p>
                  <p className="text-slate-500">{album.id}</p>
                  <div className="mt-2 space-y-1">
                    {album.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded border border-slate-100 px-2 py-1 dark:border-slate-800">
                        <span>{item.mediaAsset.originalName}</span>
                        <Button size="sm" variant="ghost" onClick={() => void detachAlbumMutation.mutateAsync(item.id)}>
                          解绑
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>下载中心</CardTitle>
            <CardDescription>资源创建、下载计数与删除。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="资源标题" value={resourceTitle} onChange={(event) => setResourceTitle(event.target.value)} />
            <Input placeholder="资源资产ID" value={resourceAssetId} onChange={(event) => setResourceAssetId(event.target.value)} />
            <Input
              placeholder="资源描述"
              value={resourceDescription}
              onChange={(event) => setResourceDescription(event.target.value)}
            />
            <Button
              onClick={() => {
                const payload = {
                  title: resourceTitle.trim(),
                  mediaAssetId: resourceAssetId.trim(),
                  ...(normalizedResourceDescription ? { description: normalizedResourceDescription } : {}),
                }
                void createResourceMutation.mutateAsync(payload)
              }}
            >
              创建下载资源
            </Button>
            <div className="space-y-2">
              {(resourcesQuery.data ?? []).map((resource) => (
                <div key={resource.id} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
                  <p className="font-medium">{resource.title}</p>
                  <p className="text-slate-500">下载次数：{resource.downloadCount}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void downloadMutation.mutateAsync(resource.id)}>
                      模拟下载
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void removeResourceMutation.mutateAsync(resource.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>文章附件管理</CardTitle>
          <CardDescription>给文章挂载附件，并可查询/解绑文章附件。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="文章ID"
            value={attachmentArticleId}
            onChange={(event) => setAttachmentArticleId(event.target.value)}
          />
          <Input
            placeholder="附件资产ID"
            value={attachmentAssetId}
            onChange={(event) => setAttachmentAssetId(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              onClick={() =>
                void attachArticleMutation.mutateAsync({
                  articleId: attachmentArticleId.trim(),
                  mediaAssetId: attachmentAssetId.trim(),
                })
              }
            >
              挂载附件
            </Button>
            <Button variant="outline" onClick={() => void attachmentsQuery.refetch()} disabled={!attachmentArticleId.trim()}>
              查询附件
            </Button>
          </div>
          <div className="space-y-2">
            {(attachmentsQuery.data ?? []).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
                <p className="font-medium">{item.mediaAsset.originalName}</p>
                <p className="text-slate-500">{item.mediaAsset.id}</p>
                <Button size="sm" variant="ghost" onClick={() => void detachArticleMutation.mutateAsync(item.id)}>
                  解绑附件
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
