# Full API Endpoints (Source of Truth)

- Prefix: `/api/v1`
- Generated at: 2026-05-10T21:43:51.980Z
- Total endpoints: 173

## Quick List

### announcements
- GET `/api/v1/announcements`
- GET `/api/v1/announcements/admin/list`
- POST `/api/v1/announcements`
- PATCH `/api/v1/announcements/:id`
- DELETE `/api/v1/announcements/:id`

### articles
- POST `/api/v1/articles`
- PATCH `/api/v1/articles/:id`
- POST `/api/v1/articles/:id/draft`
- POST `/api/v1/articles/:id/schedule`
- POST `/api/v1/articles/:id/publish`
- GET `/api/v1/articles`
- GET `/api/v1/articles/hot`
- GET `/api/v1/articles/archive`
- DELETE `/api/v1/articles/:id`
- POST `/api/v1/articles/batch/delete`
- POST `/api/v1/articles/batch/pinned`
- POST `/api/v1/articles/batch/recommended`
- POST `/api/v1/articles/batch/move-category`
- POST `/api/v1/articles/batch/status`
- POST `/api/v1/articles/batch/move-series`
- POST `/api/v1/articles/batch/visibility`
- POST `/api/v1/articles/:id/assign`
- GET `/api/v1/articles/assignments/list`
- POST `/api/v1/articles/:slug/access`
- GET `/api/v1/articles/:slug`

### auth
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- GET `/api/v1/auth/captcha`
- GET `/api/v1/auth/me`

### categories
- GET `/api/v1/categories`
- POST `/api/v1/categories`
- PATCH `/api/v1/categories/:id`
- DELETE `/api/v1/categories/:id`

### comments
- GET `/api/v1/comments/policy`
- GET `/api/v1/comments/captcha`
- GET `/api/v1/articles/:articleId/comments`
- POST `/api/v1/articles/:articleId/comments`
- POST `/api/v1/comments/:id/like`
- POST `/api/v1/comments/:id/dislike`
- POST `/api/v1/comments/:id/report`
- GET `/api/v1/admin/comments/pending`
- PATCH `/api/v1/admin/comments/:id/review`
- GET `/api/v1/admin/comments/policy`
- GET `/api/v1/admin/comments/blocked-users`
- POST `/api/v1/admin/comments/blocked-users/:userId`
- POST `/api/v1/admin/comments/blocked-users/:userId/unblock`
- PATCH `/api/v1/admin/comments/policy`

### friend-links
- GET `/api/v1/friend-links`
- POST `/api/v1/friend-links/apply`
- GET `/api/v1/friend-links/admin/list`
- POST `/api/v1/friend-links`
- PATCH `/api/v1/friend-links/:id`
- PATCH `/api/v1/friend-links/admin/:id/review`
- PATCH `/api/v1/friend-links/admin/batch/review`
- PATCH `/api/v1/friend-links/admin/reorder`
- DELETE `/api/v1/friend-links/:id`

### health
- GET `/api/v1/health`

### media
- GET `/api/v1/media/assets`
- GET `/api/v1/media/assets/public`
- POST `/api/v1/media/assets`
- POST `/api/v1/media/assets/upload-local`
- POST `/api/v1/media/assets/upload-plan`
- DELETE `/api/v1/media/assets/:id`
- GET `/api/v1/media/albums`
- POST `/api/v1/media/albums`
- POST `/api/v1/media/albums/:id/items`
- DELETE `/api/v1/media/albums/items/:id`
- GET `/api/v1/media/resources`
- POST `/api/v1/media/resources`
- POST `/api/v1/media/resources/:id/download`
- DELETE `/api/v1/media/resources/:id`
- GET `/api/v1/media/articles/:articleId/attachments`
- POST `/api/v1/media/articles/attachments`
- DELETE `/api/v1/media/articles/attachments/:id`

### message-board
- GET `/api/v1/message-board`
- POST `/api/v1/message-board`
- GET `/api/v1/message-board/admin/list`
- PATCH `/api/v1/message-board/admin/:id/review`
- PATCH `/api/v1/message-board/admin/batch/review`
- DELETE `/api/v1/message-board/admin/:id`
- PATCH `/api/v1/message-board/admin/batch/remove`

### moments
- GET `/api/v1/moments`
- GET `/api/v1/moments/timeline`
- GET `/api/v1/moments/:slug`
- POST `/api/v1/moments`
- PATCH `/api/v1/moments/:id`
- DELETE `/api/v1/moments/:id`

