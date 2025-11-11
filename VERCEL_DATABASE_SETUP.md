# 📖 Vercel 数据库配置指南

## ✅ DATABASE_URL 说明

Vercel 提供两种 Postgres 数据库：

### 1. Vercel Postgres
```bash
DATABASE_URL="postgres://default:xxx@ep-xxxxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb"
```
- Host: `*.vercel-storage.com`
- 标准的 Vercel Postgres

### 2. Prisma Postgres (通过 Prisma Accelerate)
```bash
DATABASE_URL="postgres://xxx:xxx@db.prisma.io:5432/postgres?sslmode=require"
```
- Host: `db.prisma.io`
- 使用 Prisma Accelerate 和 Prisma Pulse
- 提供连接池和缓存优化

**⚠️ 重要:** `db.prisma.io` **是有效的地址**（如果你使用 Prisma Postgres）！

## 🔍 如何判断你的数据库配置是否正确？

检查 DATABASE_URL 格式：

✅ **正确的格式:**
```bash
# 格式: postgres://username:password@host:port/database
DATABASE_URL="postgres://xxx:xxx@db.prisma.io:5432/postgres?sslmode=require"
DATABASE_URL="postgres://default:xxx@ep-xxxxx.vercel-storage.com:5432/verceldb"
```

❌ **错误的格式:**
```bash
DATABASE_URL="your-database-url"           # 占位符
DATABASE_URL="postgresql://..."            # 未填写
DATABASE_URL=""                            # 空值
```

---

## 🔧 完整修复步骤

### 步骤 1: 访问 Vercel Dashboard

```bash
https://vercel.com/dashboard
```

### 步骤 2: 检查是否已有 Postgres 数据库

1. 选择你的项目 `butternovel`
2. 点击顶部的 **"Storage"** 标签
3. 查看是否有 Postgres 数据库

**如果有数据库：**
- 点击数据库名称进入详情页
- 跳到步骤 3

**如果没有数据库：**
- 点击 **"Create Database"**
- 选择 **"Postgres"**
- 选择区域（推荐 **US East** 或距离你最近的区域）
- 输入数据库名称（可以用 `butternovel-db`）
- 点击 **"Create"**

### 步骤 3: 获取正确的 DATABASE_URL

1. 在数据库详情页，点击 **".env.local"** 标签
2. 你会看到多个环境变量：

```bash
POSTGRES_URL="postgres://default:xxxxx@ep-xxxxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb"
POSTGRES_PRISMA_URL="postgres://default:xxxxx@ep-xxxxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NO_SSL="postgres://default:xxxxx@ep-xxxxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb"
POSTGRES_URL_NON_POOLING="postgres://default:xxxxx@ep-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb"
POSTGRES_USER="default"
POSTGRES_HOST="ep-xxxxx-pooler.us-east-1.postgres.vercel-storage.com"
POSTGRES_PASSWORD="xxxxx"
POSTGRES_DATABASE="verceldb"
```

3. **使用 `POSTGRES_PRISMA_URL`**（推荐，因为包含连接池配置）

### 步骤 4: 更新本地 .env 文件

创建或编辑 `/home/user/butternovel/.env`：

```bash
# 复制 POSTGRES_PRISMA_URL 的值
DATABASE_URL="postgres://default:xxxxx@ep-xxxxx-pooler.us-east-1.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"

# 其他环境变量保持不变
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
ADMIN_JWT_SECRET="your-jwt-secret"
```

### 步骤 5: 更新 Vercel 环境变量

在 Vercel Dashboard：

1. 项目 -> **Settings** -> **Environment Variables**
2. 找到 `DATABASE_URL` 或添加新的环境变量
3. **Name:** `DATABASE_URL`
4. **Value:** 复制 `POSTGRES_PRISMA_URL` 的值
5. **Environments:** 勾选所有环境
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. 点击 **Save**

### 步骤 6: 初始化数据库

```bash
# 1. 停止当前开发服务器（如果在运行）
# Ctrl+C

# 2. 生成 Prisma Client
npm run db:generate

# 3. 推送数据库 schema
npm run db:push

# 4. 运行 seed（可选）
npm run db:seed
npm run db:seed-admin

# 5. 重启开发服务器
npm run dev
```

### 步骤 7: 验证配置

```bash
# 应该看到：
✅ 所有环境变量验证通过
✅ 数据库连接测试成功

# 测试 API
curl http://localhost:3000/api/health

# 应该返回：
{
  "status": "healthy",
  "database": "connected",
  "responseTime": "50ms"
}
```

---

## 🔍 关于 Prisma Postgres (db.prisma.io)

如果你使用的是 **Vercel 的 Prisma Postgres**（在 Storage 中创建的 Prisma Postgres 数据库），你的 DATABASE_URL **应该**包含 `db.prisma.io`：

```bash
# ✅ 正确 - Prisma Postgres
DATABASE_URL="postgres://xxx:sk_xxx@db.prisma.io:5432/postgres?sslmode=require"
```

这是因为 Vercel 的 Prisma Postgres 使用：
- **Prisma Accelerate** - 全球分布式连接池
- **Prisma Pulse** - 实时数据库事件（可选）

### Prisma Accelerate URL (可选)

如果你还看到 `PRISMA_DATABASE_URL`，这是 Accelerate 的代理 URL：

```bash
# 可选 - 如果使用 Prisma Accelerate
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
```

**区别：**
- `DATABASE_URL` (db.prisma.io) - 直接连接到数据库
- `PRISMA_DATABASE_URL` (accelerate.prisma-data.net) - 通过 Accelerate 代理

---

## 🎯 快速检查清单

- [ ] 在 Vercel Dashboard 看到 Postgres 数据库（Storage 页面）
- [ ] DATABASE_URL 格式正确（包含有效的 host、用户名、密码）
- [ ] 本地 .env 文件已更新
- [ ] Vercel 环境变量已更新
- [ ] `npm run db:push` 成功执行
- [ ] `npm run dev` 启动时显示 "✅ 数据库连接测试成功"
- [ ] `/api/health` 返回 healthy 状态

---

## 📞 还是不行？

如果按照以上步骤操作后仍然有问题：

### 选项 1: 使用 Vercel CLI（最简单）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 链接项目
vercel link

# 4. 自动拉取正确的环境变量
vercel env pull .env

# 5. 重启
npm run dev
```

### 选项 2: 重新创建数据库

如果数据库配置太乱：

1. Vercel Dashboard -> Storage -> 选择你的 Postgres 数据库
2. Settings -> **Delete Database**（确保先备份数据！）
3. 重新创建一个新的 Postgres 数据库
4. 按照上面步骤重新配置

### 选项 3: 截图检查

发送以下截图以便诊断：
1. Vercel Dashboard -> Storage 页面的截图
2. Postgres 数据库详情页 -> .env.local 标签的截图（隐藏密码部分）
3. 本地 .env 文件内容（隐藏密码）

---

## 📝 总结

**Vercel 数据库类型：**
- ✅ **Vercel Postgres** - 使用 `*.vercel-storage.com`
- ✅ **Prisma Postgres** - 使用 `db.prisma.io` (通过 Prisma Accelerate)

**两种都是有效的真实数据库！**

**确保：**
- ✅ DATABASE_URL 格式正确
- ✅ 本地和 Vercel 环境变量已配置
- ✅ 数据库连接测试成功
- ✅ `/api/health` 返回 healthy 状态
