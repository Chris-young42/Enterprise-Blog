import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOpsApprovalRecords } from '@/api/ops'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function OpsApprovalRecordsPage() {
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['admin', 'ops', 'approval-records', page],
    queryFn: () => fetchOpsApprovalRecords({ page, pageSize: 20 }),
  })

  const total = query.data?.total ?? 0
  const pageSize = query.data?.pageSize ?? 20
  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第11阶段</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">审批记录中心</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>高危操作审批流水</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(query.data?.items ?? []).map((item) => (
            <div key={item.id} className="rounded border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
              <p className="font-medium">[{item.module}/{item.action}] {item.resourceId ?? '-'}</p>
              <p className="text-slate-500">operator: {item.user?.nickname ?? item.user?.username ?? '-'}</p>
              <p className="text-slate-500">at: {new Date(item.createdAt).toLocaleString()}</p>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[11px] text-slate-600 dark:text-slate-300">
                {JSON.stringify(item.payload ?? {}, null, 2)}
              </pre>
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
    </div>
  )
}