### notifications
- GET `/api/v1/notifications/me`
- PATCH `/api/v1/notifications/me/read`
- PATCH `/api/v1/notifications/me/read-all`
- GET `/api/v1/notifications/admin/list`
- GET `/api/v1/notifications/admin/email-logs`

### ops
- POST `/api/v1/ops/cache/clear`
- POST `/api/v1/ops/static/generate`
- GET `/api/v1/ops/static/tasks`
- GET `/api/v1/ops/static/artifacts`
- POST `/api/v1/ops/backup`
- POST `/api/v1/ops/restore`
- POST `/api/v1/ops/restore/precheck`
- POST `/api/v1/ops/migrate`
- POST `/api/v1/ops/migrate/precheck`
- GET `/api/v1/ops/backup/tasks`
- GET `/api/v1/ops/approval-records`
- GET `/api/v1/ops/site/profile`
- PATCH `/api/v1/ops/site/profile`

### pages
- GET `/api/v1/pages`
- GET `/api/v1/pages/:slug`
- POST `/api/v1/pages`
- PATCH `/api/v1/pages/:id`
- DELETE `/api/v1/pages/:id`

### roles
- GET `/api/v1/roles`

### security
- GET `/api/v1/security/ip-bans`
- POST `/api/v1/security/ip-bans`
- DELETE `/api/v1/security/ip-bans/:id`
- GET `/api/v1/security/keyword-bans`
- POST `/api/v1/security/keyword-bans`
- DELETE `/api/v1/security/keyword-bans/:id`
- GET `/api/v1/security/blocked-domains`
- POST `/api/v1/security/blocked-domains`
- DELETE `/api/v1/security/blocked-domains/:domain`
- GET `/api/v1/security/redis/health`
- GET `/api/v1/security/redis/sla`
- GET `/api/v1/security/redis/sla/trend`
- POST `/api/v1/security/geoip/update`
- POST `/api/v1/security/geoip/reload`
- POST `/api/v1/security/geoip/validate`
- GET `/api/v1/security/geoip/status`
- GET `/api/v1/security/geoip/validation-history`

### sensitive-words
- GET `/api/v1/sensitive-words`
- POST `/api/v1/sensitive-words`
- PATCH `/api/v1/sensitive-words/:id`
- DELETE `/api/v1/sensitive-words/:id`

### series
- GET `/api/v1/series`
- POST `/api/v1/series`
- PATCH `/api/v1/series/:id`
- DELETE `/api/v1/series/:id`

### site-configs
- GET `/api/v1/site-configs`
- GET `/api/v1/site-configs/public/nav`
- GET `/api/v1/site-configs/public/side-nav`
- GET `/api/v1/site-configs/public/appearance`
- GET `/api/v1/site-configs/:key`
- POST `/api/v1/site-configs`
- POST `/api/v1/site-configs/nav`
- POST `/api/v1/site-configs/side-nav`
- POST `/api/v1/site-configs/appearance`

### stats
- GET `/api/v1/stats/overview`
- GET `/api/v1/stats/traffic`
- GET `/api/v1/stats/content-ranking`
- GET `/api/v1/stats/visitor-analysis`
- GET `/api/v1/stats/spider-analysis`
- GET `/api/v1/stats/security-analysis`
- GET `/api/v1/stats/security-analysis/export`
- GET `/api/v1/stats/security-analysis/export-history`
- GET `/api/v1/stats/security-analysis/export-history/export`
- GET `/api/v1/stats/logs/access`
- GET `/api/v1/stats/logs/access/export`
- GET `/api/v1/stats/logs/login`
- GET `/api/v1/stats/logs/login/export`
- GET `/api/v1/stats/logs/operation`
- GET `/api/v1/stats/logs/operation/export`

### system
- GET `/api/v1/system/meta`

### tags
- GET `/api/v1/tags`
- GET `/api/v1/tags/aggregate`
- POST `/api/v1/tags`
- PATCH `/api/v1/tags/:id`
- DELETE `/api/v1/tags/:id`

### users
- GET `/api/v1/users/me`
- PATCH `/api/v1/users/me`
- GET `/api/v1/users/:id`
- GET `/api/v1/users/:id/followers`
- GET `/api/v1/users/:id/following`
- POST `/api/v1/users/:id/follow`
- DELETE `/api/v1/users/:id/follow`

