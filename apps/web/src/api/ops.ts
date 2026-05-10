import { httpRequest } from './http'

export type SensitiveWordItem = {
  id: string
  keyword: string
  level: 'BLOCK' | 'REPLACE' | 'REVIEW'
  replaceWith: string | null
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export type NotificationItem = {
  id: string
  userId: string
  type: 'COMMENT' | 'SYSTEM' | 'FOLLOW' | 'SECURITY'
  channel: 'IN_APP' | 'EMAIL'
  title: string
  content: string
  isRead: boolean
  sentAt: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    username: string
    nickname: string | null
    email: string
  }
}

export type PagedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type EmailDeliveryLogItem = {
  id: string
  notificationId: string | null
  recipient: string
  subject: string
  contentPreview: string | null
  status: 'PENDING' | 'SENT' | 'FAILED'
  retries: number
  lastError: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
  notification?: {
    id: string
    userId: string
    title: string
    type: 'COMMENT' | 'SYSTEM' | 'FOLLOW' | 'SECURITY'
    channel: 'IN_APP' | 'EMAIL'
    createdAt: string
  } | null
}

export type StaticTaskItem = {
  id: string
  taskNo: string
  status: 'RUNNING' | 'SUCCESS' | 'FAILED'
  outputDir: string
  generatedRoutes: string[]
  generatedFiles: string[]
  fileCount: number
  startedAt: string
  finishedAt: string | null
  error: string | null
}

export type BackupTaskItem = {
  id: string
  taskNo: string
  type: 'BACKUP' | 'RESTORE' | 'MIGRATE'
  status: 'RUNNING' | 'SUCCESS' | 'FAILED'
  artifactPath: string | null
  restoreFrom: string | null
  target: string | null
  command: string
  output: string | null
  error: string | null
  startedAt: string
  finishedAt: string | null
}

export type SiteProfile = {
  name: string
  logo: string
  icp: string
  copyright: string
}

