import {
  createArticleComment,
  dislikeComment,
  fetchArticleComments,
  fetchCommentCaptcha,
  fetchCommentPolicyPublic,
  likeComment,
  reportComment,
} from '@/api/comments'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { CommentItem } from '@/types/api'
import { useAuthStore } from '@/store/auth-store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN')
}

type ArticleCommentsSectionProps = {
  articleId: string
  authorId: string
}

function CommentActions({
  comment,
  onReply,
  onRefresh,
}: {
  comment: CommentItem
  onReply: (comment: CommentItem) => void
  onRefresh: () => void
}) {
  const queryClient = useQueryClient()

  const likeMutation = useMutation({
    mutationFn: () => likeComment(comment.id),
    onSuccess: () => {
      onRefresh()
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments', 'pending'] })
    },
  })

  const dislikeMutation = useMutation({
    mutationFn: () => dislikeComment(comment.id),
    onSuccess: onRefresh,
  })

  const reportMutation = useMutation({
    mutationFn: () => reportComment(comment.id),
    onSuccess: onRefresh,
  })

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <Button size="sm" variant="outline" onClick={() => onReply(comment)}>
        回复
      </Button>
      <Button size="sm" variant="outline" onClick={() => void likeMutation.mutateAsync()}>
        点赞 {comment.likes}
      </Button>
      <Button size="sm" variant="outline" onClick={() => void dislikeMutation.mutateAsync()}>
        点踩 {comment.dislikes}
      </Button>
      <Button size="sm" variant="outline" onClick={() => void reportMutation.mutateAsync()}>
        举报 {comment.reports}
      </Button>
    </div>
  )
}

