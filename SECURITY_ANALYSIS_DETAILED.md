# ButterNovel API 安全性分析报告

**分析日期**: 2025-11-15
**项目**: ButterNovel
**分析范围**: 所有 API routes 和相关库文件

---

## 执行摘要

本项目在安全性方面有一些好的实践，但也存在多个**高风险和中风险**的安全问题需要立即修复。

### 关键发现统计
- ⚠️ **高风险问题**: 3 个
- 🔴 **中风险问题**: 5 个  
- 🟡 **低风险问题**: 4 个
- ✅ **优势项**: 4 个

---

## 1. 权限验证 (Authorization)

### ✅ 优势项

**Admin 中间件实现** - `/src/lib/admin-middleware.ts`
- 使用了统一的 `withAdminAuth` 装饰器模式
- 正确验证了 Admin JWT token
- 支持基于角色的访问控制 (`withAdminRole`)

**用户操作权限** - `/src/app/api/paragraph-comments/[id]/route.ts` 
```typescript
if (comment.userId !== session.user.id) {
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```
✅ 正确验证了用户权限（评论作者或管理员）

---

### ⚠️ 问题 #1: [HIGH] Admin 密码硬编码在代码中

**位置**: `/src/app/api/admin/login/route.ts` (第 6-14 行)

```typescript
const ADMIN_ACCOUNTS = [
  {
    email: 'admin@butternovel.com',
    password: '$2b$10$Uv8oQom7iY.ifYFiVY9i4eXwSiEUngoQa14jGWvMxyS2c/hpSyZ5C',
    name: 'Admin',
    role: 'super_admin'
  },
]
```

**风险等级**: 🔴 **HIGH**

**问题描述**:
- Admin 密码（bcrypt hash）硬编码在源代码中
- 如果代码仓库被泄露或版本控制历史被访问，攻击者可获得 Admin 账户
- 这个 hash 对应的密码为已知值（代码注释中提到是 `mySecretPassword123`）

**修复建议**:
```typescript
// ❌ 不要这样做
const ADMIN_ACCOUNTS = [...]  // 硬编码

// ✅ 应该这样做
export async function POST(request: Request) {
  const { email, password } = await request.json()
  
  // 从数据库或加密的环境变量获取
  const adminAccount = await prisma.adminAccount.findUnique({
    where: { email }
  })
  
  if (!adminAccount || !await bcrypt.compare(password, adminAccount.passwordHash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  // ...
}
```

---

### ⚠️ 问题 #2: [MEDIUM] ADMIN_JWT_SECRET 默认值不安全

**位置**: `/src/lib/admin-auth.ts` (第 13-14 行)

```typescript
const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'butternovel-super-secret-key-min-32-characters-long-change-in-production'
)
```

**风险等级**: 🟡 **MEDIUM**

**问题描述**:
- 如果未设置 `ADMIN_JWT_SECRET` 环境变量，会使用硬编码的默认密钥
- 该默认密钥可能被泄露或猜测
- 允许攻击者伪造 Admin JWT tokens

**修复建议**:
```typescript
// ✅ 改进版
const secret = process.env.ADMIN_JWT_SECRET
if (!secret) {
  throw new Error('ADMIN_JWT_SECRET environment variable is required in production')
}
const secretBytes = new TextEncoder().encode(secret)
```

同时在 `validate-env.ts` 中添加检查：
```typescript
if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_JWT_SECRET) {
  throw new Error('Critical: ADMIN_JWT_SECRET is required in production')
}
```

---

### 🟡 问题 #3: [MEDIUM] Admin API 缺少某些权限检查

**位置**: `/src/app/api/admin/stats/route.ts`

**问题描述**:
- GET 和 POST 方法都使用了 `withAdminAuth`，但没有进一步的角色区分
- 目前没有区分 `super_admin` 和 `admin` 的权限级别

**修复建议**:
```typescript
export const GET = withAdminRole(['SUPER_ADMIN'], async (session, request) => {
  // 只有超级管理员可以查看统计
  // ...
})
```

---

## 2. 输入验证 (Input Validation)

### ✅ 优势项

**Zod Schema 验证** - `/src/lib/validators.ts`
- 对关键操作使用了 Zod 进行输入验证
- Novel、Chapter、Rating、Auth 操作都有相应的 schema
- 字符长度限制合理

**API 中的验证调用** - `/src/app/api/admin/novels/route.ts`
```typescript
const validation = validateWithSchema(novelCreateSchema, body)
if (!validation.success) {
  return NextResponse.json(
    { error: validation.error, details: validation.details },
    { status: 400 }
  )
}
```

