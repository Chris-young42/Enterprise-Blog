export const workspacePackages = {
  web: '@enterprise-blog/web',
  api: '@enterprise-blog/api',
  shared: '@enterprise-blog/shared',
  ui: '@enterprise-blog/ui',
  config: '@enterprise-blog/config',
} as const

export const appRoutePrefixes = {
  web: '/',
  api: '/api/v1',
} as const

export const defaultPageSize = 20
