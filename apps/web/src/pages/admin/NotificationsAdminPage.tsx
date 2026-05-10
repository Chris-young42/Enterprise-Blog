import { useState } from 'react'
import { fetchAdminEmailLogs, fetchAdminNotifications } from '@/api/ops'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'

export function NotificationsAdminPage() {
  const [page, setPage] = useState(1)
  const [channel, setChannel] = useState<'ALL' | 'IN_APP' | 'EMAIL'>('ALL')
  const [emailStatus, setEmailStatus] = useState<'ALL' | 'PENDING' | 'SENT' | 'FAILED'>('ALL')

  const query = useQuery({
    queryKey: ['admin', 'notifications', page, channel],
    queryFn: () =>
      fetchAdminNotifications({
        page,
        pageSize: 20,
        ...(channel === 'ALL' ? {} : { channel }),
      }),
  })

  const emailLogQuery = useQuery({
    queryKey: ['admin', 'notifications', 'email-logs', page, emailStatus],
    queryFn: () =>
      fetchAdminEmailLogs({
        page,
        pageSize: 20,
        ...(emailStatus === 'ALL' ? {} : { status: emailStatus }),
      }),
  })

  const total = query.data?.total ?? 0
  const pageSize = query.data?.pageSize ?? 20
  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第11阶段</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">消息推送中心</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>消息流水</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              value={channel}
              onChange={(event) => setChannel(event.target.value as 'ALL' | 'IN_APP' | 'EMAIL')}
            >
              <option value="ALL">全部通道</option>
              <option value="IN_APP">站内消息</option>
              <option value="EMAIL">邮件通道</option>
            </select>
            <Button variant="outline" onClick={() => void query.refetch()}>
              刷新
            </Button>
          </div>

          {(query.data?.items ?? []).map((item) => (
            <div key={item.id} className="rounded border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
              <p className="font-medium">[{item.channel}] {item.title}</p>
              <p className="text-xs text-slate-500">{item.user?.username ?? item.userId} | {item.type}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.content}</p>
            </div>
          ))}

          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((v) => Math.max(1, v - 1))}>
              上一页
            </Button>
            <Button size="sm" variant="outline" disabled={page >= maxPage} onClick={() => setPage((v) => Math.min(maxPage, v + 1))}>
              下一页
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>邮件投递日志</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"
              value={emailStatus}
              onChange={(event) =>
                setEmailStatus(event.target.value as 'ALL' | 'PENDING' | 'SENT' | 'FAILED')
              }
            >
              <option value="ALL">全部状态</option>
              <option value="PENDING">待发送</option>
              <option value="SENT">已发送</option>
              <option value="FAILED">失败</option>
            </select>
            <Button variant="outline" onClick={() => void emailLogQuery.refetch()}>
              刷新
            </Button>
          </div>

          {(emailLogQuery.data?.items ?? []).map((item) => (
            <div
              key={item.id}
              className="rounded border border-slate-200 px-3 py-2 text-xs dark:border-slate-800"
            >
              <p className="font-medium">
                [{item.status}] {item.subject}
              </p>
              <p className="text-slate-500">
                to: {item.recipient} | retries: {item.retries}
              </p>
              {item.lastError ? <p className="text-rose-600 dark:text-rose-300">{item.lastError}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
