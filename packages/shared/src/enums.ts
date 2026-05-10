export const roleCodes = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'VISITOR'] as const
export type RoleCode = (typeof roleCodes)[number]

export const articleStatuses = ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'] as const
export type ArticleStatus = (typeof articleStatuses)[number]

export const contentVisibilities = ['PUBLIC', 'FOLLOWER', 'LOGGED_IN', 'PRIVATE', 'PASSWORD'] as const
export type ContentVisibility = (typeof contentVisibilities)[number]

export const articleOrigins = ['ORIGINAL', 'REPRINT', 'TRANSLATION'] as const
export type ArticleOrigin = (typeof articleOrigins)[number]

export const reviewStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const
export type ReviewStatus = (typeof reviewStatuses)[number]

export const notificationChannels = ['IN_APP', 'EMAIL'] as const
export type NotificationChannel = (typeof notificationChannels)[number]

export const assetTypes = ['IMAGE', 'AUDIO', 'VIDEO', 'FILE'] as const
export type AssetType = (typeof assetTypes)[number]