## Detailed List

### announcements
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\announcements\announcements.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/announcements` | `listPublic` |
| GET | `/api/v1/announcements/admin/list` | `listAdmin` |
| POST | `/api/v1/announcements` | `create` |
| PATCH | `/api/v1/announcements/:id` | `update` |
| DELETE | `/api/v1/announcements/:id` | `remove` |

### articles
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\articles\articles.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| POST | `/api/v1/articles` | `create` |
| PATCH | `/api/v1/articles/:id` | `update` |
| POST | `/api/v1/articles/:id/draft` | `saveDraft` |
| POST | `/api/v1/articles/:id/schedule` | `schedule` |
| POST | `/api/v1/articles/:id/publish` | `publish` |
| GET | `/api/v1/articles` | `list` |
| GET | `/api/v1/articles/hot` | `hot` |
| GET | `/api/v1/articles/archive` | `archive` |
| DELETE | `/api/v1/articles/:id` | `remove` |
| POST | `/api/v1/articles/batch/delete` | `batchDelete` |
| POST | `/api/v1/articles/batch/pinned` | `batchPinned` |
| POST | `/api/v1/articles/batch/recommended` | `batchRecommended` |
| POST | `/api/v1/articles/batch/move-category` | `batchMoveCategory` |
| POST | `/api/v1/articles/batch/status` | `batchStatus` |
| POST | `/api/v1/articles/batch/move-series` | `batchMoveSeries` |
| POST | `/api/v1/articles/batch/visibility` | `batchVisibility` |
| POST | `/api/v1/articles/:id/assign` | `assign` |
| GET | `/api/v1/articles/assignments/list` | `assignments` |
| POST | `/api/v1/articles/:slug/access` | `accessWithPassword` |
| GET | `/api/v1/articles/:slug` | `detail` |

### auth
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\auth\auth.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | `register` |
| POST | `/api/v1/auth/login` | `login` |
| GET | `/api/v1/auth/captcha` | `captcha` |
| GET | `/api/v1/auth/me` | `me` |

### categories
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\categories\categories.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/categories` | `list` |
| POST | `/api/v1/categories` | `create` |
| PATCH | `/api/v1/categories/:id` | `update` |
| DELETE | `/api/v1/categories/:id` | `remove` |

### comments
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\comments\comments.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/comments/policy` | `getPublicPolicy` |
| GET | `/api/v1/comments/captcha` | `getCaptcha` |
| GET | `/api/v1/articles/:articleId/comments` | `listArticleComments` |
| POST | `/api/v1/articles/:articleId/comments` | `createArticleComment` |
| POST | `/api/v1/comments/:id/like` | `likeComment` |
| POST | `/api/v1/comments/:id/dislike` | `dislikeComment` |
| POST | `/api/v1/comments/:id/report` | `reportComment` |
| GET | `/api/v1/admin/comments/pending` | `listPending` |
| PATCH | `/api/v1/admin/comments/:id/review` | `reviewComment` |
| GET | `/api/v1/admin/comments/policy` | `getPolicy` |
| GET | `/api/v1/admin/comments/blocked-users` | `listBlockedUsers` |
| POST | `/api/v1/admin/comments/blocked-users/:userId` | `blockUser` |
| POST | `/api/v1/admin/comments/blocked-users/:userId/unblock` | `unblockUser` |
| PATCH | `/api/v1/admin/comments/policy` | `updatePolicy` |

### friend-links
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\friend-links\friend-links.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/friend-links` | `listPublic` |
| POST | `/api/v1/friend-links/apply` | `apply` |
| GET | `/api/v1/friend-links/admin/list` | `listAdmin` |
| POST | `/api/v1/friend-links` | `create` |
| PATCH | `/api/v1/friend-links/:id` | `update` |
| PATCH | `/api/v1/friend-links/admin/:id/review` | `review` |
| PATCH | `/api/v1/friend-links/admin/batch/review` | `batchReview` |
| PATCH | `/api/v1/friend-links/admin/reorder` | `reorder` |
| DELETE | `/api/v1/friend-links/:id` | `remove` |

