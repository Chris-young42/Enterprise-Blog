import { HttpError } from '@/api/http'
import { applyFriendLink, fetchFriendLinks } from '@/api/site-pages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function FriendLinksPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [applyError, setApplyError] = useState<string | null>(null)

  const linksQuery = useQuery({
    queryKey: ['site', 'friend-links'],
    queryFn: fetchFriendLinks,
  })

  const applyMutation = useMutation({
    mutationFn: applyFriendLink,
    onSuccess: () => {
      setName('')
      setUrl('')
      setEmail('')
      setApplyError(null)
      void queryClient.invalidateQueries({ queryKey: ['site', 'friend-links'] })
    },
    onError: (error) => {
      if (error instanceof HttpError && error.status === 409) {
        setApplyError('该友链已存在或正在审核中，请勿重复提交。')
        return
      }
      if (error instanceof HttpError && error.status === 429) {
        setApplyError('提交过于频繁，请稍后再试。')
        return
      }
      setApplyError(error instanceof Error ? error.message : '提交失败')
    },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Badge className="mb-2">友情链接</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">友情链接申请与展示</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>申请友链</CardTitle>
          <CardDescription>提交后进入后台审核。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <Input placeholder="站点名称" value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="站点URL" value={url} onChange={(event) => setUrl(event.target.value)} />
          <Input placeholder="联系邮箱" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Button
            onClick={() =>
              void applyMutation.mutateAsync(
                {
                  name: name.trim(),
                  url: url.trim(),
                  ...(email.trim() ? { email: email.trim() } : {}),
                },
              )
            }
          >
            提交申请
          </Button>
          {applyError ? <p className="text-sm text-rose-600 dark:text-rose-400">{applyError}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {(linksQuery.data ?? []).map((item) => (
          <Card key={item.id} className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle className="text-base">{item.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <a href={item.url} target="_blank" rel="noreferrer" className="text-sky-600 dark:text-sky-400">
                {item.url}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