---

### 🟡 问题 #4: [MEDIUM] 某些参数未被验证

**位置**: `/src/app/api/admin/users/route.ts` (第 26-27 行)

```typescript
const sortBy = searchParams.get('sortBy') || 'createdAt'
const sortOrder = searchParams.get('sortOrder') || 'desc'

// 直接使用在 Prisma orderBy 中
const orderBy: any = {}
orderBy[sortBy] = sortOrder  // ⚠️ 潜在问题
```

**风险等级**: 🟡 **MEDIUM**

**问题描述**:
- `sortBy` 和 `sortOrder` 参数未被验证
- 虽然 Prisma 不容易受到 SQL 注入（因为使用 ORM），但可能导致意外行为
- 如果 `sortBy` 是不存在的字段，会导致数据库错误

**修复建议**:
```typescript
const ALLOWED_SORT_FIELDS = ['createdAt', 'email', 'name', 'updatedAt']
const sortBy = searchParams.get('sortBy') || 'createdAt'
const sortOrder = searchParams.get('sortOrder') || 'desc'

if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
  return errorResponse('Invalid sortBy field', ErrorCode.BAD_REQUEST)
}

if (!['asc', 'desc'].includes(sortOrder)) {
  return errorResponse('Invalid sortOrder value', ErrorCode.BAD_REQUEST)
}

const orderBy: any = {}
orderBy[sortBy] = sortOrder
```

---

### 🟡 问题 #5: [MEDIUM] 评论内容长度验证仅在 API 中

**位置**: `/src/app/api/paragraph-comments/route.ts` (第 83-87 行)

```typescript
if (content.length > 1000) {
  return NextResponse.json(
    { error: 'Comment content too long (max 1000 characters)' },
    { status: 400 }
  )
}
```

**风险等级**: 🟡 **MEDIUM**

**问题描述**:
- 评论长度限制在 API 中硬编码为 1000 字符
- 但 `validators.ts` 中定义的 `WORD_LIMITS.COMMENT_MAX` 为 500 字符
- 两处定义不一致，容易导致数据验证问题

**修复建议**:
```typescript
// 在 validators.ts 中定义
export const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(WORD_LIMITS.COMMENT_MAX, 'Comment too long')
})

// 在 API 中使用
const validation = validateWithSchema(commentSchema, { content })
if (!validation.success) {
  return NextResponse.json({ error: validation.error }, { status: 400 })
}
```

---

### 🟡 问题 #6: [MEDIUM] 搜索参数可能导致大量返回

**位置**: `/src/app/api/admin/novels/route.ts` (第 205-206 行)

```typescript
const search = url.searchParams.get('search') || ''
// ...
where.OR = [
  { title: { contains: search, mode: 'insensitive' } },
  { authorName: { contains: search, mode: 'insensitive' } }
]
```

**风险等级**: 🟡 **MEDIUM**

**问题描述**:
- 空字符串搜索会导致 OR 条件，匹配所有记录
- 没有搜索长度限制
- 没有搜索频率限制

**修复建议**:
```typescript
const searchSchema = z.object({
  search: z.string().max(50, 'Search too long').optional(),
})

let search = ''
if (url.searchParams.get('search')) {
  const searchValidation = searchSchema.safeParse({ 
    search: url.searchParams.get('search')
  })
  if (!searchValidation.success) {
    return errorResponse('Invalid search', ErrorCode.VALIDATION_ERROR)
  }
  search = searchValidation.data.search || ''
}

if (search) {
  where.OR = [...]
}
```

---

## 3. 敏感数据处理 (Sensitive Data)

### ✅ 优势项

**密码处理** - `/src/app/api/auth/register/route.ts`
```typescript
const hashedPassword = await bcrypt.hash(password, 10)
const user = await prisma.user.create({
  data: {
    // ...
    password: hashedPassword,  // ✅ 正确：存储 hash，不是明文
  },
  select: {
    id: true,
    name: true,
    email: true,
    // ✅ 注意：select 中没有 password，不会返回
  },
})
```

**API 响应中选择字段** - 大多数 API 正确使用了 `select` 来限制返回字段
```typescript
select: {
  id: true,
  name: true,
  email: true,
  // ✅ 没有返回 password, googleId, facebookId 等敏感字段
}
```

---

### 🔴 问题 #7: [HIGH] Admin 详情 API 返回敏感信息