### health
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\health\health.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/health` | `check` |

### media
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\media\media.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/media/assets` | `listAssets` |
| GET | `/api/v1/media/assets/public` | `listPublicAssets` |
| POST | `/api/v1/media/assets` | `createAsset` |
| POST | `/api/v1/media/assets/upload-local` | `uploadLocalAssets` |
| POST | `/api/v1/media/assets/upload-plan` | `createUploadPlan` |
| DELETE | `/api/v1/media/assets/:id` | `removeAsset` |
| GET | `/api/v1/media/albums` | `listAlbums` |
| POST | `/api/v1/media/albums` | `createAlbum` |
| POST | `/api/v1/media/albums/:id/items` | `attachAlbumItem` |
| DELETE | `/api/v1/media/albums/items/:id` | `detachAlbumItem` |
| GET | `/api/v1/media/resources` | `listResources` |
| POST | `/api/v1/media/resources` | `createResource` |
| POST | `/api/v1/media/resources/:id/download` | `download` |
| DELETE | `/api/v1/media/resources/:id` | `removeResource` |
| GET | `/api/v1/media/articles/:articleId/attachments` | `listArticleAssets` |
| POST | `/api/v1/media/articles/attachments` | `attachArticleAsset` |
| DELETE | `/api/v1/media/articles/attachments/:id` | `detachArticleAsset` |

### message-board
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\message-board\message-board.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/message-board` | `listPublic` |
| POST | `/api/v1/message-board` | `create` |
| GET | `/api/v1/message-board/admin/list` | `listAdmin` |
| PATCH | `/api/v1/message-board/admin/:id/review` | `review` |
| PATCH | `/api/v1/message-board/admin/batch/review` | `batchReview` |
| DELETE | `/api/v1/message-board/admin/:id` | `remove` |
| PATCH | `/api/v1/message-board/admin/batch/remove` | `batchRemove` |

### moments
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\moments\moments.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/moments` | `list` |
| GET | `/api/v1/moments/timeline` | `timeline` |
| GET | `/api/v1/moments/:slug` | `detail` |
| POST | `/api/v1/moments` | `create` |
| PATCH | `/api/v1/moments/:id` | `update` |
| DELETE | `/api/v1/moments/:id` | `remove` |

### notifications
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\notifications\notifications.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/notifications/me` | `listMine` |
| PATCH | `/api/v1/notifications/me/read` | `markRead` |
| PATCH | `/api/v1/notifications/me/read-all` | `markAllRead` |
| GET | `/api/v1/notifications/admin/list` | `adminList` |
| GET | `/api/v1/notifications/admin/email-logs` | `adminEmailLogs` |

### ops
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\ops\ops.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| POST | `/api/v1/ops/cache/clear` | `clearCache` |
| POST | `/api/v1/ops/static/generate` | `generateStatic` |
| GET | `/api/v1/ops/static/tasks` | `listStaticTasks` |
| GET | `/api/v1/ops/static/artifacts` | `listStaticArtifacts` |
| POST | `/api/v1/ops/backup` | `backup` |
| POST | `/api/v1/ops/restore` | `restore` |
| POST | `/api/v1/ops/restore/precheck` | `restorePrecheck` |
| POST | `/api/v1/ops/migrate` | `migrate` |
| POST | `/api/v1/ops/migrate/precheck` | `migratePrecheck` |
| GET | `/api/v1/ops/backup/tasks` | `backupTasks` |
| GET | `/api/v1/ops/approval-records` | `approvalRecords` |
| GET | `/api/v1/ops/site/profile` | `getSiteProfile` |
| PATCH | `/api/v1/ops/site/profile` | `updateSiteProfile` |

### pages
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\pages\pages.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/pages` | `list` |
| GET | `/api/v1/pages/:slug` | `detail` |
| POST | `/api/v1/pages` | `create` |
| PATCH | `/api/v1/pages/:id` | `update` |
| DELETE | `/api/v1/pages/:id` | `remove` |

