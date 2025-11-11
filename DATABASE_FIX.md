# 🔧 数据库连接错误修复指南

## ❌ 问题症状

如果你看到以下任何错误，说明数据库配置有问题：

```
❌ Can't reach database server at `db.prisma.io:5432`
❌ DATABASE_URL contains invalid placeholder: "db.prisma.io"
❌ Application error: a server-side exception has occurred
❌ Invalid `prisma.xxx.findXxx()` invocation (P1001)
```

**根本原因:** `DATABASE_URL` 环境变量配置错误或未正确设置。

---

## ✅ 快速修复步骤

### 方法1: 使用 Vercel Postgres（推荐）

**1. 从 Vercel Dashboard 获取 DATABASE_URL**

```bash
# 1. 访问 Vercel Dashboard
https://vercel.com/dashboard

# 2. 选择你的项目

# 3. 点击 "Storage" 标签

# 4. 如果还没有数据库，点击 "Create Database" -> "Postgres"

# 5. 数据库创建后，点击 ".env.local" 标签

# 6. 复制 DATABASE_URL 的值（格式类似）:
postgres://default:xxxxx@xxx-pooler.xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require
```

**2. 创建 `.env` 文件**

在项目根目录创建 `.env` 文件（不是 `.env.local`，因为 package.json 脚本使用 `dotenv -e .env`）:

```bash
# 复制 .env.example
cp .env.example .env

# 编辑 .env 文件，填入从 Vercel 复制的 DATABASE_URL
```

**3. 更新环境变量后重启开发服务器**

```bash
# 停止当前服务器 (Ctrl+C)

# 重新启动
npm run dev
```

**4. 验证数据库连接**

```bash
# 测试健康检查端点
curl http://localhost:3000/api/health

# 应该返回:
{
  "status": "healthy",
  "database": "connected",
  "responseTime": "xxms",
  "timestamp": "..."
}
```

**5. 初始化数据库**

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库schema
npm run db:push

# 如果有seed脚本，运行seed
npm run db:seed
npm run db:seed-admin
```

---

### 方法2: 使用其他 PostgreSQL 数据库

如果你有其他 PostgreSQL 数据库（如 Supabase, Railway, 本地 Postgres），使用以下格式的连接字符串：

```bash
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

**示例：**

```bash
# Supabase
DATABASE_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"

# Railway
DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:7777/railway"

# 本地 PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/butternovel"
```

---

## 📝 完整的 .env 文件示例

```bash
# 数据库
DATABASE_URL="postgresql://default:xxxxx@xxx-pooler.xxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Admin
ADMIN_JWT_SECRET="your-admin-jwt-secret"
```

---

## 🔍 验证步骤

### 1. 检查环境变量是否加载

```bash
# 运行开发服务器，应该看到:
✅ All required environment variables are set
```

### 2. 测试数据库连接

```bash
# 打开浏览器访问:
http://localhost:3000/api/health

# 或使用 curl:
curl http://localhost:3000/api/health
```

### 3. 测试 Profile API

```bash
# 登录后访问:
http://localhost:3000/api/profile

# 应该返回用户数据，而不是数据库错误
```

---

## ⚠️ 常见错误

### 错误1: "Missing required environment variables"

**原因:** `.env` 文件不存在或环境变量未设置

**解决:** 创建 `.env` 文件并填入所有必需变量

### 错误2: "P1001: Can't reach database server"

**原因:** DATABASE_URL 格式错误或数据库服务器不可达

**解决:**
- 检查 DATABASE_URL 格式
- 确认数据库服务器正在运行
- 检查网络连接和防火墙设置

### 错误3: "Environment variable not found: DATABASE_URL"

**原因:** 环境变量文件路径错误

**解决:**
- 确保 `.env` 文件在项目根目录
- 重启开发服务器

---

## 🚀 快速一键修复脚本

如果你已经有 Vercel 项目，可以使用 Vercel CLI 自动拉取环境变量：

```bash
# 1. 安装 Vercel CLI (如果还没有)
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 链接项目
vercel link

# 4. 拉取环境变量到 .env
vercel env pull .env

# 5. 重启开发服务器
npm run dev
```

---

## 📞 需要帮助？

如果按照以上步骤仍然无法解决，请检查：

1. **Vercel Postgres 数据库是否已创建**
   - 访问 Vercel Dashboard -> Storage
   - 确认数据库状态为 "Active"

2. **DATABASE_URL 是否完整复制**
   - 包含用户名、密码、主机、端口、数据库名
   - 包含 `?sslmode=require` 参数

3. **网络连接是否正常**
   - 可以 ping 数据库服务器地址

4. **Prisma Client 是否最新**
   ```bash
   npm run db:generate
   ```

