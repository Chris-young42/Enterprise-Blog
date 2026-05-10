# API 规范文档（v0.1）

## 1. 基础约定

- 协议：HTTPS
- 风格：RESTful
- 前缀：`/api/v1`
- 编码：`application/json; charset=utf-8`

## 2. 统一返回格式

### 成功

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {},
  "timestamp": "2026-05-10T12:00:00.000Z"
}
```

### 失败

```json
{
  "success": false,
  "code": 400,
  "message": "Bad Request",
  "path": "/api/v1/articles",
  "timestamp": "2026-05-10T12:00:00.000Z"
}
```

## 3. 鉴权与权限

1. 登录后返回 JWT（后续实现）。
2. 角色：`SUPER_ADMIN / ADMIN / EDITOR / AUTHOR / VISITOR`。
3. 鉴权策略：接口守卫 + 角色守卫 + 资源级校验。

## 4. 通用分页

请求参数：

- `page`（默认 1）
- `pageSize`（默认 20，上限 100）

响应结构：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

## 5. 模块接口清单（规划）

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/captcha`

### User

- `GET /users/me`
- `PATCH /users/me`
- `GET /users/:id`
- `POST /users/:id/follow`
- `DELETE /users/:id/follow`
- `GET /users/:id/followers`
- `GET /users/:id/following`

### Article

- `POST /articles`
- `PATCH /articles/:id`
- `POST /articles/:id/publish`
- `POST /articles/:id/schedule`
- `POST /articles/:id/draft`
- `GET /articles`
- `GET /articles/:slug`
- `GET /articles/archive`
- `POST /articles/:slug/access`
- `POST /articles/:id/like`
- `POST /articles/:id/favorite`

### Category/Tag/Series

- `GET/POST/PATCH/DELETE /categories`
- `GET/POST/PATCH/DELETE /tags`
- `GET/POST/PATCH/DELETE /series`

### Comment

- `POST /articles/:id/comments`
- `POST /comments/:id/reply`
- `POST /comments/:id/like`
- `POST /comments/:id/dislike`
- `POST /comments/:id/report`
- `PATCH /comments/:id/review`

### Media

- `GET /media/assets`
- `GET /media/assets/public`
- `POST /media/assets`
- `POST /media/assets/upload-local`
- `POST /media/assets/upload-plan`
- `DELETE /media/assets/:id`
- `GET /media/albums`
- `POST /media/albums`
- `POST /media/albums/:id/items`
- `DELETE /media/albums/items/:id`
- `GET /media/resources`
- `POST /media/resources`
- `POST /media/resources/:id/download`
- `DELETE /media/resources/:id`
- `GET /media/articles/:articleId/attachments`
- `POST /media/articles/attachments`
- `DELETE /media/articles/attachments/:id`

### Site/Page

- `GET /pages`
- `GET /pages/:slug`
- `POST /pages`
- `PATCH /pages/:id`
- `DELETE /pages/:id`
- `GET /message-board`
- `POST /message-board`
- `GET /message-board/admin/list`
- `PATCH /message-board/admin/:id/review`
- `PATCH /message-board/admin/batch/review`
- `DELETE /message-board/admin/:id`
- `GET /friend-links`
- `POST /friend-links/apply`
- `GET /friend-links/admin/list`
- `POST /friend-links`
- `PATCH /friend-links/:id`
- `PATCH /friend-links/admin/:id/review`
- `PATCH /friend-links/admin/batch/review`
- `DELETE /friend-links/:id`
- `GET /announcements`
- `GET /announcements/admin/list`
- `POST /announcements`
- `PATCH /announcements/:id`
- `DELETE /announcements/:id`
- `GET /site-configs/public/nav`
- `GET /site-configs`
- `GET /site-configs/:key`
- `POST /site-configs`
- `POST /site-configs/nav`

### Stats/Logs/Security/Ops

- `GET /stats/overview`
- `GET /stats/traffic`
- `GET /logs/login`
- `GET /logs/operation`
- `POST /security/ip-ban`
- `POST /ops/cache/clear`
- `POST /ops/backup`
- `POST /ops/restore`

