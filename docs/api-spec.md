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
- `POST /auth/captcha`

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
- `GET /api/v1/site-configs`
- `GET /api/v1/site-configs/:key`
- `POST /api/v1/site-configs`
- `POST /api/v1/site-configs/nav`

## 9. 初始化脚本

- 运行 `pnpm --filter @enterprise-blog/api prisma:seed` 初始化：
  - 角色（SUPER_ADMIN/ADMIN/EDITOR/AUTHOR/VISITOR）
  - 权限基础数据
  - 管理员账号：`admin / Admin@123456`（首次登录后请立即修改）
