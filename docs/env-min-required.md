# 环境变量最小必填清单（开发环境）

目标：让新同事最快跑通「前端 + 本机 Nest + Docker(MySQL/MinIO/Redis)」。

## API（必改）

文件：`apps/api/.env`

从模板复制：

```bash
cp apps/api/.env.example apps/api/.env
```

至少确认/修改以下变量：

```env
# 数据库连接（本机开发默认可直接用）
DATABASE_URL="mysql://root:root@127.0.0.1:3306/enterprise_blog?schema=public"

# JWT 密钥（必须改，不要用示例值）
JWT_ACCESS_SECRET="请替换为至少32位随机字符串"
JWT_REFRESH_SECRET="请替换为至少32位随机字符串，且与上面不同"

# 登录验证码密钥（建议改）
LOGIN_CAPTCHA_SECRET="请替换为随机字符串"

# Redis 连接（本机开发默认可直接用）
REDIS_URL=redis://127.0.0.1:6379
```

## Web（按需）

文件：`apps/web/.env.local`（可选）

仅在你不使用默认地址时才需要填写：

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Docker 基础服务（建议保持默认）

- MySQL：`127.0.0.1:3306`，账号 `root`，密码 `root`
- MinIO：`127.0.0.1:9000`（API）/`9001`（Console）
- Redis：`127.0.0.1:6379`

## 一键启动

- 首次（含建库与种子）：`pnpm dev:env:init`
- 日常：`pnpm dev:env`