---

**🎯 修复完成后，你应该能够：**
- ✅ 访问 `/api/health` 看到 "healthy" 状态
- ✅ 访问 `/api/profile` 看到用户数据
- ✅ 访问 `/api/library` 看到书架数据
- ✅ 所有数据库查询正常工作
- ✅ 不再看到 "Application error" 页面

---

## 🛡️ 防止问题再次发生

### 新增的保护机制

我们已经实施了以下改进，确保数据库配置错误能被及早发现：

**1. 增强的环境变量验证** (`src/lib/validate-env.ts`)
```typescript
// ✅ 现在会检测并拒绝无效的 DATABASE_URL
❌ db.prisma.io (Prisma 示例地址)
❌ your-database-url (占位符)
❌ postgresql://... (未填写)

// ✅ 验证 URL 格式
postgresql://user:password@host:port/database
```

**启动时你会看到清晰的错误信息：**
```bash
# 如果配置错误，应用将拒绝启动
❌ DATABASE_URL 配置错误:
   DATABASE_URL contains invalid placeholder: "db.prisma.io"

💡 解决方案:
   1. 访问 Vercel Dashboard -> Storage -> Postgres
   2. 点击 ".env.local" 标签
   3. 复制正确的 DATABASE_URL
   4. 更新 .env 文件
   5. 重启开发服务器

⚠️  当前 DATABASE_URL 包含: db.prisma.io (这是错误的示例地址!)
```

**2. 数据库连接测试** (开发环境自动运行)
```bash
# 启动时自动测试连接
✅ 所有环境变量验证通过
✅ 数据库连接测试成功

# 如果连接失败
❌ 数据库连接失败:
   Can't reach database server at `db.prisma.io:5432`

💡 这通常意味着:
   1. DATABASE_URL 配置错误
   2. 数据库服务器不可达
   3. 网络连接问题
```

**3. 统一的 API 错误处理** (`src/lib/api-error-handler.ts`)

所有 API routes 现在使用统一的错误处理：
```typescript
// ✅ 自动捕获 Prisma 错误
// ✅ 返回友好的错误信息
// ✅ 隐藏敏感信息（生产环境）

// P1001 错误会自动转换为:
{
  "error": "Database connection failed. Please contact support.",
  "code": "DATABASE_CONNECTION_ERROR"
}
```

**4. 用户友好的错误页面** (`src/app/error.tsx`)

如果数据库错误导致页面崩溃，用户会看到：
- 🎨 美观的错误页面（而不是白屏）
- 📋 清晰的错误说明和修复步骤
- 🔄 "重试" 按钮
- 🏠 "返回首页" 链接
- 📖 指向修复指南的链接

### 最佳实践

**开发环境：**
```bash
# 1. 使用 .env 文件（项目已配置使用 .env）
cp .env.example .env

# 2. 填入真实配置
DATABASE_URL="postgresql://..."

# 3. 启动前验证
npm run dev

# 4. 检查启动日志
✅ 所有环境变量验证通过  # 应该看到这个
✅ 数据库连接测试成功      # 应该看到这个
```

**生产环境（Vercel）：**
```bash
# 1. 在 Vercel Dashboard 配置环境变量
Settings -> Environment Variables

# 2. 从 Vercel Postgres 直接获取
Storage -> Postgres -> .env.local

# 3. 部署后测试
curl https://your-app.vercel.app/api/health

# 应该返回:
{
  "status": "healthy",
  "database": "connected",
  "responseTime": "50ms"
}
```

### 监控建议

**1. 定期检查健康状态**
```bash
# 设置定时任务或监控服务
curl https://your-app.vercel.app/api/health

# 如果返回 503，立即检查数据库配置
```

**2. 查看应用日志**
```bash
# Vercel Dashboard -> Deployments -> Logs
# 搜索关键词: "DATABASE_URL" 或 "P1001"
```

**3. 错误追踪**

考虑集成错误追踪服务（如 Sentry）：
```typescript
// 自动捕获和报告错误
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN })
}
```

---

## 📞 仍需帮助？

如果按照以上所有步骤仍无法解决问题：

1. **检查启动日志** - 查看具体的错误信息
2. **验证网络连接** - 确保可以访问数据库服务器
3. **测试 DATABASE_URL** - 使用 `psql` 命令行工具测试连接
4. **查看 Vercel 状态** - https://www.vercel-status.com/
5. **联系支持** - 提供完整的错误日志

---

**版本:** v2.0 (增强保护)
**更新:** 2025-11-11
**改进:**
- ✅ 增强环境变量验证
- ✅ 自动数据库连接测试
- ✅ 统一 API 错误处理
- ✅ 用户友好错误页面
