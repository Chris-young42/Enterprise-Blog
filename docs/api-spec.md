# API 文档总览

## 1. 文档说明

本项目 API 文档拆分为两层：

- 规范层（本文件）：统一约定、返回格式、鉴权模型
- 明细层（自动生成）：
  - `docs/api-reference.md`（推荐主文档，含权限与角色）
  - `docs/api-endpoints.full.md`（全路径清单）

## 2. 基础约定

- 协议：HTTPS
- 风格：RESTful
- 全局前缀：`/api/v1`
- 编码：`application/json; charset=utf-8`
- Swagger：`/api/docs`

## 3. 统一返回格式

成功：

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {},
  "timestamp": "2026-05-11T00:00:00.000Z"
}
```

失败：

```json
{
  "success": false,
  "code": 400,
  "message": "Bad Request",
  "path": "/api/v1/articles",
  "timestamp": "2026-05-11T00:00:00.000Z"
}
```

## 4. 鉴权与权限模型

- `PUBLIC`：匿名可访问（可选携带 JWT）
- `JWT`：必须登录
- `ROLES`：必须登录且角色命中（如 `SUPER_ADMIN/ADMIN/EDITOR/AUTHOR`）

守卫链：

1. `JwtAuthGuard`
2. `RolesGuard`
3. `TrafficShieldGuard`

## 5. 分页约定

请求参数：

- `page`（默认 1）
- `pageSize`（默认 20，上限按服务端实现）

响应结构：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

## 6. 错误码约定

- `0`：成功
- `400`：请求参数错误
- `401`：未认证
- `403`：无权限
- `404`：资源不存在
- `409`：冲突
- `429`：限流
- `500`：服务端异常

## 7. 全量接口入口

- 全量接口主文档：`docs/api-reference.md`
- 全量接口路径清单：`docs/api-endpoints.full.md`

> 当前由控制器自动抽取统计：173 个接口（含后台管理与运维安全接口）。
