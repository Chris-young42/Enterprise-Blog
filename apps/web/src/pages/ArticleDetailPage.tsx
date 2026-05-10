import { HttpError } from '@/api/http'
import { fetchArticleBySlug, fetchArticleBySlugWithPassword } from '@/api/articles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchArticleAttachments } from '@/api/media'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarClock, Hash, LockKeyhole, UserCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArticleCommentsSection } from '@/components/ArticleCommentsSection'

function formatDate(value: string | null) {
  if (!value) return '未发布'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN')
}

function articleText(article: { contentHtml: string | null; contentMarkdown: string }) {
  if (article.contentHtml && article.contentHtml.trim()) {
    return article.contentHtml
  }
  return article.contentMarkdown
}

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [accessPassword, setAccessPassword] = useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey: ['site', 'article', slug, accessPassword],
    queryFn: () => {
      if (!slug) {
        throw new Error('文章地址无效')
      }
      if (accessPassword) {
        return fetchArticleBySlugWithPassword(slug, { password: accessPassword })
      }
      return fetchArticleBySlug(slug)
    },
    enabled: Boolean(slug),
    retry: false,
  })

  const attachmentsQuery = useQuery({
    queryKey: ['site', 'article', 'attachments', detailQuery.data?.id],
    queryFn: () => fetchArticleAttachments(detailQuery.data?.id ?? ''),
    enabled: Boolean(detailQuery.data?.id),
  })

  const submitPassword = () => {
    const value = password.trim()
    if (!value) {
      setPasswordError('请输入访问密码')
      return
    }
    setPasswordError(null)
    setAccessPassword(value)
  }

  if (!slug) {
    return <p className="text-sm text-slate-500">文章地址无效。</p>
  }

  if (detailQuery.isError && detailQuery.error instanceof HttpError && detailQuery.error.status === 403) {
    return (
      <div className="mx-auto w-full max-w-xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5" />
              密码访问文章
            </CardTitle>
            <CardDescription>该文章设置为密码可见，请输入访问密码。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder="输入文章访问密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p className="text-sm text-rose-600 dark:text-rose-300">{detailQuery.error.message}</p>
            {passwordError ? <p className="text-sm text-rose-600 dark:text-rose-300">{passwordError}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={submitPassword}>验证并访问</Button>
              <Button variant="outline" asChild>
                <Link to="/">返回首页</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (detailQuery.isLoading) {
    return <p className="text-sm text-slate-500">文章加载中...</p>
  }

  if (detailQuery.isError) {
    const message = detailQuery.error instanceof Error ? detailQuery.error.message : '加载失败'
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
        {message}
      </div>
    )
  }

  const article = detailQuery.data
  if (!article) {
    return <p className="text-sm text-slate-500">文章不存在。</p>
  }

  return (
    <article className="mx-auto w-full max-w-4xl space-y-5 sm:space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
        className="site-glass overflow-hidden rounded-3xl p-5 sm:p-7"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{article.origin}</Badge>
            <Badge>{article.visibility}</Badge>
            <Badge>{article.status}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{article.title}</h1>
          <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2 md:grid-cols-4 dark:text-slate-300">
            <p className="flex items-center gap-1.5">
              <UserCircle2 className="h-3.5 w-3.5" />
              <Link to={`/users/${article.author.id}`} className="hover:underline">
                {article.author.nickname ?? article.author.username}
              </Link>
            </p>
            <p className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDate(article.publishAt)}
            </p>
            <p className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              字数 {article.wordCount}
            </p>
            <p>阅读约 {article.readingMinutes} 分钟</p>
          </div>
        </div>
      </motion.header>

      {article.summary ? (
        <Card>
          <CardContent className="p-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{article.summary}</CardContent>
        </Card>
      ) : null}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="site-glass overflow-x-hidden rounded-3xl p-5 text-sm leading-8 whitespace-pre-wrap sm:p-7"
      >
        {articleText(article)}
      </motion.section>

      {(attachmentsQuery.data?.length ?? 0) > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>附件下载</CardTitle>
            <CardDescription>当前文章关联资源附件。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(attachmentsQuery.data ?? []).map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                <span className="min-w-0 break-all">{item.mediaAsset.originalName}</span>
                {item.mediaAsset.url ? (
                  <a
                    href={item.mediaAsset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:border-sky-300 dark:border-slate-700"
                  >
                    下载
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">未配置公网地址</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <footer className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {(article.tags ?? []).map((tag) => (
          <Link
            key={tag.id}
            to={`/tags?tag=${tag.id}`}
            className="rounded-full border border-slate-300 px-2.5 py-1 transition hover:border-sky-300 dark:border-slate-700"
          >
            #{tag.name}
          </Link>
        ))}
      </footer>

      <ArticleCommentsSection articleId={article.id} authorId={article.author.id} />
    </article>
  )
}
