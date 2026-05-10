# Enterprise Blog Monorepo

企业级个人全功能博客系统（前后端分离），基于 `pnpm + monorepo`。

## 技术栈

- 前端：Vite + React + TypeScript + Tailwind CSS + shadcn/ui（工程化落地）
- 后端：NestJS + MySQL（Prisma Schema 规范化建模）
- 工程：pnpm workspace + 统一 lint/typecheck/build 脚本

## 目录结构

```text
enterprise-blog
├─ apps
│  ├─ web          # 前台 + 管理端前端应用（React）
│  └─ api          # 后端 API（NestJS）
├─ packages
│  ├─ shared       # 前后端共享类型/枚举
│  ├─ ui           # 设计令牌与可复用 UI 能力
│  └─ config       # 工作区统一配置常量
└─ docs
   ├─ architecture.md
   ├─ api-spec.md
   └─ requirements-traceability.md
```

## 快速开始

```bash
pnpm install
pnpm dev
```

常用命令：

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

## 当前状态

- 已完成第1阶段：monorepo 基础架构、前后端骨架、统一规范与文档基线。
- 已完成第2阶段（后端核心基线）：
  - Prisma 模块接入与全量 schema 校验通过
  - Auth（register/login/me）+ JWT 鉴权
  - RBAC（Roles 装饰器 + 全局 RolesGuard）
  - Users / Roles / Categories / Tags / Series 首批 REST 接口
  - Prisma seed（角色、权限、管理员初始化）
- 已完成第3阶段（前端架构深化）：
  - 统一 API 客户端与错误处理
  - Zustand 鉴权状态持久化 + 启动时身份恢复
  - React Query 全局接入
  - 受保护路由与角色路由守卫
  - 后台信息架构页面（用户/分类/标签/专题/角色）
- 已完成第4阶段（文章全流程首版）：
  - 后端 Articles 模块：新增/编辑/草稿/定时/发布/删除
  - 可见性策略：PUBLIC/FOLLOWER/LOGGED_IN/PRIVATE/PASSWORD
  - 归档接口与搜索过滤（标题/正文/标签关键词）
  - 前端后台文章管理页：创建、列表、发布、草稿、定时、归档预览

## 环境变量（Web）

在 `apps/web` 侧可配置：

- `VITE_API_BASE_URL`，默认 `http://localhost:3000/api/v1`

## 环境变量（API）

在 `apps/api` 侧可配置：

- `STORAGE_PROVIDER`：默认 `LOCAL`
- `STORAGE_BUCKET`：默认 `enterprise-blog`
- `STORAGE_PUBLIC_BASE_URL`：默认 `http://localhost:3000/static`
- `STORAGE_UPLOAD_DIR`：默认 `./uploads`
- `STORAGE_SIGNED_EXPIRES_IN_SECONDS`：默认 `900`
- `S3_REGION`：S3 区域（如 `ap-southeast-1`）
- `S3_ENDPOINT`：S3/兼容对象存储 endpoint（可选）
- `S3_ACCESS_KEY_ID`：S3 AK
- `S3_SECRET_ACCESS_KEY`：S3 SK
- `S3_SESSION_TOKEN`：临时令牌（可选）
- `S3_FORCE_PATH_STYLE`：`true/false`，默认 `false`
