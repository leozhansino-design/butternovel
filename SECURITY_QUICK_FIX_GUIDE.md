# ButterNovel API 安全问题快速修复指南

## 🔴 立即修复 (Critical)

### 问题 1: Admin 密码硬编码

**文件**: `/src/app/api/admin/login/route.ts`

**当前代码**:
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

**修复步骤**:

1. 创建数据库表存储 admin 账户：
```sql
CREATE TABLE IF NOT EXISTS "AdminAccount" (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. 更新 Prisma schema:
```prisma
model AdminAccount {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          String    @default("ADMIN")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

3. 更新 API 代码：
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 从数据库获取 admin 账户
    const admin = await prisma.adminAccount.findUnique({
      where: { email }
    })
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, admin.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 创建 JWT
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!)
    const token = await new SignJWT({
      email: admin.email,
      name: admin.name,
      role: admin.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    const response = NextResponse.json({
      success: true,
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

4. 初始化数据库中的 admin 账户（仅需运行一次）：
```typescript
// 可以创建一个迁移脚本
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

async function initAdminAccount() {
  const passwordHash = await bcrypt.hash('CHANGE_THIS_PASSWORD', 10)
  
  await prisma.adminAccount.create({
    data: {
      email: 'admin@butternovel.com',
      passwordHash,
      name: 'Admin',
      role: 'SUPER_ADMIN'
    }
  })
}
```

---

### 问题 2: OAuth IDs 泄露

**文件**: `/src/app/api/admin/users/[id]/route.ts`

**当前问题行**:
```typescript
googleId: user.googleId,      // ⚠️ 移除此行
facebookId: user.facebookId,  // ⚠️ 移除此行
```

**修复**:
```typescript
const userDetail = {
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatar,
  bio: user.bio,
  role: user.role,
  // ✅ 只返回认证方法，不返回 IDs
  authMethod: user.googleId
    ? 'google'
    : user.facebookId
    ? 'facebook'
    : 'email',
  // ... 其他字段
  // ❌ 不返回 googleId 和 facebookId
}
```

---

### 问题 3: 隐私检查

**文件**: `/src/app/api/novels/[id]/ratings/route.ts`

**修复**:
```typescript
// 在 GET 方法中添加隐私检查
ratings = await prisma.rating.findMany({
  where: { novelId, review: { not: null } },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        avatar: true,
        libraryPrivacy: true,  // ✅ 获取隐私设置
        contributionPoints: true,
        level: true,
      }
    }
  },
  // ...
})

// 处理隐私设置
const ratingsWithLikeStatus = await Promise.all(
  ratings.map(async (rating) => {
    // ... 现有代码 ...
    
    // ✅ 检查隐私设置
    const userLibraryPrivacy = rating.user.libraryPrivacy
    let userData = rating.user

    if (userLibraryPrivacy === 'PRIVATE') {
      userData = {
        id: rating.user.id,
        name: 'Anonymous',  // 隐藏名字
        avatar: null,       // 隐藏头像
        contributionPoints: 0,
        level: 0,
        libraryPrivacy: 'PRIVATE'
      }
    }

    return {
      ...rating,
      user: userData,
      // ... 其他字段
    }
  })
)
```

---

## 🟡 高优先级修复 (1-2 周)

### 问题 5: ADMIN_JWT_SECRET 强制验证

**文件**: `/src/lib/admin-auth.ts` 和 `/src/lib/validate-env.ts`

**修复**:

1. 修改 `/src/lib/admin-auth.ts`:
```typescript
export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')

  if (!token) {
    return null
  }

  try {
    const secret = process.env.ADMIN_JWT_SECRET
    
    // ✅ 强制检查
    if (!secret) {
      throw new Error('ADMIN_JWT_SECRET is not configured')
    }

    const secretBytes = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token.value, secretBytes)

    return {
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    }
  } catch (error) {
    console.error('Admin session validation failed:', error)
    return null
  }
}
```

2. 修改 `/src/lib/validate-env.ts`:
```typescript
const requiredVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET,  // ✅ 添加此行
  // ... 其他必需变量
}

if (process.env.NODE_ENV === 'production') {
  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(
      `Missing critical environment variables in production: ${missingVars.join(', ')}`
    )
  }
}
```

---

### 问题 6: 排序参数验证

**文件**: `/src/app/api/admin/users/route.ts`

**修复**:
```typescript
const ALLOWED_SORT_FIELDS = ['createdAt', 'email', 'name', 'updatedAt', 'isVerified']

// 验证 sortBy
let sortBy = searchParams.get('sortBy') || 'createdAt'
let sortOrder = searchParams.get('sortOrder') || 'desc'

if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
  return NextResponse.json(
    { error: 'Invalid sortBy field' },
    { status: 400 }
  )
}

if (!['asc', 'desc'].includes(sortOrder)) {
  return NextResponse.json(
    { error: 'Invalid sortOrder value' },
    { status: 400 }
  )
}

const orderBy: any = {}
orderBy[sortBy] = sortOrder
```

---

### 问题 7: 搜索参数限制

**文件**: `/src/app/api/admin/novels/route.ts`

**修复**:
```typescript
const search = url.searchParams.get('search') || ''

// ✅ 验证搜索长度
if (search.length > 50) {
  return NextResponse.json(
    { error: 'Search query too long (max 50 characters)' },
    { status: 400 }
  )
}

const where: any = {}

// ✅ 仅当有搜索内容时才添加 OR 条件
if (search.trim()) {
  where.OR = [
    { title: { contains: search, mode: 'insensitive' } },
    { authorName: { contains: search, mode: 'insensitive' } }
  ]
}
```

---

### 问题 8: Schema 一致性

**文件**: `/src/lib/validators.ts` 和 `/src/app/api/paragraph-comments/route.ts`

**修复 validators.ts**:
```typescript
// 添加评论 schema
export const commentSchema = z.object({
  novelId: z.coerce.number().int().positive(),
  chapterId: z.coerce.number().int().positive(),
  paragraphIndex: z.coerce.number().int().min(0),
  content: z.string()
    .min(1, 'Comment content cannot be empty')
    .max(WORD_LIMITS.COMMENT_MAX, `Comment must be ${WORD_LIMITS.COMMENT_MAX} characters or less`),
  image: z.string().optional(),
})
```

**修复 API**:
```typescript
// 在 paragraph-comments/route.ts 中
const body = await request.json()

// ✅ 使用 Zod 验证
const validation = validateWithSchema(commentSchema, body)
if (!validation.success) {
  return NextResponse.json(
    { error: validation.error, details: validation.details },
    { status: 400 }
  )
}

const { novelId, chapterId, paragraphIndex, content, image } = validation.data

// 现在可以安全地使用这些值
// ... 创建评论
```

---

### 问题 9: Base64 图片验证

**文件**: `/src/lib/validators.ts`

**改进函数**:
```typescript
export function validateBase64Image(base64: string): { valid: boolean; error?: string } {
  try {
    // 1. 检查格式
    const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/
    if (!base64Pattern.test(base64)) {
      return {
        valid: false,
        error: 'Invalid image format. Must be JPEG, PNG, or WebP'
      }
    }

    // 2. 提取 base64 内容
    const base64Content = base64.split(',')[1]
    if (!base64Content) {
      return {
        valid: false,
        error: 'Invalid base64 encoding'
      }
    }

    // 3. 计算大小（更准确）
    const binaryString = atob(base64Content)
    const sizeInBytes = binaryString.length
    
    if (sizeInBytes > IMAGE_LIMITS.MAX_SIZE) {
      const maxMB = IMAGE_LIMITS.MAX_SIZE / 1024 / 1024
      return {
        valid: false,
        error: `Image too large. Maximum size: ${maxMB}MB`
      }
    }

    // 4. 基础有效性检查
    // 注：真正的验证应该在 Cloudinary 端进行
    if (sizeInBytes < 100) {
      return {
        valid: false,
        error: 'Image file is too small'
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid base64 image'
    }
  }
}
```

在 API 中使用：
```typescript
if (image) {
  const imageValidation = validateBase64Image(image)
  if (!imageValidation.valid) {
    return NextResponse.json(
      { error: imageValidation.error },
      { status: 400 }
    )
  }
  // 继续上传...
}
```

---

## 🟢 中期改进 (1-2 个月)

### Rate Limiting 实现

使用 Vercel 的 `@vercel/ratelimit`:

```bash
npm install @vercel/ratelimit
```

创建 `/src/lib/rate-limit.ts`:
```typescript
import { Ratelimit } from '@vercel/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// 登录限流：5 分钟内 5 次尝试
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '5 m'),
  analytics: true,
})

// 注册限流：1 小时内 3 次
export const registerRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
})

// 评论限流：1 小时内 20 条
export const commentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
})
```

在 API 中使用：
```typescript
import { loginRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  const { success, limit, reset, remaining } = await loginRateLimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    )
  }

  // ... 处理登录
}
```

---

## 测试清单

运行以下测试确认修复：

```bash
# 测试 #1: Admin 密码修复
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@butternovel.com","password":"CHANGE_THIS_PASSWORD"}'

# 测试 #2: OAuth IDs 不在响应中
curl -X GET http://localhost:3000/api/admin/users/[userId] \
  -H "Cookie: admin-token=..." | grep -i "googleid\|facebookid"
# 应该返回空（即 googleId/facebookId 不在响应中）

# 测试 #3: 排序参数验证
curl "http://localhost:3000/api/admin/users?sortBy=invalid_field"
# 应返回 400 错误

# 测试 #4: 搜索长度限制
curl "http://localhost:3000/api/admin/novels?search=`python3 -c 'print(\"a\"*100)'`"
# 应返回 400 错误

# 测试 #5: Rate limiting (如果已实现)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/admin/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@butternovel.com","password":"wrong"}'
done
# 应在第 6 次请求时返回 429
```

---

## 文件清单

需要修改的文件：
- [ ] `/src/app/api/admin/login/route.ts` - 使用数据库存储 admin 账户
- [ ] `/src/app/api/admin/users/[id]/route.ts` - 移除 OAuth IDs
- [ ] `/src/app/api/novels/[id]/ratings/route.ts` - 添加隐私检查
- [ ] `/src/lib/admin-auth.ts` - 强制 ADMIN_JWT_SECRET
- [ ] `/src/lib/validate-env.ts` - 环境变量验证
- [ ] `/src/app/api/admin/users/route.ts` - 排序参数验证
- [ ] `/src/app/api/admin/novels/route.ts` - 搜索参数限制
- [ ] `/src/lib/validators.ts` - 添加评论 schema
- [ ] `/src/app/api/paragraph-comments/route.ts` - 使用 schema 验证
- [ ] `/src/lib/rate-limit.ts` - 创建新文件（Rate limiting）

---

## 后续工作

完成上述修复后：

1. **运行测试**: `npm test` 或手动测试
2. **代码审查**: 让团队审查安全修改
3. **部署**: 先在测试环境验证，再部署生产
4. **监控**: 监控是否有安全相关的错误日志
5. **文档**: 更新 API 文档，记录安全最佳实践

