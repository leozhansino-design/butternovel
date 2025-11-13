# Admin 认证中间件使用指南

## 📦 新增文件

**`src/lib/admin-middleware.ts`** - 统一的 Admin 认证中间件

---

## ✅ 已重构的文件

- ✅ `src/app/api/admin/novels/route.ts` (POST, GET)

---

## 🔧 使用方法

### 基本用法

**之前 (重复代码):**
```typescript
export async function POST(request: Request) {
  // ❌ 每个文件都要写这些代码
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 业务逻辑...
}
```

**之后 (使用中间件):**
```typescript
import { withAdminAuth } from '@/lib/admin-middleware'

export const POST = withAdminAuth(async (session, request: Request) => {
  // ✅ session 已验证,直接使用
  // 业务逻辑...
})
```

**节省代码:** 每个 API 路由节省 6-8 行

---

## 📝 需要重构的文件列表 (18+ 个)

### Admin API 路由

1. ✅ `src/app/api/admin/novels/route.ts` (已完成)
2. ⏳ `src/app/api/admin/novels/[id]/route.ts` (PUT, DELETE)
3. ⏳ `src/app/api/admin/novels/[id]/ban/route.ts` (POST)
4. ⏳ `src/app/api/admin/chapters/route.ts` (POST)
5. ⏳ `src/app/api/admin/chapters/[id]/route.ts` (PUT, DELETE)
6. ⏳ `src/app/api/admin/profile/route.ts` (GET, POST)
7. ⏳ `src/app/api/admin/stats/route.ts` (GET, POST - 已优化,待添加中间件)

---

## 🔄 逐步重构指南

### 步骤 1: 更新 import

```typescript
// 移除
import { getAdminSession } from '@/lib/admin-auth'

// 添加
import { withAdminAuth } from '@/lib/admin-middleware'
```

### 步骤 2: 修改函数签名

```typescript
// 之前
export async function POST(request: Request) {

// 之后
export const POST = withAdminAuth(async (session, request: Request) => {
```

### 步骤 3: 移除手动认证检查

```typescript
// 删除这些代码
const session = await getAdminSession()
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### 步骤 4: 修改函数结束

```typescript
// 之前
  } catch (error) {
    // ...
  }
}  // ← 单个 }

// 之后
  } catch (error) {
    // ...
  }
})  // ← 改为 })
```

---

## 🎯 完整示例

### 示例 1: 简单的 POST 请求

```typescript
import { withAdminAuth } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'

export const POST = withAdminAuth(async (session, request: Request) => {
  try {
    const body = await request.json()

    // 可以直接使用 session.email, session.id 等
    console.log('Admin:', session.email)

    // 业务逻辑...
    const result = await prisma.someModel.create({ data: body })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
})
```

### 示例 2: GET 请求

```typescript
export const GET = withAdminAuth(async (session, request: Request) => {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')

  const data = await prisma.someModel.findMany({
    skip: (page - 1) * 10,
    take: 10
  })

  return NextResponse.json({ data })
})
```

### 示例 3: DELETE 请求

```typescript
export const DELETE = withAdminAuth(async (session, request: Request) => {
  const { id } = await request.json()

  await prisma.someModel.delete({
    where: { id: parseInt(id) }
  })

  return NextResponse.json({ message: 'Deleted successfully' })
})
```

---

## 🔐 高级用法: 基于角色的权限控制

如果需要更细粒度的权限控制:

```typescript
import { withAdminRole } from '@/lib/admin-middleware'

// 只有 SUPER_ADMIN 和 ADMIN 可以删除
export const DELETE = withAdminRole(
  ['SUPER_ADMIN', 'ADMIN'],
  async (session, request: Request) => {
    // 只有具有相应角色的管理员才能执行
    await prisma.someModel.delete({ ... })
    return NextResponse.json({ success: true })
  }
)
```

---

## 📊 预期收益

### 代码减少

- 每个 API 路由: **6-8 行**
- 18 个文件: **~110 行** 总计

### 代码质量

- ✅ 统一的认证逻辑
- ✅ 更好的类型安全 (AdminSession 接口)
- ✅ 更容易维护
- ✅ 减少错误风险

### 可扩展性

- ✅ 轻松添加角色权限检查
- ✅ 可以添加日志记录
- ✅ 可以添加速率限制
- ✅ 统一的错误处理

---

## ⚠️ 注意事项

1. **session 参数顺序**:
   - 第一个参数必须是 `session`
   - 第二个参数是 `request`

2. **返回类型**:
   - 必须返回 `Response` 或 `NextResponse`

3. **错误处理**:
   - 中间件只处理认证错误
   - 业务逻辑错误仍需在 handler 中处理

4. **TypeScript 类型**:
   - `AdminSession` 接口提供完整的类型提示

---

## 🔄 批量重构脚本 (可选)

如果你想一次性重构所有文件,可以使用以下模式:

```bash
# 1. 找到所有需要重构的文件
find src/app/api/admin -name "*.ts" -type f

# 2. 逐个文件重构
# (手动或使用 IDE 重构工具)
```

---

## ✅ 重构检查清单

每个文件重构后检查:

- [ ] Import 语句已更新
- [ ] 函数签名使用 `export const` 而不是 `export async function`
- [ ] 第一个参数是 `session`
- [ ] 移除了手动的 `getAdminSession()` 调用
- [ ] 移除了手动的认证检查
- [ ] 函数结束使用 `})` 而不是 `}`
- [ ] TypeScript 编译通过
- [ ] 测试 API 工作正常

---

**创建日期:** 2025-11-13
**影响范围:** 18+ Admin API 路由
**预计节省:** ~110 行代码
