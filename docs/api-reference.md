# API Reference (Generated from Controllers)

- Prefix: `/api/v1`
- Generated At: `2026-05-10T21:45:23.273Z`
- Total Endpoints: **173**

## Response Contract

- Success: `{"success":true,"code":0,"message":"ok","data":...,"timestamp":...}`
- Error: `{"success":false,"code":httpStatus,"message":"...","path":"...","timestamp":...}`

## Auth Contract

- `PUBLIC`: anonymous access allowed (JWT optional).
- `JWT`: requires authenticated user.
- `ROLES`: requires authenticated user and one of roles in `Roles` column.

## Endpoint Matrix

| Module | Method | Path | Access | Roles | Handler | Source |
| --- | --- | --- | --- | --- | --- | --- |
| announcements | GET | `/api/v1/announcements` | PUBLIC | - | `listPublic` | `D:/workspaces/enterprise-blog/apps/api/src/modules/announcements/announcements.controller.ts` |
| announcements | GET | `/api/v1/announcements/admin/list` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `listAdmin` | `D:/workspaces/enterprise-blog/apps/api/src/modules/announcements/announcements.controller.ts` |
| announcements | POST | `/api/v1/announcements` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `create` | `D:/workspaces/enterprise-blog/apps/api/src/modules/announcements/announcements.controller.ts` |
| announcements | PATCH | `/api/v1/announcements/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `update` | `D:/workspaces/enterprise-blog/apps/api/src/modules/announcements/announcements.controller.ts` |
| announcements | DELETE | `/api/v1/announcements/:id` | ROLES | SUPER_ADMIN, ADMIN | `remove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/announcements/announcements.controller.ts` |
| articles | POST | `/api/v1/articles` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `create` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | PATCH | `/api/v1/articles/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `update` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/:id/draft` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `saveDraft` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/:id/schedule` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `schedule` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/:id/publish` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `publish` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | GET | `/api/v1/articles` | PUBLIC | - | `list` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | GET | `/api/v1/articles/hot` | PUBLIC | - | `hot` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | GET | `/api/v1/articles/archive` | PUBLIC | - | `archive` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | DELETE | `/api/v1/articles/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `remove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/batch/delete` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `batchDelete` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/batch/pinned` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `batchPinned` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/batch/recommended` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `batchRecommended` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/batch/move-category` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `batchMoveCategory` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/batch/status` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `batchStatus` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/batch/move-series` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `batchMoveSeries` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/batch/visibility` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `batchVisibility` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/:id/assign` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `assign` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | GET | `/api/v1/articles/assignments/list` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `assignments` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | POST | `/api/v1/articles/:slug/access` | PUBLIC | - | `accessWithPassword` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| articles | GET | `/api/v1/articles/:slug` | PUBLIC | - | `detail` | `D:/workspaces/enterprise-blog/apps/api/src/modules/articles/articles.controller.ts` |
| auth | POST | `/api/v1/auth/register` | PUBLIC | - | `register` | `D:/workspaces/enterprise-blog/apps/api/src/modules/auth/auth.controller.ts` |
| auth | POST | `/api/v1/auth/login` | PUBLIC | - | `login` | `D:/workspaces/enterprise-blog/apps/api/src/modules/auth/auth.controller.ts` |
| auth | GET | `/api/v1/auth/captcha` | PUBLIC | - | `captcha` | `D:/workspaces/enterprise-blog/apps/api/src/modules/auth/auth.controller.ts` |
| auth | GET | `/api/v1/auth/me` | JWT | - | `me` | `D:/workspaces/enterprise-blog/apps/api/src/modules/auth/auth.controller.ts` |
| categories | GET | `/api/v1/categories` | JWT | - | `list` | `D:/workspaces/enterprise-blog/apps/api/src/modules/categories/categories.controller.ts` |
| categories | POST | `/api/v1/categories` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `create` | `D:/workspaces/enterprise-blog/apps/api/src/modules/categories/categories.controller.ts` |
| categories | PATCH | `/api/v1/categories/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `update` | `D:/workspaces/enterprise-blog/apps/api/src/modules/categories/categories.controller.ts` |
| categories | DELETE | `/api/v1/categories/:id` | ROLES | SUPER_ADMIN, ADMIN | `remove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/categories/categories.controller.ts` |
| comments | GET | `/api/v1/comments/policy` | PUBLIC | - | `getPublicPolicy` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | GET | `/api/v1/comments/captcha` | PUBLIC | - | `getCaptcha` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | GET | `/api/v1/articles/:articleId/comments` | PUBLIC | - | `listArticleComments` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | POST | `/api/v1/articles/:articleId/comments` | PUBLIC | - | `createArticleComment` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | POST | `/api/v1/comments/:id/like` | PUBLIC | - | `likeComment` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | POST | `/api/v1/comments/:id/dislike` | PUBLIC | - | `dislikeComment` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | POST | `/api/v1/comments/:id/report` | PUBLIC | - | `reportComment` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | GET | `/api/v1/admin/comments/pending` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `listPending` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | PATCH | `/api/v1/admin/comments/:id/review` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `reviewComment` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | GET | `/api/v1/admin/comments/policy` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `getPolicy` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | GET | `/api/v1/admin/comments/blocked-users` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `listBlockedUsers` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | POST | `/api/v1/admin/comments/blocked-users/:userId` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `blockUser` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | POST | `/api/v1/admin/comments/blocked-users/:userId/unblock` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `unblockUser` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| comments | PATCH | `/api/v1/admin/comments/policy` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `updatePolicy` | `D:/workspaces/enterprise-blog/apps/api/src/modules/comments/comments.controller.ts` |
| friend-links | GET | `/api/v1/friend-links` | PUBLIC | - | `listPublic` | `D:/workspaces/enterprise-blog/apps/api/src/modules/friend-links/friend-links.controller.ts` |
| friend-links | POST | `/api/v1/friend-links/apply` | PUBLIC | - | `apply` | `D:/workspaces/enterprise-blog/apps/api/src/modules/friend-links/friend-links.controller.ts` |
| friend-links | GET | `/api/v1/friend-links/admin/list` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `listAdmin` | `D:/workspaces/enterprise-blog/apps/api/src/modules/friend-links/friend-links.controller.ts` |
| friend-links | POST | `/api/v1/friend-links` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `create` | `D:/workspaces/enterprise-blog/apps/api/src/modules/friend-links/friend-links.controller.ts` |
| friend-links | PATCH | `/api/v1/friend-links/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `update` | `D:/workspaces/enterprise-blog/apps/api/src/modules/friend-links/friend-links.controller.ts` |
| friend-links | PATCH | `/api/v1/friend-links/admin/:id/review` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `review` | `D:/workspaces/enterprise-blog/apps/api/src/modules/friend-links/friend-links.controller.ts` |
| friend-links | PATCH | `/api/v1/friend-links/admin/batch/review` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `batchReview` | `D:/workspaces/enterprise-blog/apps/api/src/modules/friend-links/friend-links.controller.ts` |
| friend-links | PATCH | `/api/v1/friend-links/admin/reorder` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `reorder` | `D:/workspaces/enterprise-blog/apps/api/src/modules/friend-links/friend-links.controller.ts` |
| friend-links | DELETE | `/api/v1/friend-links/:id` | ROLES | SUPER_ADMIN, ADMIN | `remove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/friend-links/friend-links.controller.ts` |
| health | GET | `/api/v1/health` | PUBLIC | - | `check` | `D:/workspaces/enterprise-blog/apps/api/src/modules/health/health.controller.ts` |
| media | GET | `/api/v1/media/assets` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `listAssets` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | GET | `/api/v1/media/assets/public` | PUBLIC | - | `listPublicAssets` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | POST | `/api/v1/media/assets` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `createAsset` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | POST | `/api/v1/media/assets/upload-local` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `uploadLocalAssets` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | POST | `/api/v1/media/assets/upload-plan` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `createUploadPlan` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | DELETE | `/api/v1/media/assets/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `removeAsset` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | GET | `/api/v1/media/albums` | PUBLIC | - | `listAlbums` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | POST | `/api/v1/media/albums` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `createAlbum` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | POST | `/api/v1/media/albums/:id/items` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `attachAlbumItem` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | DELETE | `/api/v1/media/albums/items/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `detachAlbumItem` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | GET | `/api/v1/media/resources` | PUBLIC | - | `listResources` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | POST | `/api/v1/media/resources` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `createResource` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | POST | `/api/v1/media/resources/:id/download` | PUBLIC | - | `download` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | DELETE | `/api/v1/media/resources/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `removeResource` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | GET | `/api/v1/media/articles/:articleId/attachments` | PUBLIC | - | `listArticleAssets` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | POST | `/api/v1/media/articles/attachments` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `attachArticleAsset` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| media | DELETE | `/api/v1/media/articles/attachments/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `detachArticleAsset` | `D:/workspaces/enterprise-blog/apps/api/src/modules/media/media.controller.ts` |
| message-board | GET | `/api/v1/message-board` | PUBLIC | - | `listPublic` | `D:/workspaces/enterprise-blog/apps/api/src/modules/message-board/message-board.controller.ts` |
| message-board | POST | `/api/v1/message-board` | PUBLIC | - | `create` | `D:/workspaces/enterprise-blog/apps/api/src/modules/message-board/message-board.controller.ts` |
| message-board | GET | `/api/v1/message-board/admin/list` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `listAdmin` | `D:/workspaces/enterprise-blog/apps/api/src/modules/message-board/message-board.controller.ts` |
| message-board | PATCH | `/api/v1/message-board/admin/:id/review` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `review` | `D:/workspaces/enterprise-blog/apps/api/src/modules/message-board/message-board.controller.ts` |
| message-board | PATCH | `/api/v1/message-board/admin/batch/review` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `batchReview` | `D:/workspaces/enterprise-blog/apps/api/src/modules/message-board/message-board.controller.ts` |
| message-board | DELETE | `/api/v1/message-board/admin/:id` | ROLES | SUPER_ADMIN, ADMIN | `remove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/message-board/message-board.controller.ts` |
| message-board | PATCH | `/api/v1/message-board/admin/batch/remove` | ROLES | SUPER_ADMIN, ADMIN | `batchRemove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/message-board/message-board.controller.ts` |
| moments | GET | `/api/v1/moments` | PUBLIC | - | `list` | `D:/workspaces/enterprise-blog/apps/api/src/modules/moments/moments.controller.ts` |
| moments | GET | `/api/v1/moments/timeline` | PUBLIC | - | `timeline` | `D:/workspaces/enterprise-blog/apps/api/src/modules/moments/moments.controller.ts` |
| moments | GET | `/api/v1/moments/:slug` | PUBLIC | - | `detail` | `D:/workspaces/enterprise-blog/apps/api/src/modules/moments/moments.controller.ts` |
| moments | POST | `/api/v1/moments` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `create` | `D:/workspaces/enterprise-blog/apps/api/src/modules/moments/moments.controller.ts` |
| moments | PATCH | `/api/v1/moments/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `update` | `D:/workspaces/enterprise-blog/apps/api/src/modules/moments/moments.controller.ts` |
| moments | DELETE | `/api/v1/moments/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR, AUTHOR | `remove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/moments/moments.controller.ts` |
| notifications | GET | `/api/v1/notifications/me` | JWT | - | `listMine` | `D:/workspaces/enterprise-blog/apps/api/src/modules/notifications/notifications.controller.ts` |
| notifications | PATCH | `/api/v1/notifications/me/read` | JWT | - | `markRead` | `D:/workspaces/enterprise-blog/apps/api/src/modules/notifications/notifications.controller.ts` |
| notifications | PATCH | `/api/v1/notifications/me/read-all` | JWT | - | `markAllRead` | `D:/workspaces/enterprise-blog/apps/api/src/modules/notifications/notifications.controller.ts` |
| notifications | GET | `/api/v1/notifications/admin/list` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `adminList` | `D:/workspaces/enterprise-blog/apps/api/src/modules/notifications/notifications.controller.ts` |
| notifications | GET | `/api/v1/notifications/admin/email-logs` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `adminEmailLogs` | `D:/workspaces/enterprise-blog/apps/api/src/modules/notifications/notifications.controller.ts` |
| ops | POST | `/api/v1/ops/cache/clear` | ROLES | SUPER_ADMIN, ADMIN | `clearCache` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | POST | `/api/v1/ops/static/generate` | ROLES | SUPER_ADMIN, ADMIN | `generateStatic` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | GET | `/api/v1/ops/static/tasks` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `listStaticTasks` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | GET | `/api/v1/ops/static/artifacts` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `listStaticArtifacts` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | POST | `/api/v1/ops/backup` | ROLES | SUPER_ADMIN, ADMIN | `backup` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | POST | `/api/v1/ops/restore` | ROLES | SUPER_ADMIN, ADMIN | `restore` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | POST | `/api/v1/ops/restore/precheck` | ROLES | SUPER_ADMIN, ADMIN | `restorePrecheck` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | POST | `/api/v1/ops/migrate` | ROLES | SUPER_ADMIN, ADMIN | `migrate` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | POST | `/api/v1/ops/migrate/precheck` | ROLES | SUPER_ADMIN, ADMIN | `migratePrecheck` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | GET | `/api/v1/ops/backup/tasks` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `backupTasks` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | GET | `/api/v1/ops/approval-records` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `approvalRecords` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | GET | `/api/v1/ops/site/profile` | PUBLIC | - | `getSiteProfile` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| ops | PATCH | `/api/v1/ops/site/profile` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `updateSiteProfile` | `D:/workspaces/enterprise-blog/apps/api/src/modules/ops/ops.controller.ts` |
| pages | GET | `/api/v1/pages` | PUBLIC | - | `list` | `D:/workspaces/enterprise-blog/apps/api/src/modules/pages/pages.controller.ts` |
| pages | GET | `/api/v1/pages/:slug` | PUBLIC | - | `detail` | `D:/workspaces/enterprise-blog/apps/api/src/modules/pages/pages.controller.ts` |
| pages | POST | `/api/v1/pages` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `create` | `D:/workspaces/enterprise-blog/apps/api/src/modules/pages/pages.controller.ts` |
| pages | PATCH | `/api/v1/pages/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `update` | `D:/workspaces/enterprise-blog/apps/api/src/modules/pages/pages.controller.ts` |
| pages | DELETE | `/api/v1/pages/:id` | ROLES | SUPER_ADMIN, ADMIN | `remove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/pages/pages.controller.ts` |
| roles | GET | `/api/v1/roles` | ROLES | SUPER_ADMIN, ADMIN | `listRoles` | `D:/workspaces/enterprise-blog/apps/api/src/modules/roles/roles.controller.ts` |
| security | GET | `/api/v1/security/ip-bans` | ROLES | SUPER_ADMIN, ADMIN | `listIpBans` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | POST | `/api/v1/security/ip-bans` | ROLES | SUPER_ADMIN, ADMIN | `createIpBan` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | DELETE | `/api/v1/security/ip-bans/:id` | ROLES | SUPER_ADMIN, ADMIN | `removeIpBan` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | GET | `/api/v1/security/keyword-bans` | ROLES | SUPER_ADMIN, ADMIN | `listKeywordBans` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | POST | `/api/v1/security/keyword-bans` | ROLES | SUPER_ADMIN, ADMIN | `createKeywordBan` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | DELETE | `/api/v1/security/keyword-bans/:id` | ROLES | SUPER_ADMIN, ADMIN | `removeKeywordBan` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | GET | `/api/v1/security/blocked-domains` | ROLES | SUPER_ADMIN, ADMIN | `listBlockedDomains` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | POST | `/api/v1/security/blocked-domains` | ROLES | SUPER_ADMIN, ADMIN | `addBlockedDomain` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | DELETE | `/api/v1/security/blocked-domains/:domain` | ROLES | SUPER_ADMIN, ADMIN | `removeBlockedDomain` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | GET | `/api/v1/security/redis/health` | ROLES | SUPER_ADMIN, ADMIN | `redisHealth` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | GET | `/api/v1/security/redis/sla` | ROLES | SUPER_ADMIN, ADMIN | `redisSla` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | GET | `/api/v1/security/redis/sla/trend` | ROLES | SUPER_ADMIN, ADMIN | `redisSlaTrend` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | POST | `/api/v1/security/geoip/update` | ROLES | SUPER_ADMIN, ADMIN | `geoipUpdate` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | POST | `/api/v1/security/geoip/reload` | ROLES | SUPER_ADMIN, ADMIN | `geoipReload` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | POST | `/api/v1/security/geoip/validate` | ROLES | SUPER_ADMIN, ADMIN | `geoipValidate` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | GET | `/api/v1/security/geoip/status` | ROLES | SUPER_ADMIN, ADMIN | `geoipStatus` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| security | GET | `/api/v1/security/geoip/validation-history` | ROLES | SUPER_ADMIN, ADMIN | `geoipValidationHistory` | `D:/workspaces/enterprise-blog/apps/api/src/modules/security/security.controller.ts` |
| sensitive-words | GET | `/api/v1/sensitive-words` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `list` | `D:/workspaces/enterprise-blog/apps/api/src/modules/sensitive-words/sensitive-words.controller.ts` |
| sensitive-words | POST | `/api/v1/sensitive-words` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `create` | `D:/workspaces/enterprise-blog/apps/api/src/modules/sensitive-words/sensitive-words.controller.ts` |
| sensitive-words | PATCH | `/api/v1/sensitive-words/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `update` | `D:/workspaces/enterprise-blog/apps/api/src/modules/sensitive-words/sensitive-words.controller.ts` |
| sensitive-words | DELETE | `/api/v1/sensitive-words/:id` | ROLES | SUPER_ADMIN, ADMIN | `remove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/sensitive-words/sensitive-words.controller.ts` |
| series | GET | `/api/v1/series` | JWT | - | `list` | `D:/workspaces/enterprise-blog/apps/api/src/modules/series/series.controller.ts` |
| series | POST | `/api/v1/series` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `create` | `D:/workspaces/enterprise-blog/apps/api/src/modules/series/series.controller.ts` |
| series | PATCH | `/api/v1/series/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `update` | `D:/workspaces/enterprise-blog/apps/api/src/modules/series/series.controller.ts` |
| series | DELETE | `/api/v1/series/:id` | ROLES | SUPER_ADMIN, ADMIN | `remove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/series/series.controller.ts` |
| site-configs | GET | `/api/v1/site-configs` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `list` | `D:/workspaces/enterprise-blog/apps/api/src/modules/site-configs/site-configs.controller.ts` |
| site-configs | GET | `/api/v1/site-configs/public/nav` | PUBLIC | - | `getPublicNav` | `D:/workspaces/enterprise-blog/apps/api/src/modules/site-configs/site-configs.controller.ts` |
| site-configs | GET | `/api/v1/site-configs/public/side-nav` | PUBLIC | - | `getPublicSideNav` | `D:/workspaces/enterprise-blog/apps/api/src/modules/site-configs/site-configs.controller.ts` |
| site-configs | GET | `/api/v1/site-configs/public/appearance` | PUBLIC | - | `getPublicAppearance` | `D:/workspaces/enterprise-blog/apps/api/src/modules/site-configs/site-configs.controller.ts` |
| site-configs | GET | `/api/v1/site-configs/:key` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `getByKey` | `D:/workspaces/enterprise-blog/apps/api/src/modules/site-configs/site-configs.controller.ts` |
| site-configs | POST | `/api/v1/site-configs` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `upsert` | `D:/workspaces/enterprise-blog/apps/api/src/modules/site-configs/site-configs.controller.ts` |
| site-configs | POST | `/api/v1/site-configs/nav` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `upsertNav` | `D:/workspaces/enterprise-blog/apps/api/src/modules/site-configs/site-configs.controller.ts` |
| site-configs | POST | `/api/v1/site-configs/side-nav` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `upsertSideNav` | `D:/workspaces/enterprise-blog/apps/api/src/modules/site-configs/site-configs.controller.ts` |
| site-configs | POST | `/api/v1/site-configs/appearance` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `upsertAppearance` | `D:/workspaces/enterprise-blog/apps/api/src/modules/site-configs/site-configs.controller.ts` |
| stats | GET | `/api/v1/stats/overview` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `overview` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/traffic` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `traffic` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/content-ranking` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `contentRanking` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/visitor-analysis` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `visitorAnalysis` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/spider-analysis` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `spiderAnalysis` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/security-analysis` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `securityAnalysis` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/security-analysis/export` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `exportSecurityAnalysis` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/security-analysis/export-history` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `securityExportHistory` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/security-analysis/export-history/export` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `exportSecurityExportHistory` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/logs/access` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `accessLogs` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/logs/access/export` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `exportAccessLogs` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/logs/login` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `loginLogs` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/logs/login/export` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `exportLoginLogs` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/logs/operation` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `operationLogs` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| stats | GET | `/api/v1/stats/logs/operation/export` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `exportOperationLogs` | `D:/workspaces/enterprise-blog/apps/api/src/modules/stats/stats.controller.ts` |
| system | GET | `/api/v1/system/meta` | PUBLIC | - | `getMeta` | `D:/workspaces/enterprise-blog/apps/api/src/modules/system/system.controller.ts` |
| tags | GET | `/api/v1/tags` | PUBLIC | - | `list` | `D:/workspaces/enterprise-blog/apps/api/src/modules/tags/tags.controller.ts` |
| tags | GET | `/api/v1/tags/aggregate` | PUBLIC | - | `aggregate` | `D:/workspaces/enterprise-blog/apps/api/src/modules/tags/tags.controller.ts` |
| tags | POST | `/api/v1/tags` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `create` | `D:/workspaces/enterprise-blog/apps/api/src/modules/tags/tags.controller.ts` |
| tags | PATCH | `/api/v1/tags/:id` | ROLES | SUPER_ADMIN, ADMIN, EDITOR | `update` | `D:/workspaces/enterprise-blog/apps/api/src/modules/tags/tags.controller.ts` |
| tags | DELETE | `/api/v1/tags/:id` | ROLES | SUPER_ADMIN, ADMIN | `remove` | `D:/workspaces/enterprise-blog/apps/api/src/modules/tags/tags.controller.ts` |
| users | GET | `/api/v1/users/me` | PUBLIC | - | `getMyProfile` | `D:/workspaces/enterprise-blog/apps/api/src/modules/users/users.controller.ts` |
| users | PATCH | `/api/v1/users/me` | JWT | - | `updateMyProfile` | `D:/workspaces/enterprise-blog/apps/api/src/modules/users/users.controller.ts` |
| users | GET | `/api/v1/users/:id` | PUBLIC | - | `getUserProfile` | `D:/workspaces/enterprise-blog/apps/api/src/modules/users/users.controller.ts` |
| users | GET | `/api/v1/users/:id/followers` | PUBLIC | - | `getFollowers` | `D:/workspaces/enterprise-blog/apps/api/src/modules/users/users.controller.ts` |
| users | GET | `/api/v1/users/:id/following` | PUBLIC | - | `getFollowing` | `D:/workspaces/enterprise-blog/apps/api/src/modules/users/users.controller.ts` |
| users | POST | `/api/v1/users/:id/follow` | JWT | - | `follow` | `D:/workspaces/enterprise-blog/apps/api/src/modules/users/users.controller.ts` |
| users | DELETE | `/api/v1/users/:id/follow` | JWT | - | `unfollow` | `D:/workspaces/enterprise-blog/apps/api/src/modules/users/users.controller.ts` |

## Module Summary

- announcements: 5 endpoints
- articles: 20 endpoints
- auth: 4 endpoints
- categories: 4 endpoints
- comments: 14 endpoints
- friend-links: 9 endpoints
- health: 1 endpoints
- media: 17 endpoints
- message-board: 7 endpoints
- moments: 6 endpoints
- notifications: 5 endpoints
- ops: 13 endpoints
- pages: 5 endpoints
- roles: 1 endpoints
- security: 17 endpoints
- sensitive-words: 4 endpoints
- series: 4 endpoints
- site-configs: 9 endpoints
- stats: 15 endpoints
- system: 1 endpoints
- tags: 5 endpoints
- users: 7 endpoints