import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { CreateArticleInput } from '@/types/articles'
import type { ArticleItem, ArticleStatus, ContentVisibility } from '@/types/api'

type ArticleEditorCardProps = {
  onCreated: (article: ArticleItem) => void
  onCreate: (payload: CreateArticleInput) => Promise<ArticleItem>
}

const statuses: ArticleStatus[] = ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']
const visibilities: ContentVisibility[] = ['PUBLIC', 'FOLLOWER', 'LOGGED_IN', 'PRIVATE', 'PASSWORD']

export function ArticleEditorCard({ onCreate, onCreated }: ArticleEditorCardProps) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [summary, setSummary] = useState('')
  const [contentMarkdown, setContentMarkdown] = useState('# 新文章\n\n在这里开始写作...')
  const [status, setStatus] = useState<ArticleStatus>('DRAFT')
  const [visibility, setVisibility] = useState<ContentVisibility>('PUBLIC')
  const [scheduledAt, setScheduledAt] = useState('')
  const [accessPassword, setAccessPassword] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [isRecommended, setIsRecommended] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim() || !contentMarkdown.trim()) {
      setErrorMessage('标题、slug、内容不能为空')
      return
    }
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const payload: CreateArticleInput = {
        title: title.trim(),
        slug: slug.trim(),
        contentMarkdown,
        status,
        visibility,
        isPinned,
        isRecommended,
      }
      if (summary.trim()) {
        payload.summary = summary.trim()
      }
      if (scheduledAt) {
        payload.scheduledAt = scheduledAt
      }
      if (visibility === 'PASSWORD' && accessPassword) {
        payload.accessPassword = accessPassword
      }

      const article = await onCreate(payload)
      onCreated(article)
      setTitle('')
      setSlug('')
      setSummary('')
      setContentMarkdown('# 新文章\n\n在这里开始写作...')
      setStatus('DRAFT')
      setVisibility('PUBLIC')
      setScheduledAt('')
      setAccessPassword('')
      setIsPinned(false)
      setIsRecommended(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
      <CardHeader>
        <CardTitle>新建文章</CardTitle>
        <CardDescription>支持草稿、定时发布、可见性、置顶推荐。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="标题" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input placeholder="slug，例如 nestjs-rbac-guide" value={slug} onChange={(event) => setSlug(event.target.value)} />
        </div>
        <Input placeholder="摘要（可选）" value={summary} onChange={(event) => setSummary(event.target.value)} />
        <textarea
          value={contentMarkdown}
          onChange={(event) => setContentMarkdown(event.target.value)}
          className="h-44 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950"
        />
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">状态</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ArticleStatus)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950"
            >
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">可见性</span>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as ContentVisibility)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950"
            >
              {visibilities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">定时发布时间（可选）</span>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </label>
        </div>
        {visibility === 'PASSWORD' ? (
          <Input
            type="password"
            placeholder="访问密码"
            value={accessPassword}
            onChange={(event) => setAccessPassword(event.target.value)}
          />
        ) : null}
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} />
            置顶
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={isRecommended} onChange={(event) => setIsRecommended(event.target.checked)} />
            推荐
          </label>
        </div>
        {errorMessage ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
            {errorMessage}
          </p>
        ) : null}
        <Button onClick={handleCreate} disabled={submitting}>
          {submitting ? '创建中...' : '创建文章'}
        </Button>
      </CardContent>
    </Card>
  )
}