export type SecurityIpBanItem = {
  id: string
  ip: string
  reason: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export type SecurityKeywordBanItem = {
  id: string
  keyword: string
  reason: string | null
  createdAt: string
}

export type SecurityBlockedDomainsResult = {
  items: string[]
  updatedAt: string | null
}

export type RedisHealthResult = {
  healthy: boolean
  pong: string | null
  degraded: boolean
  checkedAt: string
  latencyMs: number
}

export type RedisSlaResult = {
  window: {
    hours: number
    start: string
    end: string
  }
  availabilityPct: number
  totalDowntimeMs: number
  incidentCount: number
  activeIncident: boolean
  incidents: Array<{
    startedAt: string
    recoveredAt: string | null
    durationMs: number
  }>
}

export type RedisSlaTrendResult = {
  range: {
    start: string
    end: string
  }
  points: Array<{
    bucket: string
    probes: number
    failures: number
    failureRatePct: number
    mttrMs: number
    recoveredCount: number
  }>
}

export type GeoipValidationResult = {
  summary: {
    countryAccuracy: number | null
    cityAccuracy: number | null
  }
  checked: Array<{
    ip: string
    expectedCountry: string | null
    expectedCity: string | null
    actualCountry: string
    actualCity: string
    countryMatch: boolean | null
    cityMatch: boolean | null
  }>
}

export type GeoipValidationHistoryResult = {
  latest: {
    id: string
    createdAt: string
    summary: {
      countryAccuracy: number | null
      cityAccuracy: number | null
    }
    sampleSize: number
  } | null
  previous: {
    id: string
    createdAt: string
    summary: {
      countryAccuracy: number | null
      cityAccuracy: number | null
    }
    sampleSize: number
  } | null
  history: Array<{
    id: string
    createdAt: string
    summary: {
      countryAccuracy: number | null
      cityAccuracy: number | null
    }
    sampleSize: number
  }>
  delta: {
    countryAccuracyDelta: number | null
    cityAccuracyDelta: number | null
  }
}

export type GeoipUpdateState = {
  running: boolean
  lastStatus: 'IDLE' | 'SUCCESS' | 'FAILED' | 'SKIPPED'
  lastTrigger: 'MANUAL' | 'AUTO' | null
  lastStartedAt: string | null
  lastFinishedAt: string | null
  lastSuccessAt: string | null
  lastError: string | null
  lastDurationMs: number | null
  lastOutputPreview: string | null
  nextRunAt: string | null
  intervalHours: number
  licenseConfigured: boolean
  statusHint: string | null
}

export function fetchSensitiveWords(params?: { keyword?: string; isEnabled?: boolean }) {
  const query = new URLSearchParams()
  if (params?.keyword) query.set('keyword', params.keyword)
  if (params?.isEnabled !== undefined) query.set('isEnabled', params.isEnabled ? 'true' : 'false')
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpRequest<SensitiveWordItem[]>(`/sensitive-words${suffix}`)
}

export function createSensitiveWord(payload: {
  keyword: string
  level?: 'BLOCK' | 'REPLACE' | 'REVIEW'
  replaceWith?: string
  isEnabled?: boolean
}) {
  return httpRequest<SensitiveWordItem>('/sensitive-words', {
    method: 'POST',
    body: payload,
  })
}

export function updateSensitiveWord(
  id: string,
  payload: {
    keyword?: string
    level?: 'BLOCK' | 'REPLACE' | 'REVIEW'
    replaceWith?: string
    isEnabled?: boolean
  },
) {
  return httpRequest<SensitiveWordItem>(`/sensitive-words/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteSensitiveWord(id: string) {
  return httpRequest<{ id: string }>(`/sensitive-words/${id}`, {
    method: 'DELETE',
  })
}

export function fetchAdminNotifications(params?: {
  page?: number
  pageSize?: number
  channel?: 'IN_APP' | 'EMAIL'
}) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', `${params.page}`)
  if (params?.pageSize) query.set('pageSize', `${params.pageSize}`)
  if (params?.channel) query.set('channel', params.channel)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpRequest<PagedResult<NotificationItem>>(`/notifications/admin/list${suffix}`)
}

export function fetchAdminEmailLogs(params?: {
  page?: number
  pageSize?: number
  status?: 'PENDING' | 'SENT' | 'FAILED'
  recipient?: string
}) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', `${params.page}`)
  if (params?.pageSize) query.set('pageSize', `${params.pageSize}`)
  if (params?.status) query.set('status', params.status)
  if (params?.recipient) query.set('recipient', params.recipient)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpRequest<PagedResult<EmailDeliveryLogItem>>(`/notifications/admin/email-logs${suffix}`)
}

export function clearSiteCache() {
  return httpRequest<{ success: boolean; message: string; at: string; clearedKeys: string[] }>('/ops/cache/clear', {
    method: 'POST',
  })
}

export function generateSiteStatic() {
  return httpRequest<{ success: boolean; message: string; at: string; generated: string[]; files: string[]; taskNo: string; outputDir: string }>('/ops/static/generate', {
    method: 'POST',
  })
}

export function fetchStaticTasks(params?: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', `${params.page}`)
  if (params?.pageSize) query.set('pageSize', `${params.pageSize}`)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpRequest<PagedResult<StaticTaskItem>>(`/ops/static/tasks${suffix}`)
}

export function fetchStaticArtifacts() {
  return httpRequest<{ outputDir: string; files: string[] }>('/ops/static/artifacts')
}

export function runBackupTask() {
  return httpRequest<{ success: boolean; taskNo: string; type: 'BACKUP'; artifactPath: string | null; output: string; error?: string }>('/ops/backup', {
    method: 'POST',
  })
}

export function runRestoreTask(restoreFrom: string) {
  return httpRequest<{ success: boolean; taskNo: string; type: 'RESTORE'; artifactPath: string | null; output: string; error?: string }>('/ops/restore', {
    method: 'POST',
    body: { restoreFrom },
  })
}

export function runMigrateTask(target: string) {
  return httpRequest<{ success: boolean; taskNo: string; type: 'MIGRATE'; artifactPath: string | null; output: string; error?: string }>('/ops/migrate', {
    method: 'POST',
    body: { target },
  })
}

export function runRestorePrecheck(restoreFrom: string) {
  return httpRequest<{
    ok: boolean
    report: {
      sourceFile: string
      fileSizeBytes: number
      checksum: string
      snapshotCreatedAt: string
      entities: {
        siteConfigs: number
        categories: number
        tags: number
        series: number
        pages: number
      }
      warnings: string[]
    }
    confirmToken: string
    tokenId: string
    requiredPhrase: 'RESTORE CONFIRM'
    expiresAt: string
  }>('/ops/restore/precheck', {
    method: 'POST',
    body: { restoreFrom },
  })
}

export function runRestoreWithToken(payload: {
  restoreFrom: string
  confirmToken?: string
  dryRun?: boolean
  confirmPhrase?: string
  approvalReason?: string
}) {
  return httpRequest<{
    success: boolean
    dryRun?: boolean
    taskNo?: string
    tokenId?: string
    report?: unknown
    output?: string
    error?: string
  }>('/ops/restore', {
    method: 'POST',
    body: payload,
  })
}

export function runMigratePrecheck(target?: string) {
  return httpRequest<{
    ok: boolean
    report: {
      target: string
      hasPendingMigrations: boolean
      statusSummary: string
      warnings: string[]
    }
    confirmToken: string
    tokenId: string
    requiredPhrase: 'MIGRATE CONFIRM'
    expiresAt: string
  }>('/ops/migrate/precheck', {
    method: 'POST',
    body: target ? { target } : {},
  })
}

export function runMigrateWithToken(payload: {
  target?: string
  confirmToken?: string
  dryRun?: boolean
  confirmPhrase?: string
  approvalReason?: string
}) {
  return httpRequest<{
    success: boolean
    dryRun?: boolean
    taskNo?: string
    tokenId?: string
    report?: unknown
    output?: string
    error?: string
  }>('/ops/migrate', {
    method: 'POST',
    body: payload,
  })
}

export function fetchBackupTasks(params?: {
  page?: number
  pageSize?: number
  type?: 'BACKUP' | 'RESTORE' | 'MIGRATE'
  status?: 'RUNNING' | 'SUCCESS' | 'FAILED'
}) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', `${params.page}`)
  if (params?.pageSize) query.set('pageSize', `${params.pageSize}`)
  if (params?.type) query.set('type', params.type)
  if (params?.status) query.set('status', params.status)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpRequest<PagedResult<BackupTaskItem>>(`/ops/backup/tasks${suffix}`)
}

export function fetchOpsApprovalRecords(params?: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', `${params.page}`)
  if (params?.pageSize) query.set('pageSize', `${params.pageSize}`)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpRequest<
    PagedResult<{
      id: string
      module: string
      action: string
      resourceId: string | null
      payload: Record<string, unknown> | null
      createdAt: string
      user: {
        id: string
        username: string
        nickname: string | null
      } | null
    }>
  >(`/ops/approval-records${suffix}`)
}

export function fetchSiteProfile() {
  return httpRequest<SiteProfile>('/ops/site/profile')
}

export function updateSiteProfile(payload: Partial<SiteProfile>) {
  return httpRequest<SiteProfile>('/ops/site/profile', {
    method: 'PATCH',
    body: payload,
  })
}

export function fetchSecurityIpBans() {
  return httpRequest<SecurityIpBanItem[]>('/security/ip-bans')
}

export function createSecurityIpBan(payload: { ip: string; reason?: string; expiresAt?: string }) {
  return httpRequest<SecurityIpBanItem>('/security/ip-bans', {
    method: 'POST',
    body: payload,
  })
}

export function removeSecurityIpBan(id: string) {
  return httpRequest<{ id: string }>(`/security/ip-bans/${id}`, {
    method: 'DELETE',
  })
}

export function fetchSecurityKeywordBans() {
  return httpRequest<{ items: SecurityKeywordBanItem[]; updatedAt: string | null }>('/security/keyword-bans')
}

export function createSecurityKeywordBan(payload: { keyword: string; reason?: string }) {
  return httpRequest<{ items: SecurityKeywordBanItem[] }>('/security/keyword-bans', {
    method: 'POST',
    body: payload,
  })
}

export function removeSecurityKeywordBan(id: string) {
  return httpRequest<{ id: string }>(`/security/keyword-bans/${id}`, {
    method: 'DELETE',
  })
}

export function fetchSecurityBlockedDomains() {
  return httpRequest<SecurityBlockedDomainsResult>('/security/blocked-domains')
}

export function addSecurityBlockedDomain(payload: { domain: string }) {
  return httpRequest<{ items: string[] }>('/security/blocked-domains', {
    method: 'POST',
    body: payload,
  })
}

export function removeSecurityBlockedDomain(domain: string) {
  return httpRequest<{ items: string[] }>(`/security/blocked-domains/${encodeURIComponent(domain)}`, {
    method: 'DELETE',
  })
}

export function fetchRedisHealth() {
  return httpRequest<RedisHealthResult>('/security/redis/health')
}

export function fetchRedisSla(hours?: number) {
  const query = new URLSearchParams()
  if (hours !== undefined) query.set('hours', `${hours}`)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpRequest<RedisSlaResult>(`/security/redis/sla${suffix}`)
}

export function fetchRedisSlaTrend(days?: number) {
  const query = new URLSearchParams()
  if (days !== undefined) query.set('days', `${days}`)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return httpRequest<RedisSlaTrendResult>(`/security/redis/sla/trend${suffix}`)
}

export function runGeoipUpdate() {
  return httpRequest<{ success: boolean; message: string; output: string }>('/security/geoip/update', {
    method: 'POST',
  })
}

export function fetchGeoipStatus() {
  return httpRequest<GeoipUpdateState>('/security/geoip/status')
}

export function runGeoipReload() {
  return httpRequest<{ success: boolean; message: string }>('/security/geoip/reload', {
    method: 'POST',
  })
}

export function runGeoipValidate(samples: Array<{ ip: string; country?: string; city?: string }>) {
  return httpRequest<
    {
      latest: {
        id: string
        createdAt: string
        summary: {
          countryAccuracy: number | null
          cityAccuracy: number | null
        }
        sampleSize: number
      } | null
      previous: {
        id: string
        createdAt: string
        summary: {
          countryAccuracy: number | null
          cityAccuracy: number | null
        }
        sampleSize: number
      } | null
      delta: {
        countryAccuracyDelta: number | null
        cityAccuracyDelta: number | null
      }
      history: Array<{
        id: string
        createdAt: string
        summary: {
          countryAccuracy: number | null
          cityAccuracy: number | null
        }
        sampleSize: number
      }>
    }
  >('/security/geoip/validate', {
    method: 'POST',
    body: { samples },
  })
}

export function fetchGeoipValidationHistory() {
  return httpRequest<GeoipValidationHistoryResult>('/security/geoip/validation-history')
}
