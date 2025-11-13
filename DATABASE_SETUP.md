# ButterNovel 数据库设置指南

## 📋 前提条件

- PostgreSQL 数据库已安装
- DATABASE_URL 环境变量已配置

---

## 🚀 快速开始 (新数据库)

### 1. 推送 Prisma Schema 到数据库

```bash
npx prisma db push
```

这将:
- 创建所有表和关系
- 创建基本索引
- 不会创建迁移历史

### 2. 生成 Prisma Client

```bash
npx prisma generate
```

### 3. 添加全文搜索索引 (重要!)

运行我们创建的优化索引:

```bash
# 方法 A: 使用 psql (推荐)
psql $DATABASE_URL -f prisma/migrations/add_fulltext_search_indexes.sql

# 方法 B: 如果上面不工作,手动连接数据库后执行
psql $DATABASE_URL
\i prisma/migrations/add_fulltext_search_indexes.sql
\q
```

这将添加:
- `pg_trgm` 扩展 (三元组相似度匹配)
- `novel_title_gin_idx` 索引 (优化 title 搜索)
- `novel_author_gin_idx` 索引 (优化 authorName 搜索)

**性能提升:** 10-100倍 (模糊搜索)

---

## 🔍 验证设置

### 检查表是否已创建

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

应该看到:
- Admin
- AdminProfile
- Category
- Chapter
- ChapterProgress
- Comment
- ForumPost
- ForumReply
- Library
- Novel
- NovelLike
- NovelView
- Rating
- ReadingHistory
- User
- _prisma_migrations

### 检查索引是否已创建

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Novel'
ORDER BY indexname;
```

应该看到:
- ✅ `novel_title_gin_idx` (全文搜索)
- ✅ `novel_author_gin_idx` (全文搜索)
- ✅ `Novel_authorId_idx`
- ✅ `Novel_categoryId_idx`
- ✅ 其他自动创建的索引

### 检查扩展是否已安装

```sql
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'pg_trgm';
```

应该看到:
```
 extname | extversion
---------+------------
 pg_trgm | 1.6
```

---

## 📊 可选: 添加种子数据

如果需要测试数据:

```bash
# 创建 seed 脚本 (如果还没有)
# 然后运行
npx prisma db seed
```

---

## 🔧 常见问题

### Q: psql 命令找不到?

**Windows:**
```bash
# 找到 PostgreSQL bin 目录,例如:
"C:\Program Files\PostgreSQL\16\bin\psql.exe" $env:DATABASE_URL -f prisma/migrations/add_fulltext_search_indexes.sql
```

**Mac (Homebrew):**
```bash
/usr/local/bin/psql $DATABASE_URL -f prisma/migrations/add_fulltext_search_indexes.sql
```

### Q: DATABASE_URL 格式?

```bash
# .env 文件
DATABASE_URL="postgresql://user:password@localhost:5432/butternovel?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/butternovel?schema=public"
```

### Q: 权限错误 (cannot create extension)?

需要超级用户权限创建扩展:

```bash
# 使用 postgres 超级用户连接
psql -U postgres -d butternovel

# 然后运行
CREATE EXTENSION IF NOT EXISTS pg_trgm;

# 退出后使用普通用户创建索引
psql $DATABASE_URL -f prisma/migrations/add_fulltext_search_indexes.sql
```

### Q: 索引创建失败?

检查表中是否有数据:

```sql
SELECT COUNT(*) FROM "Novel";
```

如果表为空,索引仍会创建,只是没有数据可索引。

---

## 🔄 重置数据库 (谨慎!)

如果需要完全重置:

```bash
# ⚠️ 这将删除所有数据!
npx prisma migrate reset

# 或手动
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# 然后重新开始设置
npx prisma db push
npx prisma generate
psql $DATABASE_URL -f prisma/migrations/add_fulltext_search_indexes.sql
```

---

## ✅ 设置完成检查清单

- [ ] 运行 `npx prisma db push`
- [ ] 运行 `npx prisma generate`
- [ ] 执行 `add_fulltext_search_indexes.sql`
- [ ] 验证表已创建 (16 张表)
- [ ] 验证索引已创建 (`novel_title_gin_idx`, `novel_author_gin_idx`)
- [ ] 验证 `pg_trgm` 扩展已安装
- [ ] 应用可以连接到数据库
- [ ] 可以创建第一个用户/管理员

---

## 📚 相关文档

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [GIN Indexes](https://www.postgresql.org/docs/current/gin-intro.html)

---

**创建日期:** 2025-11-13
**版本:** 1.0
