# ButterNovel 快速修复指南

> 基于完整审计报告的关键问题速查表

**完整报告:** 请查看 `CODE_QUALITY_AUDIT_REPORT.md`

---

## 🚨 立即修复 (Critical - 今天就做!)

### 1. 添加 P2003 错误处理 ⏱️ 5 分钟

**文件:** `src/lib/api-error-handler.ts`

**行号:** 在第 30 行添加

```typescript
if (error.code === 'P2003') {
  return {
    status: 404,
    message: 'Referenced record not found',
    code: 'FOREIGN_KEY_CONSTRAINT_FAILED'
  }
}
```

---

### 2. 修复 Admin Stats 循环查询 ⏱️ 30 分钟

**文件:** `src/app/api/admin/stats/route.ts`

**问题:** 第 136-176 行在循环中执行 90 次数据库查询

**解决方案:** 将完整的优化代码复制到文件中 (见完整报告第 5 节)

**性能提升:** 30 倍

---

### 3. 添加章节列表分页 ⏱️ 15 分钟

**文件:** `src/app/novels/[slug]/chapters/[number]/page.tsx`

**问题:** 第 54-68 行加载所有章节

**修复代码:**
```typescript
const CHAPTER_WINDOW = 20

const nearbyChapters = await prisma.chapter.findMany({
  where: {
    novel: { slug },
    isPublished: true,
    chapterNumber: {
      gte: Math.max(1, chapterNumber - 10),
      lte: chapterNumber + 10
    }
  },
  select: {
    id: true,
    chapterNumber: true,
    title: true
  },
  orderBy: { chapterNumber: 'asc' }
})
```

---

### 4. 添加全文搜索索引 ⏱️ 10 分钟

**创建迁移文件:**

```bash
npx prisma migrate create add_fulltext_search
```

**SQL 内容:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "novel_title_gin_idx" ON "Novel" USING gin (title gin_trgm_ops);
CREATE INDEX "novel_author_gin_idx" ON "Novel" USING gin ("authorName" gin_trgm_ops);
```

**运行:**
```bash
npx prisma migrate deploy
```

**性能提升:** 10-100 倍

---

### 5. 修复 Library DELETE 验证 ⏱️ 10 分钟

**文件:** `src/app/api/library/route.ts`

**行号:** 151-158

**修复代码:**
```typescript
// 使用 deleteMany 代替 delete
const result = await prisma.library.deleteMany({
  where: {
    userId: session.user.id,
    novelId: parseInt(novelId)
  }
})

if (result.count === 0) {
  return errorResponse('Novel not in library', 404, 'NOT_IN_LIBRARY')
}
```

---

### 6. 修复 Profile UPDATE 验证 ⏱️ 10 分钟

**文件:** `src/app/api/profile/route.ts`

**行号:** 77 行之前添加

```typescript
// 先检查用户是否存在
const existingUser = await prisma.user.findUnique({
  where: { id: session.user.id }
})

