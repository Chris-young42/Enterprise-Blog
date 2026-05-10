import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  createSecurityIpBan,
  createSecurityKeywordBan,
  addSecurityBlockedDomain,
  fetchGeoipStatus,
  fetchGeoipValidationHistory,
  fetchRedisHealth,
  fetchRedisSla,
  fetchRedisSlaTrend,
  fetchSecurityIpBans,
  fetchSecurityBlockedDomains,
  fetchSecurityKeywordBans,
  runGeoipReload,
  runGeoipUpdate,
  runGeoipValidate,
  removeSecurityIpBan,
  removeSecurityBlockedDomain,
  removeSecurityKeywordBan,
} from '@/api/ops'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function SecurityAdminPage() {
  const queryClient = useQueryClient()
  const [ip, setIp] = useState('')
  const [ipReason, setIpReason] = useState('')
  const [keyword, setKeyword] = useState('')
  const [keywordReason, setKeywordReason] = useState('')
  const [blockedDomain, setBlockedDomain] = useState('')
  const [geoipSamplesRaw, setGeoipSamplesRaw] = useState('8.8.8.8,US,Mountain View\n1.1.1.1,AU,Sydney')

  const ipQuery = useQuery({
    queryKey: ['admin', 'security', 'ip-bans'],
    queryFn: fetchSecurityIpBans,
  })
  const keywordQuery = useQuery({
    queryKey: ['admin', 'security', 'keyword-bans'],
    queryFn: fetchSecurityKeywordBans,
  })
  const blockedDomainsQuery = useQuery({
    queryKey: ['admin', 'security', 'blocked-domains'],
    queryFn: fetchSecurityBlockedDomains,
  })
  const redisHealthQuery = useQuery({
    queryKey: ['admin', 'security', 'redis-health'],
    queryFn: fetchRedisHealth,
    refetchInterval: 30000,
  })
  const redisSlaQuery = useQuery({
    queryKey: ['admin', 'security', 'redis-sla'],
    queryFn: () => fetchRedisSla(24),
    refetchInterval: 60000,
  })
  const redisSlaTrendQuery = useQuery({
    queryKey: ['admin', 'security', 'redis-sla-trend'],
    queryFn: () => fetchRedisSlaTrend(30),
    refetchInterval: 60000,
  })
  const geoipStatusQuery = useQuery({
    queryKey: ['admin', 'security', 'geoip-status'],
    queryFn: fetchGeoipStatus,
    refetchInterval: 30000,
  })
  const geoipValidationHistoryQuery = useQuery({
    queryKey: ['admin', 'security', 'geoip-validation-history'],
    queryFn: fetchGeoipValidationHistory,
  })

  const createIpMutation = useMutation({
    mutationFn: createSecurityIpBan,
    onSuccess: async () => {
      setIp('')
      setIpReason('')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'ip-bans'] })
    },
  })
  const removeIpMutation = useMutation({
    mutationFn: removeSecurityIpBan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'ip-bans'] })
    },
  })

  const createKeywordMutation = useMutation({
    mutationFn: createSecurityKeywordBan,
    onSuccess: async () => {
      setKeyword('')
      setKeywordReason('')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'keyword-bans'] })
    },
  })
  const removeKeywordMutation = useMutation({
    mutationFn: removeSecurityKeywordBan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'keyword-bans'] })
    },
  })
  const addBlockedDomainMutation = useMutation({
    mutationFn: addSecurityBlockedDomain,
    onSuccess: async () => {
      setBlockedDomain('')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'blocked-domains'] })
    },
  })
  const removeBlockedDomainMutation = useMutation({
    mutationFn: removeSecurityBlockedDomain,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'blocked-domains'] })
    },
  })
  const geoipUpdateMutation = useMutation({
    mutationFn: runGeoipUpdate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'geoip-status'] })
    },
  })
  const geoipReloadMutation = useMutation({
    mutationFn: runGeoipReload,
  })
  const geoipValidateMutation = useMutation({
    mutationFn: runGeoipValidate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'security', 'geoip-validation-history'] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">第12阶段</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">安全策略中心</h1>
      </div>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>Redis 健康探针</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="font-medium">
              状态：{redisHealthQuery.data?.healthy ? 'HEALTHY' : 'DEGRADED'} / fallback: {redisHealthQuery.data?.degraded ? 'YES' : 'NO'}
            </p>
            <p>pong: {redisHealthQuery.data?.pong ?? '-'}</p>
            <p>latency: {redisHealthQuery.data?.latencyMs ?? '-'} ms</p>
            <p>checkedAt: {redisHealthQuery.data?.checkedAt ? new Date(redisHealthQuery.data.checkedAt).toLocaleString() : '-'}</p>
          </div>
          <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="font-medium">24h SLA: {redisSlaQuery.data?.availabilityPct ?? '-'}%</p>
            <p>downtime: {redisSlaQuery.data ? Math.round(redisSlaQuery.data.totalDowntimeMs / 1000) : '-'} s</p>
            <p>incidents: {redisSlaQuery.data?.incidentCount ?? '-'}</p>
            <p>active incident: {redisSlaQuery.data?.activeIncident ? 'YES' : 'NO'}</p>
          </div>
          <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="font-medium">30天失败率/MTTR趋势</p>
            {(redisSlaTrendQuery.data?.points ?? []).slice(-7).map((item) => (
              <p key={item.bucket} className="text-slate-500">
                {item.bucket} | failRate {item.failureRatePct}% | mttr {Math.round(item.mttrMs / 1000)}s
              </p>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => void redisHealthQuery.refetch()}>
            手动探测
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>GeoIP 数据维护</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void geoipUpdateMutation.mutateAsync()}>
              更新GeoIP数据库
            </Button>
            <Button size="sm" variant="outline" onClick={() => void geoipReloadMutation.mutateAsync()}>
              重新加载GeoIP
            </Button>
          </div>
          {geoipUpdateMutation.data ? (
            <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
              <p className="font-medium">{geoipUpdateMutation.data.message}</p>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] text-slate-500">{geoipUpdateMutation.data.output}</pre>
            </div>
          ) : null}
          <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="font-medium">自动更新状态：{geoipStatusQuery.data?.lastStatus ?? '-'}</p>
            <p>interval: {geoipStatusQuery.data?.intervalHours ?? '-'} h</p>
            <p>next run: {geoipStatusQuery.data?.nextRunAt ? new Date(geoipStatusQuery.data.nextRunAt).toLocaleString() : '-'}</p>
            <p>last success: {geoipStatusQuery.data?.lastSuccessAt ? new Date(geoipStatusQuery.data.lastSuccessAt).toLocaleString() : '-'}</p>
            <p>last error: {geoipStatusQuery.data?.lastError ?? '-'}</p>
            <p>license configured: {geoipStatusQuery.data?.licenseConfigured ? 'YES' : 'NO'}</p>
            {!geoipStatusQuery.data?.licenseConfigured ? (
              <p className="text-amber-600 dark:text-amber-400">
                请在 `apps/api/.env` 配置 `GEOIP_LICENSE_KEY` 后重启 API，自动更新状态会从 SKIPPED 转为 SUCCESS。
              </p>
            ) : null}
          </div>
          <textarea
            className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
            value={geoipSamplesRaw}
            onChange={(event) => setGeoipSamplesRaw(event.target.value)}
            placeholder="每行: ip,country,city"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const samples = geoipSamplesRaw
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
                .map((line) => {
                  const [rawIpPart, rawCountryPart, rawCityPart] = line.split(',').map((part) => part.trim())
                  const ipPart = rawIpPart ?? ''
                  const countryPart = rawCountryPart ?? ''
                  const cityPart = rawCityPart ?? ''
                  return {
                    ip: ipPart,
                    ...(countryPart ? { country: countryPart } : {}),
                    ...(cityPart ? { city: cityPart } : {}),
                  }
                })
                .filter((item) => item.ip.length > 0)
              void geoipValidateMutation.mutateAsync(samples)
            }}
          >
            执行精度校验
          </Button>
          {geoipValidateMutation.data ? (
            <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
              <p>country delta: {geoipValidateMutation.data.delta.countryAccuracyDelta ?? '-'}%</p>
              <p>city delta: {geoipValidateMutation.data.delta.cityAccuracyDelta ?? '-'}%</p>
            </div>
          ) : null}
          <div className="rounded border border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="font-medium">校验历史对比</p>
            <p>
              latest: {geoipValidationHistoryQuery.data?.latest?.summary.countryAccuracy ?? '-'}% /{' '}
              {geoipValidationHistoryQuery.data?.latest?.summary.cityAccuracy ?? '-'}%
            </p>
            <p>
              previous: {geoipValidationHistoryQuery.data?.previous?.summary.countryAccuracy ?? '-'}% /{' '}
              {geoipValidationHistoryQuery.data?.previous?.summary.cityAccuracy ?? '-'}%
            </p>
            <p>
              delta: {geoipValidationHistoryQuery.data?.delta.countryAccuracyDelta ?? '-'}% /{' '}
              {geoipValidationHistoryQuery.data?.delta.cityAccuracyDelta ?? '-'}%
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>IP 封禁管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input value={ip} onChange={(event) => setIp(event.target.value)} placeholder="IP 地址" className="w-72" />
            <Input value={ipReason} onChange={(event) => setIpReason(event.target.value)} placeholder="封禁原因（可选）" className="w-80" />
            <Button
              onClick={() =>
                void createIpMutation.mutateAsync({
                  ip: ip.trim(),
                  ...(ipReason.trim() ? { reason: ipReason.trim() } : {}),
                })
              }
              disabled={!ip.trim()}
            >
              新增封禁
            </Button>
          </div>
          {(ipQuery.data ?? []).map((item) => (
            <div key={item.id} className="rounded border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
              <p className="font-medium">{item.ip}</p>
              <p className="text-slate-500">reason: {item.reason ?? '-'}</p>
              <p className="text-slate-500">expiresAt: {item.expiresAt ?? 'never'}</p>
              <Button size="sm" variant="outline" onClick={() => void removeIpMutation.mutateAsync(item.id)}>
                解除封禁
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>关键词封禁管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="封禁关键词" className="w-72" />
            <Input value={keywordReason} onChange={(event) => setKeywordReason(event.target.value)} placeholder="封禁原因（可选）" className="w-80" />
            <Button
              onClick={() =>
                void createKeywordMutation.mutateAsync({
                  keyword: keyword.trim(),
                  ...(keywordReason.trim() ? { reason: keywordReason.trim() } : {}),
                })
              }
              disabled={!keyword.trim()}
            >
              新增关键词
            </Button>
          </div>
          {(keywordQuery.data?.items ?? []).map((item) => (
            <div key={item.id} className="rounded border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
              <p className="font-medium">{item.keyword}</p>
              <p className="text-slate-500">reason: {item.reason ?? '-'}</p>
              <Button size="sm" variant="outline" onClick={() => void removeKeywordMutation.mutateAsync(item.id)}>
                删除关键词
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/60 bg-white/85 dark:border-slate-800/80 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>恶意来源域名拦截</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              value={blockedDomain}
              onChange={(event) => setBlockedDomain(event.target.value)}
              placeholder="example.com"
              className="w-72"
            />
            <Button
              onClick={() =>
                void addBlockedDomainMutation.mutateAsync({
                  domain: blockedDomain.trim(),
                })
              }
              disabled={!blockedDomain.trim()}
            >
              新增拦截域名
            </Button>
          </div>
          {(blockedDomainsQuery.data?.items ?? []).map((item) => (
            <div key={item} className="rounded border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
              <p className="font-medium">{item}</p>
              <Button size="sm" variant="outline" onClick={() => void removeBlockedDomainMutation.mutateAsync(item)}>
                删除域名
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