**位置**: `/src/app/api/admin/users/[id]/route.ts` (第 118-132 行)

```typescript
const userDetail = {
  // ...
  email: user.email,      // ✅ 可以
  googleId: user.googleId,  // ⚠️ OAuth IDs
  facebookId: user.facebookId,  // ⚠️ OAuth IDs
  authMethod: user.googleId ? 'google' : user.facebookId ? 'facebook' : 'email',
  // ...
}
```

**风险等级**: 🔴 **HIGH** (当返回给不同权限的用户时)

**问题描述**:
- 返回了 `googleId` 和 `facebookId`
- 这些字段不应该被暴露，除非必要
- 如果 API 被非授权用户访问，会泄露用户的第三方 OAuth IDs

**修复建议**:
```typescript
// 只在必要时返回
const userDetail = {
  id: user.id,
  email: user.email,
  name: user.name,
  // 不返回 googleId, facebookId
  authMethod: user.googleId ? 'google' : user.facebookId ? 'facebook' : 'email',
  // ...
}
```

---

### 🔴 问题 #8: [HIGH] 用户数据可能在公共 API 中泄露

**位置**: `/src/app/api/novels/[id]/ratings/route.ts` (第 64-71 行)

```typescript
include: {
  user: {
    select: {
      id: true,
      name: true,
      avatar: true,
      contributionPoints: true,
      level: true,
      // ⚠️ 没有检查用户隐私设置
    },
  },
},
```

**风险等级**: 🔴 **HIGH** (涉及隐私)

**问题描述**:
- 公开获取小说评分时返回了用户信息
- 没有检查用户的隐私设置 (`libraryPrivacy`)
- 可能在不知情的情况下暴露用户信息

**修复建议**:
```typescript
// 检查用户隐私设置
const userInfo = await prisma.user.findUnique({
  where: { id: userId },
  select: { libraryPrivacy: true }
})

if (userInfo?.libraryPrivacy === 'PRIVATE') {
  // 隐藏或部分隐藏用户信息
  return NextResponse.json({
    ratings: ratingsWithLikeStatus.map(r => ({
      ...r,
      user: {
        id: r.user.id,
        name: 'Anonymous',  // 隐藏真实名字
        avatar: null,
      }
    }))
  })
}
```

---

### 🟡 问题 #9: [MEDIUM] Session 中可能包含敏感数据

**位置**: `/src/lib/auth.ts` (第 224-231 行)

```typescript
async session({ session, token }) {
  if (token && session.user) {
    session.user.id = token.id as string
    session.user.email = token.email as string
    session.user.name = token.name as string
    session.user.image = token.picture as string
  }
  return session  // ✅ 看起来不错，但需要确保没有 password
}
```

**风险等级**: 🟡 **MEDIUM**

**问题描述**:
- Session 对象在客户端也可见
- 需要确保 NextAuth.js 不会意外包含密码字段
- 建议明确审查 JWT payload

**修复建议**:
```typescript
// 在 signIn callback 中
async signIn({ user, account }) {
  // 确保用户对象不包含密码
  if ((user as any).password) {
    delete (user as any).password
  }
  return true
}
```

---

## 4. 注入攻击风险 (Injection Attacks)

### ✅ 优势项

**使用 Prisma ORM** - 所有数据库查询都通过 Prisma
- Prisma 使用参数化查询，防止 SQL 注入
- 没有发现原始 SQL 查询（除了 `prisma.$queryRaw` 的两个案例）

**原始 SQL 查询安全** - `/src/app/api/admin/stats/route.ts` (第 128-159)
```typescript
const [novelsData, usersData, viewsData] = await Promise.all([
  prisma.$queryRaw<Array<{date: Date, count: bigint}>>`
    SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*) as count
    FROM "Novel"
    WHERE "createdAt" >= ${startDate}  // ✅ 参数化查询
      AND "isPublished" = true
      AND "isBanned" = false
    GROUP BY DATE_TRUNC('day', "createdAt")
  `,
  // ...
])
```
✅ 正确使用了参数化查询（模板字符串）

---

### 🟡 问题 #10: [MEDIUM] XSS 风险 - 用户内容未正确转义

**位置**: 各个 API 返回用户生成的内容

**风险等级**: 🟡 **MEDIUM**

**问题描述**:
- API 返回用户生成的内容（小说标题、评论、评分评论等）
- 这些内容最终在前端渲染时需要正确转义
- API 本身没有问题，但需要确保前端正确处理