export function ArticleCommentsSection({ articleId, authorId }: ArticleCommentsSectionProps) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'latest' | 'hot'>('latest')
  const [onlyAuthor, setOnlyAuthor] = useState<0 | 1>(0)
  const [foldReplies, setFoldReplies] = useState(false)
  const [content, setContent] = useState('')
  const [imageInput, setImageInput] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)

  const publicPolicyQuery = useQuery({
    queryKey: ['site', 'comments', 'policy', 'public'],
    queryFn: fetchCommentPolicyPublic,
  })

  const captchaNeeded = !user || publicPolicyQuery.data?.captchaRequired === true
  const captchaQuery = useQuery({
    queryKey: ['site', 'comments', 'captcha', articleId, captchaNeeded],
    queryFn: fetchCommentCaptcha,
    enabled: captchaNeeded,
  })

  const commentsQuery = useQuery({
    queryKey: ['site', 'comments', articleId, page, sort, onlyAuthor],
    queryFn: () =>
      fetchArticleComments(articleId, {
        page,
        pageSize: 10,
        sort,
        onlyAuthor,
      }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: {
      content: string
      parentId?: string
      isAnonymous?: boolean
      images?: string[]
      captchaToken?: string
      captchaAnswer?: string
    }) => createArticleComment(articleId, payload),
    onSuccess: () => {
      setContent('')
      setReplyTo(null)
      setErrorText(null)
      setImageInput('')
      setCaptchaAnswer('')
      void commentsQuery.refetch()
      void captchaQuery.refetch()
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comments', 'pending'] })
    },
    onError: (error) => {
      if (error instanceof Error) {
        setErrorText(error.message)
      } else {
        setErrorText('评论提交失败')
      }
    },
  })

  const submitComment = () => {
    const trimmed = content.trim()
    if (!trimmed) {
      setErrorText('请输入评论内容')
      return
    }
    const payload: {
      content: string
      parentId?: string
      isAnonymous?: boolean
      images?: string[]
      captchaToken?: string
      captchaAnswer?: string
    } = {
      content: trimmed,
      isAnonymous,
    }
    const images = imageInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    if (images.length > 0) {
      payload.images = images
    }
    if (replyTo) {
      payload.parentId = replyTo.id
    }
    if (captchaNeeded) {
      const token = captchaQuery.data?.token ?? ''
      const answer = captchaAnswer.trim()
      if (!token || !answer) {
        setErrorText('请完成验证码')
        return
      }
      payload.captchaToken = token
      payload.captchaAnswer = answer
    }
    void createMutation.mutateAsync(payload)
  }

  const total = commentsQuery.data?.total ?? 0
  const pageSize = commentsQuery.data?.pageSize ?? 10
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <section className="space-y-4">
      <Card className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>评论区</CardTitle>
          <CardDescription>支持楼中楼回复、点赞点踩举报、分页、图片与验证码。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {replyTo ? (
            <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300">
              正在回复：{replyTo.user?.nickname ?? replyTo.user?.username ?? '匿名用户'}（#{replyTo.floor}）
            </p>
          ) : null}
          <textarea
            className="min-h-[110px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-400 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
            placeholder="写下你的评论..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <Input
            placeholder="图片URL，多个用英文逗号分隔"
            value={imageInput}
            onChange={(event) => setImageInput(event.target.value)}
          />
          {captchaNeeded ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                {captchaQuery.data?.question ?? '验证码加载中...'}
              </p>
              <Input
                placeholder="请输入验证码答案"
                value={captchaAnswer}
                onChange={(event) => setCaptchaAnswer(event.target.value)}
              />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(event) => setIsAnonymous(event.target.checked)}
              />
              匿名评论
            </label>
            <span>当前文章作者ID: {authorId}</span>
            {publicPolicyQuery.data ? (
              <span>
                频控 {publicPolicyQuery.data.commentCooldownSeconds}s /{' '}
                {publicPolicyQuery.data.guestCommentEnabled ? '游客可评' : '仅登录'}
              </span>
            ) : null}
          </div>
          {errorText ? <p className="text-sm text-rose-600 dark:text-rose-300">{errorText}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={submitComment} disabled={createMutation.isPending}>
              {replyTo ? '提交回复' : '提交评论'}
            </Button>
            {replyTo ? (
              <Button variant="outline" onClick={() => setReplyTo(null)}>
                取消回复
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>评论列表</CardTitle>
          <CardDescription>
            共 {total} 条，页码 {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={sort === 'latest' ? 'default' : 'outline'}
              onClick={() => {
                setSort('latest')
                setPage(1)
              }}
            >
              最新
            </Button>
            <Button
              size="sm"
              variant={sort === 'hot' ? 'default' : 'outline'}
              onClick={() => {
                setSort('hot')
                setPage(1)
              }}
            >
              热门
            </Button>
            <Button
              size="sm"
              variant={onlyAuthor === 1 ? 'default' : 'outline'}
              onClick={() => {
                const next = onlyAuthor === 1 ? 0 : 1
                setOnlyAuthor(next)
                setPage(1)
              }}
            >
              只看楼主
            </Button>
            <Button
              size="sm"
              variant={foldReplies ? 'default' : 'outline'}
              onClick={() => setFoldReplies((value) => !value)}
            >
              {foldReplies ? '展开回复' : '折叠回复'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void commentsQuery.refetch()
              }}
            >
              刷新
            </Button>
          </div>

          {commentsQuery.isLoading ? <p className="text-sm text-slate-500">评论加载中...</p> : null}
          {commentsQuery.isError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
              {commentsQuery.error instanceof Error ? commentsQuery.error.message : '加载失败'}
            </p>
          ) : null}

          {(commentsQuery.data?.items ?? []).map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>#{item.floor}</span>
                <span>{item.user?.nickname ?? item.user?.username ?? '匿名用户'}</span>
                <span>{formatDateTime(item.createdAt)}</span>
                {item.isAuthor ? <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">楼主</span> : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{item.content}</p>
              {item.images.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.images.map((image) => (
                    <img
                      key={image}
                      src={image}
                      alt="评论图片"
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                  ))}
                </div>
              ) : null}
              <CommentActions
                comment={item}
                onReply={setReplyTo}
                onRefresh={() => {
                  void commentsQuery.refetch()
                }}
              />

              {!foldReplies && item.replies.length > 0 ? (
                <div className="mt-3 space-y-2 border-l border-slate-200 pl-3 dark:border-slate-700">
                  {item.replies.map((reply) => (
                    <div key={reply.id} className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{reply.user?.nickname ?? reply.user?.username ?? '匿名用户'}</span>
                        <span>{formatDateTime(reply.createdAt)}</span>
                        {reply.isAuthor ? (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">楼主</span>
                        ) : null}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{reply.content}</p>
                      <CommentActions
                        comment={reply}
                        onReply={setReplyTo}
                        onRefresh={() => {
                          void commentsQuery.refetch()
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              下一页
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
