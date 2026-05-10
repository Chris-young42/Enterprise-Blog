import { useMutation, useQuery } from '@tanstack/react-query'
import {
  clearSiteCache,
  fetchBackupTasks,
  fetchStaticArtifacts,
  fetchStaticTasks,
  generateSiteStatic,
  runMigratePrecheck,
  runMigrateWithToken,
  runBackupTask,
  runRestorePrecheck,
  runRestoreWithToken,
} from '@/api/ops'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function OpsAdminPage() {
  const [restoreFrom, setRestoreFrom] = useState('')
  const [migrateTarget, setMigrateTarget] = useState('production')
  const [restorePhrase, setRestorePhrase] = useState('')
  const [migratePhrase, setMigratePhrase] = useState('')
  const [restoreReason, setRestoreReason] = useState('')
  const [migrateReason, setMigrateReason] = useState('')
  const clearCacheMutation = useMutation({ mutationFn: clearSiteCache })
  const staticMutation = useMutation({ mutationFn: generateSiteStatic })
  const backupMutation = useMutation({ mutationFn: runBackupTask })
  const restoreMutation = useMutation({
    mutationFn: ({
      restoreFrom,
      confirmToken,
      dryRun,
      confirmPhrase,
      approvalReason,
    }: {
      restoreFrom: string
      confirmToken?: string
      dryRun?: boolean
      confirmPhrase?: string
      approvalReason?: string
    }) =>
      runRestoreWithToken({
        restoreFrom,
        ...(confirmToken ? { confirmToken } : {}),
        ...(dryRun !== undefined ? { dryRun } : {}),
        ...(confirmPhrase ? { confirmPhrase } : {}),
        ...(approvalReason ? { approvalReason } : {}),
      }),
  })
  const migrateMutation = useMutation({
    mutationFn: ({
      target,
      confirmToken,
      dryRun,
      confirmPhrase,
      approvalReason,
    }: {
      target?: string
      confirmToken?: string
      dryRun?: boolean
      confirmPhrase?: string
      approvalReason?: string
    }) =>
      runMigrateWithToken({
        ...(target ? { target } : {}),
        ...(confirmToken ? { confirmToken } : {}),
        ...(dryRun !== undefined ? { dryRun } : {}),
        ...(confirmPhrase ? { confirmPhrase } : {}),
        ...(approvalReason ? { approvalReason } : {}),
      }),
  })

  const staticTasksQuery = useQuery({
    queryKey: ['admin', 'ops', 'static-tasks'],
    queryFn: () => fetchStaticTasks({ page: 1, pageSize: 20 }),
  })

  const artifactsQuery = useQuery({
    queryKey: ['admin', 'ops', 'static-artifacts'],
    queryFn: fetchStaticArtifacts,
  })

  const backupTasksQuery = useQuery({
    queryKey: ['admin', 'ops', 'backup-tasks'],
    queryFn: () => fetchBackupTasks({ page: 1, pageSize: 20 }),
  })

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第11阶段</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">运维控制台</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>缓存与静态化</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void clearCacheMutation.mutateAsync()}>
              清理站点缓存
            </Button>
            <Button variant="outline" onClick={() => void staticMutation.mutateAsync()}>
              一键静态化生成
            </Button>
          </div>
          {clearCacheMutation.data ? (
            <div className="rounded border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
              <p className="font-medium">缓存清理结果：{clearCacheMutation.data.message}</p>
              <p>{clearCacheMutation.data.clearedKeys.join(' / ')}</p>
            </div>
          ) : null}
          {staticMutation.data ? (
            <div className="rounded border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
              <p className="font-medium">静态化结果：{staticMutation.data.message}</p>
              <p>{staticMutation.data.generated.join(' / ')}</p>
              <p>任务号：{staticMutation.data.taskNo}</p>
              <p>产物目录：{staticMutation.data.outputDir}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>静态化任务与产物</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {(staticTasksQuery.data?.items ?? []).map((item) => (
            <div key={item.id} className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
              <p className="font-medium">[{item.status}] {item.taskNo}</p>
              <p>files: {item.fileCount} | output: {item.outputDir}</p>
              {item.error ? <p className="text-rose-600 dark:text-rose-300">{item.error}</p> : null}
            </div>
          ))}
          <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="font-medium">当前产物列表</p>
            <p className="mt-1 break-all">{(artifactsQuery.data?.files ?? []).join(' / ') || '-'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>备份/恢复/迁移</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void backupMutation.mutateAsync()}>
              执行备份
            </Button>
            <Input
              value={restoreFrom}
              onChange={(event) => setRestoreFrom(event.target.value)}
              placeholder="恢复文件路径"
              className="w-72"
            />
            <Input
              value={restorePhrase}
              onChange={(event) => setRestorePhrase(event.target.value)}
              placeholder="确认短语：RESTORE CONFIRM"
              className="w-72"
            />
            <Input
              value={restoreReason}
              onChange={(event) => setRestoreReason(event.target.value)}
              placeholder="审批原因（至少8字）"
              className="w-72"
            />
            <Button
              variant="outline"
              onClick={() => {
                if (!restoreFrom.trim()) return
                void restoreMutation.mutateAsync({
                  restoreFrom: restoreFrom.trim(),
                  dryRun: true,
                  confirmPhrase: restorePhrase.trim(),
                  approvalReason: restoreReason.trim(),
                })
              }}
            >
              恢复 Dry-Run
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!restoreFrom.trim()) return
                const precheck = await runRestorePrecheck(restoreFrom.trim())
                await restoreMutation.mutateAsync({
                  restoreFrom: restoreFrom.trim(),
                  confirmToken: precheck.confirmToken,
                  confirmPhrase: restorePhrase.trim(),
                  approvalReason: restoreReason.trim(),
                })
              }}
            >
              执行恢复（两段式确认）
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            恢复文件需位于后端 `BACKUP_OUTPUT_DIR` 目录内；系统会在恢复前自动生成回滚点快照。
          </p>
          <p className="text-xs text-slate-500">
            正式恢复需两名管理员：发起预检查人与执行确认人必须不同，并输入短语 `RESTORE CONFIRM`。
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={migrateTarget}
              onChange={(event) => setMigrateTarget(event.target.value)}
              placeholder="迁移目标"
              className="w-72"
            />
            <Input
              value={migratePhrase}
              onChange={(event) => setMigratePhrase(event.target.value)}
              placeholder="确认短语：MIGRATE CONFIRM"
              className="w-72"
            />
            <Input
              value={migrateReason}
              onChange={(event) => setMigrateReason(event.target.value)}
              placeholder="审批原因（至少8字）"
              className="w-72"
            />
            <Button
              variant="outline"
              onClick={() =>
                void migrateMutation.mutateAsync({
                  target: migrateTarget,
                  dryRun: true,
                  confirmPhrase: migratePhrase.trim(),
                  approvalReason: migrateReason.trim(),
                })
              }
            >
              迁移 Dry-Run
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const precheck = await runMigratePrecheck(migrateTarget)
                await migrateMutation.mutateAsync({
                  target: migrateTarget,
                  confirmToken: precheck.confirmToken,
                  confirmPhrase: migratePhrase.trim(),
                  approvalReason: migrateReason.trim(),
                })
              }}
            >
              执行迁移（两段式确认）
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            迁移会执行真实 `prisma migrate status/deploy`，并在执行前自动生成回滚点快照与审计日志。
          </p>
          <p className="text-xs text-slate-500">
            正式迁移需两名管理员：发起预检查人与执行确认人必须不同，并输入短语 `MIGRATE CONFIRM`。
          </p>

          {(backupTasksQuery.data?.items ?? []).map((item) => (
            <div key={item.id} className="rounded border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
              <p className="font-medium">[{item.type}/{item.status}] {item.taskNo}</p>
              <p>command: {item.command}</p>
              {item.artifactPath ? <p>artifact: {item.artifactPath}</p> : null}
              {item.output ? <p>{item.output}</p> : null}
              {item.error ? <p className="text-rose-600 dark:text-rose-300">{item.error}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
