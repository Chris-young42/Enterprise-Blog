import { httpRequest, HttpError } from './http'
import { apiBaseUrl } from '@/lib/env'

export type StatsOverview = {
  articleTotal: number
  publishedArticleTotal: number
  userTotal: number
  commentTotal: number
  messageBoardTotal: number
  friendLinkTotal: number
  accessLogTotal: number
  spiderVisitTotal: number
}

export type TrafficPoint = {
  bucket: string
  visits: number
}

export type TrafficResult = {
  granularity: 'day' | 'week' | 'month'
  range: {
    start: string
    end: string
  }
  previousRange: {
    start: string
    end: string
  }
  totalVisits: number
  previousTotalVisits: number
  changeRate: number
  points: TrafficPoint[]
}

export type RankingBucket = {
  name: string
  count: number
}

export type ContentRanking = {
  articleRanking: Array<{
    id: string
    title: string
    slug: string
    views: number
    likes: number
    favorites: number
  }>
  tagRanking: Array<{
    tagId: string
    name: string
    slug: string
    count: number
  }>
  categoryRanking: Array<{
    categoryId: string | null
    name: string
    slug: string
    count: number
  }>
}

export type VisitorAnalysis = {
  region: RankingBucket[]
  deviceType: RankingBucket[]
  browser: RankingBucket[]
}

export type SpiderAnalysis = {
  bySpider: RankingBucket[]
  recent: Array<{
    spiderName: string
    path: string
    createdAt: string
  }>
}

export type SecurityAnalysis = {
  range: {
    start: string
    end: string
  }
  series: Array<{
    action: SecurityAction
    points: Array<{
      bucket: string
      count: number
    }>
  }>
  totals: Array<{
    action: SecurityAction
    count: number
  }>
  recent: Array<{
    id: string
    action: SecurityAction
    ip: string | null
    createdAt: string
    payload: unknown
  }>
  ipSegments: Array<{
    segment: string
    count: number
  }>
}

type PagedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type AccessLogItem = {
  id: string
  path: string
  method: string
  statusCode: number
  ip: string | null
  userAgent: string | null
  responseMs: number | null
  region: string | null
  browser: string | null
  deviceType: string | null
  isSpider: boolean
  spiderName: string | null
  createdAt: string
  user: { id: string; username: string; nickname: string | null } | null
}

export type LoginLogItem = {
  id: string
  userId: string | null
  username: string | null
  ip: string
  userAgent: string | null
  deviceType: string | null
  location: string | null
  isSuccess: boolean
  reason: string | null
  createdAt: string
  user: { id: string; username: string; nickname: string | null } | null
}

export type OperationLogItem = {
  id: string
  module: string
  action: string
  resourceId: string | null
  ip: string | null
  userAgent: string | null
  payload: unknown
  createdAt: string
  user: { id: string; username: string; nickname: string | null } | null
}

type DateRangeParams = {
  days?: number
  from?: string
  to?: string
}

export type SecurityAction =
  | 'IP_BAN_HIT'
  | 'RATE_LIMIT_HIT'
  | 'MALICIOUS_REFERRER_HIT'
  | 'REDIS_HEALTH_DEGRADED'
  | 'REDIS_HEALTH_RECOVERED'

type SecurityFilterParams = DateRangeParams & {
  action?: SecurityAction
  ip?: string
}

export type LogFilterParams = DateRangeParams & {
  page?: number
  pageSize?: number
  keyword?: string
  method?: string
  statusCode?: number
  isSpider?: boolean
  isSuccess?: boolean
  module?: string
  action?: string
  ip?: string
}

export type SecurityExportHistoryItem = {
  id: string
  filename: string
  action: string
  ip: string | null
  createdAt: string
  payload: unknown
  user: { id: string; username: string; nickname: string | null } | null
}

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&')
  return query.length > 0 ? `?${query}` : ''
}

export function fetchStatsOverview() {
  return httpRequest<StatsOverview>('/stats/overview')
}

export function fetchTraffic(params: DateRangeParams & { granularity?: 'day' | 'week' | 'month' } = {}) {
  return httpRequest<TrafficResult>(
    `/stats/traffic${toQuery({
      days: params.days,
      from: params.from,
      to: params.to,
      granularity: params.granularity,
    })}`,
  )
}

export function fetchContentRanking(limit = 10) {
  return httpRequest<ContentRanking>(`/stats/content-ranking?limit=${limit}`)
}

