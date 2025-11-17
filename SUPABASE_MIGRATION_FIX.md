# Supabase + Prisma 迁移问题修复指南

## 问题说明

Supabase提供两种数据库连接模式：
- **Transaction Mode (端口6543)**: 连接池，适合应用运行时
- **Session Mode (端口5432)**: 直接连接，适合数据库迁移

Prisma的迁移命令需要Session Mode，否则会卡住无响应。

## 解决方案

### 1. 在 `.env` 文件中配置两个数据库URL

```env
# 应用运行时使用 - Transaction Mode (连接池，端口6543)
DATABASE_URL="postgresql://postgres.[your-project-ref]:[password]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 迁移命令使用 - Session Mode (直接连接，端口5432)
DIRECT_URL="postgresql://postgres.[your-project-ref]:[password]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

**关键差异**:
- `DATABASE_URL`: 端口 **6543** + `?pgbouncer=true` 参数
- `DIRECT_URL`: 端口 **5432** + 无pgbouncer参数

### 2. 获取正确的连接字符串

从Supabase控制台获取：
1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击左侧 **Settings** → **Database**
4. 在 **Connection String** 部分：
   - **Transaction Mode**: 复制为 `DATABASE_URL`（带pgbouncer=true）
   - **Session Mode**: 复制为 `DIRECT_URL`（去掉pgbouncer参数）

### 3. 示例配置

假设你的项目信息：
- Project Ref: `abcdefghijklmnop`
- Password: `your_password_here`
- Region: `us-east-2`

```env
# .env 文件示例
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:your_password_here@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.abcdefghijklmnop:your_password_here@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

### 4. 验证配置

配置完成后，运行以下命令测试：

```bash
# 1. 生成Prisma Client
npx prisma generate

# 2. 运行迁移（应该不会再卡住）
npx prisma migrate deploy

# 或者开发环境
npx prisma migrate dev

# 3. 推送schema更改
npx prisma db push
```

## 常见问题

### Q1: 为什么需要两个URL？
A:
- 应用运行时需要连接池(6543)来处理大量并发请求
- 迁移操作需要直接连接(5432)来执行长时间的DDL操作

### Q2: 如果只配置一个URL可以吗？
A:
- 如果只用5432：可以迁移，但应用性能会下降（无连接池）
- 如果只用6543：应用正常，但迁移会卡住

### Q3: Vercel部署时需要注意什么？
A:
在Vercel环境变量中只配置 `DATABASE_URL` (6543端口)即可，因为生产环境不需要运行迁移。迁移在本地或CI/CD中完成。

## 修改的文件

已更新 `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // 用于迁移命令
}
```

## 下一步

1. ✅ 在本地 `.env` 文件中添加 `DIRECT_URL` 配置
2. ✅ 确保两个URL的密码、project ref都正确
3. ✅ 运行 `npx prisma migrate deploy` 执行Tags功能的数据库迁移
4. ✅ 测试应用功能是否正常

---

**参考文档**:
- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