## 6. 错误码建议（规划）

- `0`：成功
- `400`：参数错误
- `401`：未认证
- `403`：无权限
- `404`：资源不存在
- `409`：资源冲突
- `429`：请求过于频繁
- `500`：系统异常

## 7. 当前已实现接口（第1阶段）

- `GET /api/v1/health`
- `GET /api/v1/system/meta`
- `GET /api/docs`（Swagger 文档入口）

## 8. 第2阶段已实现接口（当前）

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/captcha`
- `GET /api/v1/auth/me`

### User

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users/:id`
- `POST /api/v1/users/:id/follow`
- `DELETE /api/v1/users/:id/follow`
- `GET /api/v1/users/:id/followers`
- `GET /api/v1/users/:id/following`

### RBAC/系统

- `GET /api/v1/roles`（`SUPER_ADMIN` / `ADMIN`）

### 内容字典

- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `PATCH /api/v1/categories/:id`
- `DELETE /api/v1/categories/:id`
- `GET /api/v1/tags`
- `POST /api/v1/tags`
- `PATCH /api/v1/tags/:id`
- `DELETE /api/v1/tags/:id`
- `GET /api/v1/series`
- `POST /api/v1/series`
- `PATCH /api/v1/series/:id`
- `DELETE /api/v1/series/:id`

### 文章流程

- `POST /api/v1/articles`
- `PATCH /api/v1/articles/:id`
- `POST /api/v1/articles/:id/draft`
- `POST /api/v1/articles/:id/schedule`
- `POST /api/v1/articles/:id/publish`
- `DELETE /api/v1/articles/:id`
- `GET /api/v1/articles`
- `GET /api/v1/articles/hot`
- `GET /api/v1/articles/archive`
- `GET /api/v1/articles/:slug`
- `POST /api/v1/articles/:slug/access`
- `POST /api/v1/articles/batch/delete`
- `POST /api/v1/articles/batch/pinned`
- `POST /api/v1/articles/batch/recommended`
- `POST /api/v1/articles/batch/move-category`

### 标签聚合

- `GET /api/v1/tags/aggregate`

### 评论系统（第5阶段首版）

- `GET /api/v1/comments/policy`
- `GET /api/v1/comments/captcha`
- `GET /api/v1/articles/:articleId/comments`
- `POST /api/v1/articles/:articleId/comments`
- `POST /api/v1/comments/:id/like`
- `POST /api/v1/comments/:id/dislike`
- `POST /api/v1/comments/:id/report`
- `GET /api/v1/admin/comments/pending`
- `PATCH /api/v1/admin/comments/:id/review`
- `GET /api/v1/admin/comments/policy`
- `PATCH /api/v1/admin/comments/policy`
- `GET /api/v1/admin/comments/blocked-users`
- `POST /api/v1/admin/comments/blocked-users/:userId`
- `POST /api/v1/admin/comments/blocked-users/:userId/unblock`

### 媒体资源系统（第7阶段首版）

- `GET /api/v1/media/assets`
- `GET /api/v1/media/assets/public`
- `POST /api/v1/media/assets`
- `POST /api/v1/media/assets/upload-local`
- `POST /api/v1/media/assets/upload-plan`
- `DELETE /api/v1/media/assets/:id`
- `GET /api/v1/media/albums`
- `POST /api/v1/media/albums`
- `POST /api/v1/media/albums/:id/items`
- `DELETE /api/v1/media/albums/items/:id`
- `GET /api/v1/media/resources`
- `POST /api/v1/media/resources`
- `POST /api/v1/media/resources/:id/download`
- `DELETE /api/v1/media/resources/:id`
- `GET /api/v1/media/articles/:articleId/attachments`
- `POST /api/v1/media/articles/attachments`
- `DELETE /api/v1/media/articles/attachments/:id`

### 站点栏目系统（第8阶段首版）