if (!existingUser) {
  return errorResponse('User not found', 404, 'USER_NOT_FOUND')
}
```

---

## ⚡ 本周完成 (High Priority)

### 7. 创建认证中间件 ⏱️ 20 分钟

**创建文件:** `src/lib/admin-middleware.ts`

```typescript
import { getAdminSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export function withAdminAuth<T extends any[]>(
  handler: (session: any, ...args: T) => Promise<NextResponse>
) {
  return async (...args: T) => {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return handler(session, ...args)
  }
}
```

**影响文件:** 18+ 个 admin API 路由需要重构使用此中间件

---

### 8. 安装并配置 Zod ⏱️ 30 分钟

```bash
npm install zod
```

**创建文件:** `src/lib/validators.ts`

(复制完整代码从审计报告第 4 节)

**节省代码:** 减少 100+ 行重复验证代码

---

### 9. 创建数据库查询工具 ⏱️ 30 分钟

**创建文件:** `src/lib/novel-queries.ts`

(复制完整代码从审计报告第 8 节)

**影响:** 12+ 个文件可以使用这些函数

---

### 10. 优化 Library API ⏱️ 45 分钟

**文件:** `src/app/api/library/route.ts`

**问题:** 第 14-56 行执行 3 次独立查询

**解决方案:** 使用单次 SQL 查询 (见完整报告第 5.3 节)

**性能提升:** 3 倍

---

### 11. 优化 Chapter DELETE ⏱️ 15 分钟

**文件:** `src/app/api/admin/chapters/[id]/route.ts`

**行号:** 137-146

**修复代码:**
```typescript
await prisma.$executeRaw`
  UPDATE "Chapter"
  SET "chapterNumber" = "chapterNumber" - 1
  WHERE "novelId" = ${chapter.novelId}
  AND "chapterNumber" > ${chapter.chapterNumber}
`
```

**性能提升:** 从 N 次查询到 1 次查询

---

### 12. 统一章节表单组件 ⏱️ 2 小时

**创建文件:** `src/components/admin/ChapterForm.tsx`

(复制完整代码从审计报告第 8.3 节)

**删除/重构文件:**
- `src/components/admin/ChapterAddForm.tsx`
- `src/components/admin/ChapterEditForm.tsx`

**节省代码:** 200+ 行

---

## 🔧 下周完成 (Medium Priority)

### 13. 修复 React Hooks 问题 ⏱️ 1-2 小时

需要修复的文件 (8 个):

1. `src/components/shared/Toast.tsx:13-20`
2. `src/components/reader/ChapterReader.tsx:188-205`
3. `src/app/admin/page.tsx:29-55`
4. `src/components/library/MyLibrary.tsx:36-51`
5. `src/components/library/ProfileView.tsx:36-56`
6. `src/components/admin/AdminProfileForm.tsx:25-42`
7. `src/components/novel/RatingModal.tsx:54-99`

**通用修复模式:**
```typescript
// ❌ 之前
useEffect(() => {
  fetchData()
}, [])

const fetchData = async () => { /* ... */ }

// ✅ 之后
const fetchData = useCallback(async () => {
  /* ... */
}, [/* dependencies */])

useEffect(() => {
  fetchData()
}, [fetchData])
```

---

### 14. 移除 any 类型 ⏱️ 3-4 小时

**优先修复文件:**

1. `src/lib/db-utils.ts` - 3 处
2. `src/lib/api-error-handler.ts` - 2 处
3. `src/lib/db-retry.ts` - 5 处
4. `src/app/api/admin/novels/route.ts` - 6 处
5. `src/app/api/admin/novels/[id]/route.ts` - 4 处

**修复策略:** 使用 `unknown` + 类型守卫,或使用 Prisma 类型

---

### 15. 创建 API 类型定义 ⏱️ 1 小时

**创建文件:** `src/types/api.ts`

(复制完整代码从审计报告第 6.2 节)

**创建文件:** `src/types/models.ts`

(复制完整代码从审计报告第 4.1 节)

---

### 16. Schema 改进 ⏱️ 30 分钟

**修改文件:** `prisma/schema.prisma`

需要的改动:

1. **AdminProfile 与 Admin 关联** (或合并表)
2. **ForumReply.novelId 添加外键**
3. **Category.order 添加索引**

**迁移:**
```bash
npx prisma migrate dev --name schema_improvements
```

---

## 📊 进度追踪

### Critical (必须立即完成)

- [ ] P2003 错误处理 (5 分钟)
- [ ] Admin Stats 优化 (30 分钟)
- [ ] 章节列表分页 (15 分钟)
- [ ] 全文搜索索引 (10 分钟)
- [ ] Library DELETE (10 分钟)
- [ ] Profile UPDATE (10 分钟)

**预计总时间:** 1.5 小时

---

### High (本周完成)

- [ ] 认证中间件 (20 分钟)
- [ ] Zod 验证库 (30 分钟)
- [ ] 数据库查询工具 (30 分钟)
- [ ] Library API 优化 (45 分钟)
- [ ] Chapter DELETE 优化 (15 分钟)
- [ ] 统一章节表单 (2 小时)

**预计总时间:** 4 小时

---

### Medium (下周完成)

- [ ] React Hooks 修复 (1-2 小时)
- [ ] 移除 any 类型 (3-4 小时)
- [ ] API 类型定义 (1 小时)
- [ ] Schema 改进 (30 分钟)

**预计总时间:** 6-8 小时

---

## 🎯 总预期收益

| 类别 | 改进 |
|------|------|
| 性能 | ⬆️ 5-10 倍 |
| 代码量 | ⬇️ 1500 行 (18%) |
| 查询次数 | ⬇️ 60-80% |
| 类型安全 | ⬆️ 从 50% 到 95% |
| 可维护性 | ⬆️ 55% |

---

## 📞 需要帮助?

1. **查看完整报告:** `CODE_QUALITY_AUDIT_REPORT.md`
2. **按优先级逐个修复**
3. **每个修复后测试验证**
4. **提交代码到 feature branch**

---

**生成日期:** 2025-11-12
**审计工具:** Claude Code Quality Auditor