### roles
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\roles\roles.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/roles` | `listRoles` |

### security
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\security\security.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/security/ip-bans` | `listIpBans` |
| POST | `/api/v1/security/ip-bans` | `createIpBan` |
| DELETE | `/api/v1/security/ip-bans/:id` | `removeIpBan` |
| GET | `/api/v1/security/keyword-bans` | `listKeywordBans` |
| POST | `/api/v1/security/keyword-bans` | `createKeywordBan` |
| DELETE | `/api/v1/security/keyword-bans/:id` | `removeKeywordBan` |
| GET | `/api/v1/security/blocked-domains` | `listBlockedDomains` |
| POST | `/api/v1/security/blocked-domains` | `addBlockedDomain` |
| DELETE | `/api/v1/security/blocked-domains/:domain` | `removeBlockedDomain` |
| GET | `/api/v1/security/redis/health` | `redisHealth` |
| GET | `/api/v1/security/redis/sla` | `redisSla` |
| GET | `/api/v1/security/redis/sla/trend` | `redisSlaTrend` |
| POST | `/api/v1/security/geoip/update` | `geoipUpdate` |
| POST | `/api/v1/security/geoip/reload` | `geoipReload` |
| POST | `/api/v1/security/geoip/validate` | `geoipValidate` |
| GET | `/api/v1/security/geoip/status` | `geoipStatus` |
| GET | `/api/v1/security/geoip/validation-history` | `geoipValidationHistory` |

### sensitive-words
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\sensitive-words\sensitive-words.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/sensitive-words` | `list` |
| POST | `/api/v1/sensitive-words` | `create` |
| PATCH | `/api/v1/sensitive-words/:id` | `update` |
| DELETE | `/api/v1/sensitive-words/:id` | `remove` |

### series
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\series\series.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/series` | `list` |
| POST | `/api/v1/series` | `create` |
| PATCH | `/api/v1/series/:id` | `update` |
| DELETE | `/api/v1/series/:id` | `remove` |

### site-configs
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\site-configs\site-configs.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/site-configs` | `list` |
| GET | `/api/v1/site-configs/public/nav` | `getPublicNav` |
| GET | `/api/v1/site-configs/public/side-nav` | `getPublicSideNav` |
| GET | `/api/v1/site-configs/public/appearance` | `getPublicAppearance` |
| GET | `/api/v1/site-configs/:key` | `getByKey` |
| POST | `/api/v1/site-configs` | `upsert` |
| POST | `/api/v1/site-configs/nav` | `upsertNav` |
| POST | `/api/v1/site-configs/side-nav` | `upsertSideNav` |
| POST | `/api/v1/site-configs/appearance` | `upsertAppearance` |

### stats
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\stats\stats.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/stats/overview` | `overview` |
| GET | `/api/v1/stats/traffic` | `traffic` |
| GET | `/api/v1/stats/content-ranking` | `contentRanking` |
| GET | `/api/v1/stats/visitor-analysis` | `visitorAnalysis` |
| GET | `/api/v1/stats/spider-analysis` | `spiderAnalysis` |
| GET | `/api/v1/stats/security-analysis` | `securityAnalysis` |
| GET | `/api/v1/stats/security-analysis/export` | `exportSecurityAnalysis` |
| GET | `/api/v1/stats/security-analysis/export-history` | `securityExportHistory` |
| GET | `/api/v1/stats/security-analysis/export-history/export` | `exportSecurityExportHistory` |
| GET | `/api/v1/stats/logs/access` | `accessLogs` |
| GET | `/api/v1/stats/logs/access/export` | `exportAccessLogs` |
| GET | `/api/v1/stats/logs/login` | `loginLogs` |
| GET | `/api/v1/stats/logs/login/export` | `exportLoginLogs` |
| GET | `/api/v1/stats/logs/operation` | `operationLogs` |
| GET | `/api/v1/stats/logs/operation/export` | `exportOperationLogs` |

### system
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\system\system.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/system/meta` | `getMeta` |

### tags
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\tags\tags.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/tags` | `list` |
| GET | `/api/v1/tags/aggregate` | `aggregate` |
| POST | `/api/v1/tags` | `create` |
| PATCH | `/api/v1/tags/:id` | `update` |
| DELETE | `/api/v1/tags/:id` | `remove` |

### users
- Controller File: `D:\workspaces\enterprise-blog\apps\api\src\modules\users\users.controller.ts`
| Method | Path | Handler |
| --- | --- | --- |
| GET | `/api/v1/users/me` | `getMyProfile` |
| PATCH | `/api/v1/users/me` | `updateMyProfile` |
| GET | `/api/v1/users/:id` | `getUserProfile` |
| GET | `/api/v1/users/:id/followers` | `getFollowers` |
| GET | `/api/v1/users/:id/following` | `getFollowing` |
| POST | `/api/v1/users/:id/follow` | `follow` |
| DELETE | `/api/v1/users/:id/follow` | `unfollow` |