- `GET /api/v1/pages`
- `GET /api/v1/pages/:slug`
- `POST /api/v1/pages`
- `PATCH /api/v1/pages/:id`
- `DELETE /api/v1/pages/:id`
- `GET /api/v1/message-board`
- `POST /api/v1/message-board`
- `GET /api/v1/message-board/admin/list`
- `PATCH /api/v1/message-board/admin/:id/review`
- `PATCH /api/v1/message-board/admin/batch/review`
- `PATCH /api/v1/message-board/admin/batch/remove`
- `DELETE /api/v1/message-board/admin/:id`
- `GET /api/v1/friend-links`
- `POST /api/v1/friend-links/apply`
- `GET /api/v1/friend-links/admin/list`
- `POST /api/v1/friend-links`
- `PATCH /api/v1/friend-links/:id`
- `PATCH /api/v1/friend-links/admin/:id/review`
- `PATCH /api/v1/friend-links/admin/batch/review`
- `PATCH /api/v1/friend-links/admin/reorder`
- `DELETE /api/v1/friend-links/:id`
- `GET /api/v1/announcements`
- `GET /api/v1/announcements/admin/list`
- `POST /api/v1/announcements`
- `PATCH /api/v1/announcements/:id`
- `DELETE /api/v1/announcements/:id`
- `GET /api/v1/moments`
- `GET /api/v1/moments/timeline`
- `GET /api/v1/moments/:slug`
- `POST /api/v1/moments`
- `PATCH /api/v1/moments/:id`
- `DELETE /api/v1/moments/:id`
- `GET /api/v1/site-configs/public/nav`
- `GET /api/v1/site-configs/public/side-nav`
- `GET /api/v1/site-configs`
- `GET /api/v1/site-configs/:key`
- `POST /api/v1/site-configs`
- `POST /api/v1/site-configs/nav`
- `POST /api/v1/site-configs/side-nav`


### 主题外观系统（第10阶段首版）

- GET /api/v1/site-configs/public/appearance 
- POST /api/v1/site-configs/appearance（主题模式/主题预设/字体字号/组件开关/动画开关/自定义CSS+JS+头尾代码）
### 统计系统（第9阶段首版）

- `GET /api/v1/stats/overview`
- `GET /api/v1/stats/traffic`（支持 `days/from/to/granularity`，返回 points + 当前/上一区间对比）
- `GET /api/v1/stats/content-ranking`
- `GET /api/v1/stats/visitor-analysis`
- `GET /api/v1/stats/spider-analysis`
- `GET /api/v1/stats/logs/access`（支持 `keyword/method/statusCode/isSpider` 过滤）
- `GET /api/v1/stats/logs/login`（支持 `keyword/isSuccess` 过滤）
- `GET /api/v1/stats/logs/operation`（支持 `keyword/module/action` 过滤）
- `GET /api/v1/stats/logs/access/export`（CSV 导出）
- `GET /api/v1/stats/logs/login/export`（CSV 导出）
- `GET /api/v1/stats/logs/operation/export`（CSV 导出）


### 第11阶段（首批）

- GET /api/v1/sensitive-words 
- POST /api/v1/sensitive-words 
- PATCH /api/v1/sensitive-words/:id 
- DELETE /api/v1/sensitive-words/:id 
- GET /api/v1/notifications/me 
- PATCH /api/v1/notifications/me/read 
- PATCH /api/v1/notifications/me/read-all 
- GET /api/v1/notifications/admin/list 
- GET /api/v1/notifications/admin/email-logs
- POST /api/v1/ops/cache/clear 
- POST /api/v1/ops/static/generate 
- GET /api/v1/ops/static/tasks
- GET /api/v1/ops/static/artifacts
- POST /api/v1/ops/backup
- POST /api/v1/ops/restore
- POST /api/v1/ops/restore/precheck
- POST /api/v1/ops/migrate
- POST /api/v1/ops/migrate/precheck
- GET /api/v1/ops/backup/tasks
- GET /api/v1/ops/approval-records
- GET /api/v1/ops/site/profile 
- PATCH /api/v1/ops/site/profile 
- POST /api/v1/articles/:id/assign
- GET /api/v1/articles/assignments/list
- POST /api/v1/articles/batch/status
- POST /api/v1/articles/batch/move-series
- POST /api/v1/articles/batch/visibility