export function fetchVisitorAnalysis(params: DateRangeParams = {}) {
  return httpRequest<VisitorAnalysis>(
    `/stats/visitor-analysis${toQuery({ days: params.days, from: params.from, to: params.to })}`,
  )
}

export function fetchSpiderAnalysis(params: DateRangeParams = {}) {
  return httpRequest<SpiderAnalysis>(
    `/stats/spider-analysis${toQuery({ days: params.days, from: params.from, to: params.to })}`,
  )
}

export function fetchSecurityAnalysis(params: SecurityFilterParams = {}) {
  return httpRequest<SecurityAnalysis>(
    `/stats/security-analysis${toQuery({
      days: params.days,
      from: params.from,
      to: params.to,
      action: params.action,
      ip: params.ip,
    })}`,
  )
}

export function exportSecurityAnalysisCsv(params: SecurityFilterParams = {}) {
  return downloadCsv('/stats/security-analysis/export', 'security-events', params)
}

export function fetchSecurityExportHistory(
  params: DateRangeParams & {
    page?: number
    pageSize?: number
    keyword?: string
    action?: 'SECURITY_ANALYSIS_EXPORT' | 'SECURITY_EXPORT_HISTORY_EXPORT'
    ip?: string
    minCount?: number
    maxCount?: number
  } = {},
) {
  return httpRequest<PagedResult<SecurityExportHistoryItem>>(
    `/stats/security-analysis/export-history${toQuery({
      page: params.page,
      pageSize: params.pageSize,
      days: params.days,
      from: params.from,
      to: params.to,
      keyword: params.keyword,
      action: params.action,
      ip: params.ip,
      minCount: params.minCount,
      maxCount: params.maxCount,
    })}`,
  )
}

export function exportSecurityExportHistoryCsv(
  params: DateRangeParams & {
    keyword?: string
    action?: 'SECURITY_ANALYSIS_EXPORT' | 'SECURITY_EXPORT_HISTORY_EXPORT'
    ip?: string
    minCount?: number
    maxCount?: number
  } = {},
) {
  return downloadCsv('/stats/security-analysis/export-history/export', 'security-export-history', params)
}

export function fetchAccessLogs(params: LogFilterParams = {}) {
  return httpRequest<PagedResult<AccessLogItem>>(
    `/stats/logs/access${toQuery({
      page: params.page,
      pageSize: params.pageSize,
      days: params.days,
      from: params.from,
      to: params.to,
      keyword: params.keyword,
      method: params.method,
      statusCode: params.statusCode,
      isSpider: params.isSpider,
    })}`,
  )
}

export function fetchLoginLogs(params: LogFilterParams = {}) {
  return httpRequest<PagedResult<LoginLogItem>>(
    `/stats/logs/login${toQuery({
      page: params.page,
      pageSize: params.pageSize,
      days: params.days,
      from: params.from,
      to: params.to,
      keyword: params.keyword,
      isSuccess: params.isSuccess,
    })}`,
  )
}

export function fetchOperationLogs(params: LogFilterParams = {}) {
  return httpRequest<PagedResult<OperationLogItem>>(
    `/stats/logs/operation${toQuery({
      page: params.page,
      pageSize: params.pageSize,
      days: params.days,
      from: params.from,
      to: params.to,
      keyword: params.keyword,
      module: params.module,
      action: params.action,
    })}`,
  )
}

function buildExportUrl(path: string, params: LogFilterParams) {
  return `${path}${toQuery({
    days: params.days,
    from: params.from,
    to: params.to,
    keyword: params.keyword,
    method: params.method,
    statusCode: params.statusCode,
    isSpider: params.isSpider,
    isSuccess: params.isSuccess,
    module: params.module,
    action: params.action,
    ip: params.ip,
  })}`
}

async function downloadCsv(path: string, filenamePrefix: string, params: LogFilterParams) {
  const token = window.localStorage.getItem('enterprise_blog_access_token')
  const response = await fetch(`${apiBaseUrl}${buildExportUrl(path, params)}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new HttpError('Export failed', response.status, response.status)
  }

  const blob = await response.blob()
  const now = new Date()
  const fileName = `${filenamePrefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.csv`
  const href = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(href)
}

export function exportAccessLogsCsv(params: LogFilterParams = {}) {
  return downloadCsv('/stats/logs/access/export', 'access-logs', params)
}

export function exportLoginLogsCsv(params: LogFilterParams = {}) {
  return downloadCsv('/stats/logs/login/export', 'login-logs', params)
}

export function exportOperationLogsCsv(params: LogFilterParams = {}) {
  return downloadCsv('/stats/logs/operation/export', 'operation-logs', params)
}
