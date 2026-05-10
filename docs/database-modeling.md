# 数据库建模文档（MySQL + Prisma）

## 1. 基线信息

- 建模来源：`apps/api/prisma/schema.prisma`
- 数据库：MySQL
- ORM：Prisma
- 统计日期：2026-05-11
- 枚举数量：11
- 模型数量：36

## 2. 设计约定

- 主键：全表使用 `String @id @default(cuid())`
- 时间审计字段：普遍包含 `createdAt`、`updatedAt`、`deletedAt`
- 软删除：通过 `deletedAt` 实现
- 索引策略：
  - 外键关系字段建索引
  - 高频筛选字段建单列或联合索引
  - 状态/时间维度字段建统计索引

## 3. 枚举定义

- `RoleCode`: `SUPER_ADMIN | ADMIN | EDITOR | AUTHOR | VISITOR`
- `ArticleStatus`: `DRAFT | PUBLISHED | SCHEDULED | ARCHIVED`
- `ArticleOrigin`: `ORIGINAL | REPRINT | TRANSLATION`
- `ContentVisibility`: `PUBLIC | FOLLOWER | LOGGED_IN | PRIVATE | PASSWORD`
- `ReviewStatus`: `PENDING | APPROVED | REJECTED`
- `MediaType`: `IMAGE | AUDIO | VIDEO | FILE`
- `NotificationChannel`: `IN_APP | EMAIL`
- `MessageType`: `COMMENT | SYSTEM | FOLLOW | SECURITY`
- `EmailDeliveryStatus`: `PENDING | SENT | FAILED`
- `StaticTaskStatus`: `RUNNING | SUCCESS | FAILED`
- `BackupTaskType`: `BACKUP | RESTORE | MIGRATE`

## 4. 领域模型分组

### 4.1 用户与权限域

- 用户主表：`User`
- RBAC：`Role`、`Permission`、`UserRole`、`RolePermission`
- 社交关系：`Follow`
- 用户行为：`Favorite`、`ArticleLike`

关键关系：

- `User` N:N `Role`（中间表 `UserRole`）
- `Role` N:N `Permission`（中间表 `RolePermission`）
- `User` 1:N `Follow`（分别作为关注者/被关注者）

### 4.2 内容域

- 内容主表：`Article`
- 分类/标签/专题：`Category`、`Tag`、`Series`、`ArticleTag`
- 协作分工：`ArticleAssignment`
- 附件关系：`ArticleAttachment`

关键关系：

- `Article` N:1 `User(author)`
- `Article` N:1 `Category`（可空）
- `Article` N:1 `Series`（可空）
- `Article` N:N `Tag`（中间表 `ArticleTag`）
- `Article` 1:N `ArticleAssignment`
- `Article` 1:N `ArticleAttachment`

关键索引：

- `Article`: `status`、`visibility`、`publishAt`、`(isPinned,isRecommended)`
- `Category`: `parentId`、`sortOrder`
- `ArticleAssignment`: `(articleId,status)`、`(assigneeId,status)`

### 4.3 评论互动域

- 评论：`Comment`
- 评论反应：`CommentReaction`

关键关系：

- `Comment` N:1 `Article`
- `Comment` N:1 `User`（可匿名）
- `Comment` 自关联树结构（`parentId`、`rootId`）

关键索引：

- `Comment`: `(articleId,createdAt)`、`(userId,createdAt)`、`reviewState`

### 4.4 媒体资源域

- 素材：`MediaAsset`
- 相册：`Album`、`AlbumItem`
- 下载中心：`DownloadResource`
- 文章附件：通过 `ArticleAttachment` 关联

关键关系：

- `MediaAsset` N:1 `User(uploader)`（可空）
- `Album` N:N `MediaAsset`（中间表 `AlbumItem`）
- `DownloadResource` N:1 `MediaAsset`

### 4.5 站点内容与配置域

- 独立页：`Page`
- 站点配置：`SiteConfig`
- 公告：`Announcement`
- 友链：`FriendLink`
- 留言：`MessageBoard`

### 4.6 通知与邮件域

- 站内通知：`Notification`
- 邮件日志：`EmailDeliveryLog`

关键关系：

- `Notification` N:1 `User`
- `EmailDeliveryLog` N:1 `Notification`（可空，兼容系统邮件任务）

### 4.7 运维与安全域

- 静态化任务：`StaticGenerationTask`
- 备份/恢复/迁移任务：`BackupTask`
- 敏感词：`SensitiveWord`
- IP封禁：`BannedIp`

### 4.8 统计与审计日志域

- 登录日志：`LoginLog`
- 操作日志：`OperationLog`
- 访问日志：`AccessLog`
- 访客足迹：`VisitorFootprint`

关键索引：

- `AccessLog`: `createdAt`、`(path,createdAt)`、`(isSpider,createdAt)`
- `LoginLog`: `(userId,createdAt)`、`(ip,createdAt)`
- `OperationLog`: `(module,action,createdAt)`

## 5. 关键表明细（企业高频）

### 5.1 `Article`

- 业务字段：标题、slug、摘要、Markdown/HTML 内容、SEO 信息
- 运营字段：`isPinned`、`isRecommended`
- 权限字段：`visibility`、`accessPasswordHash`
- 统计字段：`views`、`likes`、`favorites`、`commentCount`、`wordCount`、`readingMinutes`
- 生命周期：`status` + `publishAt` + `scheduledAt`

### 5.2 `Comment`

- 支持二级/树形回复：`parentId`、`rootId`、`floor`
- 支持审核：`reviewState`
- 支持反作弊与审计：`ip`、`isAnonymous`、`isAuthor`
- 支持互动计数：`likes`、`dislikes`、`reports`

### 5.3 `BackupTask`

- 覆盖三类任务：`BACKUP | RESTORE | MIGRATE`
- 任务审计字段：`taskNo`、`command`、`output`、`error`、`startedAt`、`finishedAt`
- 可追踪产物与来源：`artifactPath`、`restoreFrom`、`target`

### 5.4 `AccessLog`

- 全链路访问审计：`path`、`method`、`statusCode`、`responseMs`
- 访客画像字段：`region`、`browser`、`deviceType`
- 爬虫识别字段：`isSpider`、`spiderName`

## 6. 关系总览（简化 ER）

- `User` -> `Article` / `Comment` / `Notification` / 各类日志
- `Article` -> `Category` / `Series` / `Tag` / `Comment` / `MediaAsset(附件)`
- `Role` <-> `Permission`，`User` <-> `Role`
- `MediaAsset` -> `Album` / `DownloadResource` / `ArticleAttachment`

## 7. 索引与性能建议

- 保留现有联合索引，不建议随意删除。
- 对超大日志表（`AccessLog`、`OperationLog`、`LoginLog`）建议做：
  - 按时间归档或冷热分层
  - 后续可引入分区表策略（按月）
- `Article.slug`、`Page.slug`、`Tag.slug` 已有唯一约束，适配 SEO 与详情路由。

## 8. 数据一致性建议

- 涉及计数类字段（如 `views`、`commentCount`）使用事务或幂等更新策略。
- `deletedAt` 软删除后，查询层必须统一过滤。
- 高危任务（恢复/迁移）日志应与审批记录进行关联审计。

## 9. 迁移与版本管理

- Prisma 迁移目录：`apps/api/prisma/migrations`
- 推荐流程：
  1. 修改 `schema.prisma`
  2. 执行迁移生成与应用
  3. 回归关键查询与索引命中
  4. 同步更新本文档