### 第12阶段（首批）

- GET /api/v1/auth/captcha
- GET /api/v1/security/ip-bans
- POST /api/v1/security/ip-bans
- DELETE /api/v1/security/ip-bans/:id
- GET /api/v1/security/keyword-bans
- POST /api/v1/security/keyword-bans
- DELETE /api/v1/security/keyword-bans/:id

说明（第12阶段首批风控闭环）：

- 登录接口 `POST /api/v1/auth/login` 新增验证码字段：`captchaToken`、`captchaAnswer`。
- 登录防爆破：按用户名/邮箱与 IP 在时间窗口内累计失败次数，超阈值后临时封禁登录。
- IP封禁联动：登录、评论发布、留言发布都会检查 `BannedIp`。
- 关键词封禁联动：评论内容、留言内容会命中 `security.keyword_bans` 并拒绝提交。

### 第12阶段（下一批）

- GET /api/v1/security/blocked-domains
- POST /api/v1/security/blocked-domains
- DELETE /api/v1/security/blocked-domains/:domain

说明（第12阶段下一批风控深化）：

- 全局限流：新增 `TrafficShieldGuard`，按 IP 进行分钟级限流（429）。
- 防CC：短窗口突发流量触发自动临时封禁 `BannedIp`（带原因和过期时间）。
- 恶意链接拦截：支持域名黑名单（`security.blocked_link_domains`），命中 referer 立即拒绝并封禁来源 IP。
- HTTPS适配：响应头增加 `Strict-Transport-Security`；可通过 `ENFORCE_HTTPS=true` 强制 HTTPS（HTTP 返回 426）。
- 异地登录提醒：当用户成功登录且 IP 与历史成功登录 IP 不同，自动发送站内安全通知；可配置是否邮件同步发送。

### 第12阶段（再深化）

- Redis 分布式限流：
  - 全局风控守卫支持 Redis 计数（多实例一致）；Redis 不可用时回退到本地内存计数。
- GeoIP 风险评分：
  - 登录成功后结合 GeoIP 地理信息与历史登录记录计算可疑评分，达到阈值触发异地登录安全提醒。
- 安全审计分析：
  - `GET /api/v1/stats/security-analysis`（支持 `days/from/to/action/ip` 过滤，返回 IP封禁命中 / 限流命中 / 恶意来源命中 / Redis健康降级与恢复 的日趋势、总量、最近事件）。
  - `GET /api/v1/stats/security-analysis/export`（CSV 导出，支持 `days/from/to/action/ip` 过滤）。
  - `GET /api/v1/stats/security-analysis/export-history`（安全审计导出任务历史，支持分页与时间范围）。
  - `GET /api/v1/stats/security-analysis/export-history/export`（导出历史CSV）。
  - 结果新增 `ipSegments`（按 IP 段聚合命中数量，支持 IPv4 `/24` 与 IPv6 前缀分组）。
- Redis 健康探针与告警：
  - `GET /api/v1/security/redis/health`
  - `GET /api/v1/security/redis/sla?hours=24`
  - `GET /api/v1/security/redis/sla/trend?days=30`（按日返回探针失败率、失败次数、MTTR、恢复次数）
  - 服务端定时探测 Redis 连通性，状态从健康切换到降级或恢复时写入 `SECURITY` 操作日志并向 `SUPER_ADMIN` 推送安全通知。
  - Redis持续降级告警节流：`REDIS_DEGRADED_ALERT_THROTTLE_SECONDS` 控制持续告警最小间隔。
  - Redis可用性窗口统计：`REDIS_SLA_WINDOW_HOURS` 控制默认SLA统计窗口，返回可用性百分比、故障时长与事件列表。
- GeoIP 离线库维护与精度校验：
  - `POST /api/v1/security/geoip/update`（使用 `GEOIP_LICENSE_KEY` 执行离线库更新并热重载）
  - `POST /api/v1/security/geoip/reload`
  - `POST /api/v1/security/geoip/validate`（请求体：`samples: [{ ip, country?, city? }]`，返回国家/城市精度汇总与样本核验结果）
