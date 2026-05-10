# 架构设计文档（v0.1）

## 1. 架构目标

1. 满足 80 项功能完整可落地，前后端分离，数据持久化到 MySQL。
2. 保证可维护、可扩展、可部署，支持企业级协作与后续迭代。
3. 通过 `pnpm + monorepo` 实现跨端共享、统一规范、统一构建。

## 2. Monorepo 分层

### 2.1 应用层（apps）

- `apps/web`：
  - 前台站点 + 后台管理端（同仓不同路由域）
  - React + TypeScript + Tailwind + shadcn/ui
  - 路由懒加载、主题切换、移动端优先适配
- `apps/api`：
  - NestJS REST API
  - 模块化、依赖注入、分层架构
  - 全局响应规范、全局异常、全局校验

### 2.2 共享层（packages）

- `packages/shared`：共享枚举、DTO类型、通用类型定义
- `packages/ui`：视觉令牌、可复用 UI 能力
- `packages/config`：工作区配置常量

## 3. 后端分层与模块规划

### 3.1 分层结构

- `controller`：REST 接口定义
- `service`：业务逻辑
- `repository`（后续）：数据访问封装（Prisma）
- `dto`：参数校验与接口契约
- `guards/interceptors/filters`：鉴权、响应转换、异常处理

### 3.2 模块列表（按需求矩阵）

- `auth`：注册登录、验证码、风控
- `user`：用户资料、粉丝关注、黑名单
- `permission`：角色权限、接口守卫
- `article`：文章全流程、权限可见性、归档、推荐
- `category/tag/series`：分类标签专题体系
- `comment`：评论、审核、互动、通知
- `media`：图库、附件、多媒体专栏
- `page/site`：独立页、导航、公告、友链
- `stats`：访问统计、内容排行、蜘蛛统计
- `log`：登录日志、操作日志、访问日志
- `security`：限流、防爬、防灌水、IP封禁
- `ops`：缓存、静态化、备份恢复与迁移

## 4. 数据架构（MySQL + Prisma）

已建立核心模型基线，覆盖：

- 用户权限：`User / Role / Permission / UserRole / RolePermission`
- 内容体系：`Article / Category / Tag / Series / ArticleTag`
- 互动体系：`Comment / CommentReaction / ArticleLike / Favorite / Follow`
- 媒体体系：`MediaAsset / Album / AlbumItem / DownloadResource / ArticleAttachment`
- 站点体系：`Page / SiteConfig / Announcement / FriendLink / MessageBoard`
- 日志统计：`AccessLog / LoginLog / OperationLog / VisitorFootprint`
- 安全治理：`SensitiveWord / BannedIp`
- 通知：`Notification`

设计规范：

1. 主键统一 `cuid`，全表审计字段：`createdAt/updatedAt/deletedAt`。
2. 关键查询字段建立组合索引与状态索引。
3. 软删除默认支持，便于审计与恢复。

## 5. 前端架构规划

### 5.1 分层

- `pages`：路由页面
- `components/ui`：基础UI原子组件
- `components/layouts`：页面布局壳
- `hooks`：可复用逻辑
- `providers`：全局上下文（主题、后续状态管理）
- `lib`：工具与站点配置

### 5.2 关键能力

1. 路由懒加载（提升首屏性能）
2. 亮暗主题切换
3. 移动端自适应
4. 后续接入统一 API 客户端与状态管理

## 6. 工程规范

1. 全量 TypeScript 严格模式，避免 `any` 滥用。
2. 统一 lint、typecheck、build、test 脚本。
3. 共享契约优先，避免前后端重复定义核心 DTO。

## 7. 部署规划（后续阶段）

1. 前端：静态资源部署（Nginx/CDN）
2. 后端：NestJS 容器化部署
3. 数据库：MySQL 主从/备份策略
4. SEO：sitemap、robots、静态化输出与伪静态路由策略
