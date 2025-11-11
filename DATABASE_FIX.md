# 🔧 数据库连接错误修复指南

## ❌ 当前问题

```
Can't reach database server at `db.prisma.io:5432`
```

这是因为 `DATABASE_URL` 环境变量配置错误。

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