- `GET /api/v1/security/geoip/status`（自动更新状态、最近成功/失败、下次计划执行时间）
  - `GET /api/v1/security/geoip/validation-history`（最近校验历史、latest/previous 与精度 delta）
- 定时自动更新间隔：`GEOIP_AUTO_UPDATE_INTERVAL_HOURS`（小时）
  - 当未配置 `GEOIP_LICENSE_KEY` 时，自动任务状态记为 `SKIPPED`（不会阻断GeoIP查询与风控流程）

安全导出历史过滤扩展：

- `GET /api/v1/stats/security-analysis/export-history`
  - 支持：`days/from/to`
  - 支持：`keyword`（操作者用户名/昵称关键词）
  - 支持：`action`（`SECURITY_ANALYSIS_EXPORT` / `SECURITY_EXPORT_HISTORY_EXPORT`）
  - 支持：`ip`
  - 支持：`minCount/maxCount`（导出条数范围过滤）
- `GET /api/v1/stats/security-analysis/export-history/export`
  - 支持同等过滤参数并导出 CSV

说明（restore/migrate 流水线）：

- `POST /api/v1/ops/restore`
  - body: `{ "restoreFrom": "xxx.json", "dryRun"?: boolean, "confirmToken"?: string, "confirmPhrase"?: "RESTORE CONFIRM" }`
  - 约束：恢复文件必须位于 `BACKUP_OUTPUT_DIR` 内。
  - 双人审批：预检查发起人与正式执行确认人必须是不同管理员，且最终确认人必须是 `SUPER_ADMIN`。
  - 审批原因：正式执行必须填写 `approvalReason`（至少8字符）。
  - 两段式：先调用 `POST /api/v1/ops/restore/precheck` 获取 `confirmToken`，再携带 token 执行正式恢复。
  - `dryRun=true` 时仅返回预检查报告，不执行落库。
  - 行为：正式执行前自动创建回滚点快照，随后执行结构校验 + 数据恢复事务，写入操作审计日志。
- `POST /api/v1/ops/restore/precheck`
  - body: `{ "restoreFrom": "xxx.json" }`
  - 返回：预检查报告 + 一次性确认令牌（含过期时间）+ `requiredPhrase`。
- `POST /api/v1/ops/migrate`
  - body: `{ "target"?: "production", "dryRun"?: boolean, "confirmToken"?: string, "confirmPhrase"?: "MIGRATE CONFIRM" }`
  - 约束：`target` 仅允许 `[a-zA-Z0-9_-]`。
  - 双人审批：预检查发起人与正式执行确认人必须是不同管理员，且最终确认人必须是 `SUPER_ADMIN`。
  - 审批原因：正式执行必须填写 `approvalReason`（至少8字符）。
  - 两段式：先调用 `POST /api/v1/ops/migrate/precheck` 获取 `confirmToken`，再携带 token 执行正式迁移。
  - `dryRun=true` 时仅返回迁移状态报告，不执行 deploy。
  - 行为：正式执行前自动创建回滚点快照，随后真实执行 `prisma migrate status` + `prisma migrate deploy`，并写入操作审计日志。
- `POST /api/v1/ops/migrate/precheck`
  - body: `{ "target"?: "production" }`
  - 返回：迁移预检查报告 + 一次性确认令牌（含过期时间）+ `requiredPhrase`。
- `GET /api/v1/ops/approval-records`
  - 返回：高危操作审批流水（含 token 消费记录、审批人/发起人字段、审批原因与任务执行审计）。

## 9. 初始化脚本

- 运行 `pnpm --filter @enterprise-blog/api prisma:seed` 初始化：
  - 角色（SUPER_ADMIN/ADMIN/EDITOR/AUTHOR/VISITOR）
  - 权限基础数据
  - 管理员账号：`admin / Admin@123456`（首次登录后请立即修改）