**示例**:
```typescript
// API 返回这样的数据
{
  title: "<img src=x onerror='alert(1)'>",  // 恶意脚本
  content: "<!-- SQL injection attempt -->"
}

// 前端必须正确转义
// ✅ React 自动转义
<h1>{novel.title}</h1>  // React 会转义特殊字符

// ❌ 不要这样做
<h1 dangerouslySetInnerHTML={{__html: novel.title}} />
```

---

## 5. 文件上传安全 (File Upload)

### ✅ 优势项

**头像上传验证** - `/src/app/api/profile/avatar/route.ts`
```typescript
// 文件类型检查
if (!file.type.startsWith('image/')) {
  return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
}

// 文件大小限制
if (file.size > 512 * 1024) {
  return NextResponse.json({ error: 'File too large' }, { status: 400 })
}
```

**Cloudinary 处理** - 使用第三方服务处理图片
- 图片通过 Cloudinary 处理和存储
- 自动应用转换和优化
- 防止恶意文件存储

---

### 🟡 问题 #11: [MEDIUM] Base64 图片验证不完整

**位置**: `/src/app/api/paragraph-comments/route.ts` (第 94-106)

```typescript
if (image) {
  try {
    const base64Length = image.length - (image.indexOf(',') + 1)
    const sizeInBytes = (base64Length * 3) / 4
    const sizeInMB = sizeInBytes / (1024 * 1024)

    if (sizeInMB > 2) {
      return NextResponse.json({ error: 'Image size exceeds 2MB' }, { status: 400 })
    }
  } catch (error) {
    // ...
  }
}
```

**风险等级**: 🟡 **MEDIUM**

**问题描述**:
- Base64 大小计算可能不准确（使用的是粗略估算）
- 没有验证 Base64 字符串的有效性
- 没有验证图片的实际类型（仅依赖 data URL 前缀）

**修复建议**:
```typescript
// 使用之前的 validateBase64Image 函数
const imageValidation = validateBase64Image(image)
if (!imageValidation.valid) {
  return NextResponse.json({ error: imageValidation.error }, { status: 400 })
}

// 在 validators.ts 中改进
export function validateBase64Image(base64: string): { valid: boolean; error?: string } {
  // 检查格式
  const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/
  if (!base64Pattern.test(base64)) {
    return { valid: false, error: 'Invalid base64 image format' }
  }

  // 更准确的大小计算
  const base64Content = base64.split(',')[1]
  const binaryString = atob(base64Content)
  const sizeInBytes = binaryString.length
  
  if (sizeInBytes > IMAGE_LIMITS.MAX_SIZE) {
    return { valid: false, error: 'Image size exceeds 2MB' }
  }

  return { valid: true }
}
```

---

## 6. 错误处理和信息泄露 (Error Handling)

### ✅ 优势项

**统一错误处理** - `/src/lib/api-error-handler.ts`
- 使用 `withErrorHandling` 包装器处理错误
- 按环境区分错误信息：
  ```typescript
  error: process.env.NODE_ENV === 'development'
    ? error.message
    : 'An unexpected error occurred',
  ```

**Prisma 错误映射**
- 为不同的 Prisma 错误提供了人类可读的消息
- 避免泄露数据库结构信息

---

### 🟡 问题 #12: [MEDIUM] 某些 API 返回过详细的错误信息

**位置**: `/src/app/api/admin/novels/[id]/route.ts` (第 50-54)

```typescript
catch (error: any) {
  return NextResponse.json(
    { error: error.message || 'Failed to update ban status' },  // ⚠️ 直接返回错误消息
    { status: 500 }
  )
}
```

**风险等级**: 🟡 **MEDIUM**

**问题描述**:
- 某些 catch 块直接返回 `error.message`
- 在生产环境中可能泄露内部实现细节
- 没有使用 `withErrorHandling` 或其他错误处理函数

**修复建议**:
```typescript
// ❌ 不要
catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 })
}

// ✅ 应该这样
catch (error: any) {
  console.error('Error updating ban status:', error)
  return NextResponse.json(
    { error: 'Failed to update ban status' },
    { status: 500 }
  )
}
```

---

## 7. 安全缺陷总结

### 未实现的安全功能

**Rate Limiting** - 🔴 **HIGH**
- 没有发现任何 rate limiting 实现
- 暴力攻击（登录、评论、评分）没有保护
- 建议使用 `ratelimit` 库或 Redis 实现

**CORS 配置** - 🟡 **MEDIUM**
- 没有看到显式的 CORS 配置
- Next.js API routes 默认允许所有来源
- 建议配置严格的 CORS 策略

