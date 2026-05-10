import { useMemo, useState } from 'react'
import { fetchSiteProfile, updateSiteProfile, type SiteProfile } from '@/api/ops'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery } from '@tanstack/react-query'

const defaultProfile: SiteProfile = {
  name: 'Enterprise Blog',
  logo: '',
  icp: '',
  copyright: 'Copyright © Enterprise Blog',
}

export function SiteBaseProfileAdminPage() {
  const profileQuery = useQuery({
    queryKey: ['admin', 'site-profile'],
    queryFn: fetchSiteProfile,
  })

  const profileCurrent = useMemo(() => profileQuery.data ?? defaultProfile, [profileQuery.data])
  const [draft, setDraft] = useState<SiteProfile>(defaultProfile)
  const [dirty, setDirty] = useState(false)

  if (!dirty && draft !== profileCurrent) {
    setDraft(profileCurrent)
  }

  const updateMutation = useMutation({
    mutationFn: updateSiteProfile,
    onSuccess: (data) => {
      setDraft(data)
      setDirty(false)
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第11阶段</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">站点基础信息</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>基础配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="站点名称"
            value={draft.name}
            onChange={(event) => {
              setDirty(true)
              setDraft((prev) => ({ ...prev, name: event.target.value }))
            }}
          />
          <Input
            placeholder="Logo URL"
            value={draft.logo}
            onChange={(event) => {
              setDirty(true)
              setDraft((prev) => ({ ...prev, logo: event.target.value }))
            }}
          />
          <Input
            placeholder="备案信息"
            value={draft.icp}
            onChange={(event) => {
              setDirty(true)
              setDraft((prev) => ({ ...prev, icp: event.target.value }))
            }}
          />
          <Input
            placeholder="版权信息"
            value={draft.copyright}
            onChange={(event) => {
              setDirty(true)
              setDraft((prev) => ({ ...prev, copyright: event.target.value }))
            }}
          />
          <Button
            onClick={() =>
              void updateMutation.mutateAsync({
                name: draft.name.trim(),
                logo: draft.logo.trim(),
                icp: draft.icp.trim(),
                copyright: draft.copyright.trim(),
              })
            }
          >
            保存基础配置
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}