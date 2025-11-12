# 数据库迁移指南 - 评分系统和标签功能

本次更新添加了小说评分系统和标签功能，需要对数据库进行迁移。

## 📋 迁移内容

### Novel 表新增字段
- `averageRating` - 平均评分（Float，可选）
- `totalRatings` - 评分总数（Integer，默认 0）
- `tags` - 标签数组（Text[]，默认空数组）

### 新增 Rating 表
- `id` - 主键（String）
- `score` - 评分（2/4/6/8/10）
- `review` - 评论内容（Text，可选）
- `createdAt` - 创建时间
- `updatedAt` - 更新时间
- `userId` - 用户ID（外键）
- `novelId` - 小说ID（外键）
- 唯一约束：每个用户只能对每部小说评分一次

---

## 🚀 方案一：自动迁移（推荐）

### 本地开发环境

1. **配置环境变量**
   ```bash
   # 如果还没有 .env 文件，复制示例文件
   cp .env.example .env

   # 编辑 .env 文件，配置 DATABASE_URL
   # 格式：postgresql://username:password@host:port/database
   ```

2. **运行迁移脚本**
   ```bash
   ./apply-migration.sh
   ```

   或者手动运行：
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

### Vercel 部署环境

1. **在 Vercel Dashboard 执行迁移**

   进入项目设置：
   ```
   Settings → Functions → Environment Variables
   ```

   确保已配置 `DATABASE_URL`

2. **使用 Vercel CLI**
   ```bash
   # 安装 Vercel CLI（如果还没安装）
   npm i -g vercel

   # 登录 Vercel
   vercel login

   # 拉取环境变量
   vercel env pull .env.local

   # 运行迁移
   DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2-) npx prisma migrate deploy
   ```

3. **重新部署项目**
   ```bash
   git push origin main
   # 或在 Vercel Dashboard 手动触发部署
   ```

---

## 🛠️ 方案二：手动执行 SQL

如果自动迁移失败，可以手动连接数据库执行 SQL：

### 1. 连接到数据库

**使用 psql：**
```bash
psql "your-database-url"
```

**使用 Vercel Postgres：**
在 Vercel Dashboard → Storage → Your Postgres → Data → SQL Editor

### 2. 执行以下 SQL

```sql
-- 1. 为 Novel 表添加新字段
ALTER TABLE "Novel"
ADD COLUMN "averageRating" DOUBLE PRECISION,
ADD COLUMN "totalRatings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. 创建 Rating 表
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "novelId" INTEGER NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- 3. 创建索引
CREATE INDEX "Rating_novelId_idx" ON "Rating"("novelId");
CREATE INDEX "Rating_createdAt_idx" ON "Rating"("createdAt");
CREATE UNIQUE INDEX "Rating_userId_novelId_key" ON "Rating"("userId", "novelId");

-- 4. 添加外键约束
ALTER TABLE "Rating"
ADD CONSTRAINT "Rating_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Rating"
ADD CONSTRAINT "Rating_novelId_fkey"
FOREIGN KEY ("novelId") REFERENCES "Novel"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
```

### 3. 验证迁移

```sql
-- 检查 Novel 表结构
\d "Novel"

-- 检查 Rating 表是否创建
\d "Rating"

-- 检查索引
\di
```

### 4. 重新生成 Prisma Client

```bash
npx prisma generate
```

---

## ✅ 验证迁移成功

### 1. 检查数据库

```bash
npx prisma studio
```

在 Prisma Studio 中：
- 打开 Novel 表，应该能看到新字段
- 应该能看到 Rating 表

### 2. 启动应用

```bash
npm run dev
```

访问任意小说详情页，应该能看到：
- ⭐ 封面下方的评分显示
- 🏷️ 状态下方的标签显示

### 3. 测试功能

1. **评分功能**
   - 点击 "Rate this novel"
   - 选择星星评分
   - 添加评论（可选）
   - 提交

2. **标签功能**（管理员）
   - 进入 Admin → Upload Novel
   - 应该能看到标签选择组件
   - 选择预设标签或添加自定义标签

---

## ⚠️ 常见问题

### Q: 迁移失败，提示连接数据库错误
**A:** 检查 DATABASE_URL 是否正确配置，格式为：
```
postgresql://username:password@host:port/database?sslmode=require
```

### Q: 提示 "column already exists"
**A:** 字段已经存在，跳过该步骤或删除后重试：
```sql
ALTER TABLE "Novel" DROP COLUMN IF EXISTS "averageRating";
ALTER TABLE "Novel" DROP COLUMN IF EXISTS "totalRatings";
ALTER TABLE "Novel" DROP COLUMN IF EXISTS "tags";
DROP TABLE IF EXISTS "Rating";
```

### Q: Vercel 部署后报错
**A:** 确保：
1. 在 Vercel 环境变量中配置了 DATABASE_URL
2. 已在数据库中执行迁移
3. 重新部署项目

### Q: Prisma Client 报错
**A:** 重新生成 Prisma Client：
```bash
npx prisma generate
rm -rf node_modules/.prisma
npm install
```

---

## 📞 需要帮助？

如果遇到问题：
1. 检查数据库连接是否正常
2. 查看完整的迁移 SQL：`prisma/migrations/20251112_add_rating_and_tags/migration.sql`
3. 查看 Prisma 文档：https://www.prisma.io/docs/guides/migrate

---

## 🎉 迁移完成后

新功能已启用：
- ✅ 用户可以为小说评分（2/4/6/8/10星）
- ✅ 用户可以撰写评论
- ✅ 小说详情页显示平均评分
- ✅ 管理员可以为小说添加标签
- ✅ 小说详情页显示标签

Happy Coding! 🚀