**CSRF 保护** - ✅ **Good**
- NextAuth.js 自动处理 CSRF 保护

**Content Security Policy (CSP)** - 🟡 **MEDIUM**
- 没有看到 CSP headers
- 需要在 next.config 或 middleware 中配置

**SQL Injection** - ✅ **Good**
- 使用 Prisma ORM，有参数化查询
- 没有直接的 SQL 拼接

---

## 修复优先级

### 🔴 立即修复 (Critical)

1. **问题 #1**: 移除硬编码的 Admin 密码和账户信息
   - 预计耗时: 2 小时
   - 影响: Admin 账户安全

2. **问题 #7**: 移除 Admin API 中的敏感数据返回
   - 预计耗时: 1 小时
   - 影响: 用户隐私

3. **问题 #8**: 添加隐私检查
   - 预计耗时: 2 小时
   - 影响: 用户数据保护

---

### 🟡 短期修复 (High Priority)

4. **问题 #2**: 强制 ADMIN_JWT_SECRET
   - 预计耗时: 1 小时

5. **问题 #4**: 验证排序参数
   - 预计耗时: 1 小时

6. **问题 #5**: 统一验证 schema
   - 预计耗时: 2 小时

7. **问题 #6**: 搜索参数限制
   - 预计耗时: 1 小时

8. **Rate Limiting**: 添加 rate limiting
   - 预计耗时: 4 小时
   - 影响: 保护 API 免受滥用

---

### 🟢 中期改进 (Medium Priority)

9. **问题 #9**: Session 数据审查
   - 预计耗时: 1 小时

10. **问题 #10**: XSS 防护指南
    - 预计耗时: 2 小时（文档）

11. **问题 #11**: Base64 验证改进
    - 预计耗时: 1 小时

12. **问题 #12**: 统一错误处理
    - 预计耗时: 2 小时

13. **CORS 配置**: 添加 CORS headers
    - 预计耗时: 1 小时

14. **CSP Headers**: 配置 CSP
    - 预计耗时: 2 小时

---

## 代码检查清单

- [ ] Admin 密码从代码中移除
- [ ] ADMIN_JWT_SECRET 必需的环保验证
- [ ] 排序参数白名单验证
- [ ] 搜索参数长度限制
- [ ] 评论长度验证一致
- [ ] Admin API 不返回 OAuth IDs
- [ ] 公开 API 检查用户隐私设置
- [ ] Rate limiting 已实现
- [ ] CORS 正确配置
- [ ] CSP headers 已设置
- [ ] 所有错误处理使用统一函数
- [ ] 敏感数据不在日志中
- [ ] Session 不包含密码

---

## 安全测试建议

### 手动测试

1. **Permission Tests**
   ```bash
   # 尝试用普通用户删除其他用户的评论
   # 尝试用普通用户访问 admin API
   # 尝试编辑其他用户的小说
   ```

2. **Input Validation Tests**
   ```bash
   # 注入特殊字符到 sortBy
   # 提交超长搜索字符串
   # 提交无效的 Base64 图片
   ```

3. **Authorization Tests**
   ```bash
   # 修改 JWT token
   # 伪造 Admin token
   # 使用过期的 token
   ```

### 自动化测试

- 添加集成测试，验证权限检查
- 添加输入验证测试
- 添加错误处理测试

---

## 安全编码最佳实践

### 通用原则

1. **最小权限原则** - 仅返回必要的字段
2. **安全默认** - 拒绝所有，然后允许特定的
3. **验证一切** - 不信任任何用户输入
4. **防御深度** - 多层防护
5. **错误处理** - 不要泄露内部信息

### 代码示例

```typescript
// ✅ 安全的 API handler 模板
export const POST = withAdminAuth(async (session, request) => {
  try {
    const body = await request.json()
    
    // 1. 验证输入
    const validation = validateWithSchema(schema, body)
    if (!validation.success) {
      return errorResponse(validation.error, ErrorCode.VALIDATION_ERROR)
    }
    
    // 2. 权限检查
    const resource = await prisma.resource.findUnique({
      where: { id: body.id }
    })
    if (resource.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return errorResponse('Forbidden', ErrorCode.FORBIDDEN)
    }
    
    // 3. 执行操作
    const result = await prisma.resource.update({
      where: { id: body.id },
      data: validation.data
    })
    
    // 4. 返回结果（只返回必要字段）
    return successResponse({
      id: result.id,
      // ... 仅返回必要的字段
    })
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error')
  }
})
```

