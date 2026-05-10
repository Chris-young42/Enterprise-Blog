# 架构文档（v2）

## 1. 架构目标

- 在 `pnpm + monorepo` 下支撑前后端分离的企业级博客系统。
- 保证模块化、可扩展、可观测、可部署、可审计。
- 面向 80 项需求持续迭代，不牺牲工程一致性。

## 2. 仓库与工程结构

## 2.1 Monorepo 拓扑

- `apps/web`: React + Vite + TypeScript + Tailwind + shadcn/ui 前端
- `apps/api`: NestJS + Prisma + MySQL 后端
- `packages/*`: 共享能力（类型、配置、组件等）
- `docs/*`: 规范、架构、接口、建模文档
- `scripts/*`: 初始化、运维、自动化脚本

## 2.2 包管理与构建

- 包管理：`pnpm workspace`
- 典型命令：
  - `pnpm --filter @enterprise-blog/web build`
  - `pnpm --filter @enterprise-blog/web lint`
  - `pnpm --filter @enterprise-blog/web typecheck`
- CI/CD 建议：
  - Lint + Typecheck + Build + API smoke test

## 3. 后端架构（NestJS）

## 3.1 分层原则

- Controller：接口入口与参数绑定
- Service：业务编排与领域规则
- Prisma：数据库访问层
- DTO：参数校验与类型约束
- Common 层：
  - Guard：认证/授权/防护
  - Interceptor：统一响应、访问日志
  - Filter：统一异常响应

## 3.2 全局能力

- 全局前缀：`/api/v1`（见 `apps/api/src/main.ts`）
- 统一成功响应：`TransformResponseInterceptor`
- 统一异常响应：`HttpExceptionFilter`
- 全局校验：`ValidationPipe(whitelist + transform + forbidNonWhitelisted)`
- 全局守卫链：
  1. `JwtAuthGuard`
  2. `RolesGuard`
  3. `TrafficShieldGuard`

## 3.3 模块清单（当前）

- `auth`、`users`、`roles`
- `articles`、`categories`、`tags`、`series`
- `comments`
- `media`
- `pages`、`message-board`、`friend-links`、`announcements`
- `site-configs`
- `moments`
- `stats`
- `security`
- `sensitive-words`
- `notifications`
- `ops`
- `health`、`system`

## 4. 前端架构（React）

## 4.1 分层

- `pages`: 页面路由
- `components/ui`: shadcn 基础组件
- `components/layouts`: 站点壳与后台壳
- `components/motion`: 动效组件与规范
- `providers`: Query/Theme/Auth/Toast 等全局上下文
- `api`: 接口访问层与类型
- `store`: 状态管理

## 4.2 关键约束

- 全量 TypeScript
- 路由懒加载
- 移动端优先适配
- 统一动效规范（Modal/Drawer/Toast/Page）

## 5. 数据架构（MySQL + Prisma）

- 建模文档：`docs/database-modeling.md`
- 当前模型：36 张（含审计日志与运维任务）
- 关键特征：
  - 全表 `cuid` 主键
  - 软删除 `deletedAt`
  - 高频查询索引完善
  - 内容/互动/运维/安全日志闭环

## 6. 接口架构

- API 参考（全量）：`docs/api-reference.md`
- 接口总表（全量路径清单）：`docs/api-endpoints.full.md`
- 当前控制器统计：173 个路由（自动抽取）
- 访问级别：
  - `PUBLIC`（匿名可访问）
  - `JWT`（登录态）
  - `ROLES`（角色授权）

## 7. 安全架构

- 身份与权限：
  - JWT 认证
  - RBAC 角色授权（`RolesGuard`）
- 防护：
  - 限流/反爬/恶意来源治理（`TrafficShieldGuard` + `security` 模块）
  - IP/关键词封禁
  - 评论验证码与策略
- 审计：
  - `AccessLog` / `LoginLog` / `OperationLog`
  - 安全审计与导出任务历史

## 8. 运维架构

- 静态化任务：`ops/static/*`
- 缓存清理：`ops/cache/clear`
- 备份恢复迁移：`ops/backup`、`ops/restore`、`ops/migrate`
- 高危操作门禁：
  - 预检查
  - 确认令牌
  - 双重确认短语
  - 角色审批链

## 9. 可观测性

- 接口访问日志（含设备、地域、蜘蛛识别）
- 登录日志与后台操作日志
- 可视化统计：
  - 管理总览
  - 安全审计
  - 导出与趋势分析

## 10. 部署架构建议

- 开发：
  - 本地 MySQL / Docker Compose
  - 前后端分别启动
- 生产建议：
  - API：容器化部署（多实例）
  - Web：静态资源 + CDN
  - DB：主从或托管服务，开启备份策略
  - HTTPS：反向代理层强制

## 11. 文档与代码同步机制

- `api-reference.md` 由控制器自动抽取生成，作为接口真实来源。
- 每次新增/修改接口后，必须更新 API 文档。
- 数据模型变更后，同步更新 `database-modeling.md`。

