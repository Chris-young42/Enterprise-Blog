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

最小必填环境变量清单见：
- [docs/env-min-required.md](./docs/env-min-required.md)

### 一键开发调试脚本（前端 + 本机 Nest + Docker MySQL/MinIO/Redis）

Windows PowerShell：

```powershell
pnpm dev:env
```

首次初始化数据库（执行 migrate + seed）：

```powershell
pnpm dev:env:init
```

macOS/Linux Bash：

```bash
pnpm dev:env:sh
```

首次初始化数据库（执行 migrate + seed）：

```bash
pnpm dev:env:sh:init
```

说明：
- 脚本会启动 `mysql`、`minio` 与 `redis` 容器。
- 脚本会先执行 `pnpm lint`，通过后再启动本机开发服务。
- 脚本最后执行 `pnpm dev`，并行启动前端与本机后端。

### 本地开发（Docker Compose：MySQL + MinIO + Redis）

1. 启动开发基础服务（MySQL + MinIO + Redis）：

```bash
pnpm db:up
```

2. 初始化后端环境变量（首次，非容器本地开发时使用）：

```bash
cp apps/api/.env.example apps/api/.env
```

3. 初始化数据库结构和种子数据：

```bash
pnpm db:init
```

4. 启动前后端开发服务（本地）：

```bash
pnpm dev
```

5. 预览地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3000/api/v1`
- Swagger：`http://localhost:3000/api/docs`
- MinIO API：`http://localhost:9000`
- MinIO Console：`http://localhost:9001`
- Redis：`127.0.0.1:6379`

### 数据持久化目录（开发环境）

`docker-compose.yml` 已配置将容器数据强制落盘到项目根目录 `data/` 下：

- MySQL 数据目录：`./data/mysql` -> `/var/lib/mysql`
- MinIO 对象存储目录：`./data/minio` -> `/data`
- Redis 数据目录：`./data/redis` -> `/data`

这样即使执行容器重建或重启，数据库数据与对象文件仍会保留在项目本地目录中。
`data/mysql` 与 `data/minio` 目录在首次启动时会由 Docker 自动创建。

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

补充：本地 MySQL 开发库默认地址为 `127.0.0.1:3306`，数据库名 `enterprise_blog`，账号 `root`，密码 `root`（见根目录 `docker-compose.yml`）。
