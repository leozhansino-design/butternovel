# Zod 验证使用指南

## 📦 安装完成

- ✅ Zod 已安装 (`npm install zod`)
- ✅ 验证工具文件已创建 (`src/lib/validators.ts`)

---

## 🎯 使用示例

### 示例 1: API 路由中验证请求数据

**文件:** `src/app/api/admin/novels/route.ts`

**之前 (手动验证):**
```typescript
export async function POST(request: Request) {
  const body = await request.json()
  const { title, coverImage, categoryId, blurb } = body

  // ❌ 手动验证,容易遗漏
  if (!title || !coverImage || !categoryId || !blurb) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  if (title.length > 120) {
    return NextResponse.json(
      { error: 'Title too long' },
      { status: 400 }
    )
  }

  // ... 更多验证
}
```

**之后 (使用 Zod):**
```typescript
import { validateWithSchema, novelCreateSchema } from '@/lib/validators'

export async function POST(request: Request) {
  const body = await request.json()

  // ✅ 统一验证,自动检查所有规则
  const validation = validateWithSchema(novelCreateSchema, body)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error,
        details: validation.details
      },
      { status: 400 }
    )
  }

  const data = validation.data // 类型安全!
  // data.title, data.coverImage 等都有正确的类型
}
```

---

### 示例 2: 章节创建验证

```typescript
import { validateWithSchema, chapterCreateSchema } from '@/lib/validators'

export const POST = withAdminAuth(async (session, request: Request) => {
  const body = await request.json()

  const validation = validateWithSchema(chapterCreateSchema, body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { novelId, title, content, chapterNumber, isPublished } = validation.data

  // 现在可以安全使用,所有字段都已验证
  const chapter = await prisma.chapter.create({
    data: {
      novelId,
      title,
      content,
      chapterNumber,
      isPublished: isPublished ?? true,
      wordCount: countWords(content)
    }
  })

  return NextResponse.json({ success: true, chapter })
})
```

---

### 示例 3: 评分验证

```typescript
import { validateWithSchema, ratingSchema } from '@/lib/validators'

export async function POST(request: Request) {
  const body = await request.json()

  const validation = validateWithSchema(ratingSchema, body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { score, review } = validation.data
  // score 已经验证是 2, 4, 6, 8, 10 之一
  // review 已经验证长度 <= 1000
}
```

---

### 示例 4: 用户注册验证

```typescript
import { validateWithSchema, registerSchema } from '@/lib/validators'

export async function POST(request: Request) {
  const body = await request.json()

  const validation = validateWithSchema(registerSchema, body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { email, password, name } = validation.data
  // email 已验证格式
  // password 已验证长度 6-50
}
```

---

### 示例 5: 客户端图片验证

```typescript
import { validateImage } from '@/lib/validators'

// 在文件上传组件中
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  const validation = await validateImage(file, 'cover')

  if (!validation.valid) {
    alert(validation.error)
    return
  }

  // 图片验证通过,继续上传
  // ...
}
```

---

### 示例 6: 字数验证

```typescript
import { countWords, validateWordCount, WORD_LIMITS } from '@/lib/validators'

// 在章节编辑组件中
const [content, setContent] = useState('')

const wordValidation = validateWordCount(content, WORD_LIMITS.CHAPTER_WORDS_MAX)

<div>
  <textarea
    value={content}
    onChange={(e) => setContent(e.target.value)}
  />

  <div className={wordValidation.valid ? 'text-gray-500' : 'text-red-500'}>
    字数: {wordValidation.count} / {WORD_LIMITS.CHAPTER_WORDS_MAX}
    {!wordValidation.valid && ` (${wordValidation.error})`}
  </div>
</div>
```

---

## 📋 可用的 Schemas

### Novel (小说)
- `novelCreateSchema` - 创建小说
- `novelUpdateSchema` - 更新小说

### Chapter (章节)
- `chapterCreateSchema` - 创建章节
- `chapterUpdateSchema` - 更新章节

### Rating (评分)
- `ratingSchema` - 评分验证

### Auth (认证)
- `registerSchema` - 用户注册
- `loginSchema` - 用户登录

### Profile (用户资料)
- `profileUpdateSchema` - 更新资料

---

## 🎨 自定义错误消息

Zod 支持自定义错误消息:

```typescript
export const customSchema = z.object({
  title: z.string()
    .min(1, { message: '标题不能为空' })
    .max(120, { message: '标题太长了!' }),

  email: z.string()
    .email({ message: '请输入正确的邮箱格式' }),

  age: z.number()
    .int({ message: '年龄必须是整数' })
    .positive({ message: '年龄必须是正数' })
    .refine(
      (val) => val >= 18,
      { message: '必须年满18岁' }
    )
})
```

---

## 🔧 高级用法

### 条件验证

```typescript
const advancedSchema = z.object({
  type: z.enum(['user', 'admin']),
  password: z.string()
}).superRefine((data, ctx) => {
  // 如果是 admin,密码必须至少 10 位
  if (data.type === 'admin' && data.password.length < 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Admin password must be at least 10 characters',
      path: ['password']
    })
  }
})
```

### 转换数据

```typescript
const transformSchema = z.object({
  novelId: z.string().transform((val) => parseInt(val)),
  isPublished: z.string().transform((val) => val === 'true')
})

// 输入: { novelId: "123", isPublished: "true" }
// 输出: { novelId: 123, isPublished: true }
```

---

## ✅ 需要重构的文件列表

### 高优先级 (建议立即重构)

1. ⏳ `src/app/api/admin/novels/route.ts` (POST)
2. ⏳ `src/app/api/admin/chapters/route.ts` (POST)
3. ⏳ `src/app/api/auth/register/route.ts` (POST)
4. ⏳ `src/app/api/novels/[id]/rate/route.ts` (POST)
5. ⏳ `src/app/api/profile/route.ts` (PUT)

### 中优先级

6. ⏳ `src/app/api/admin/novels/[id]/route.ts` (PUT)
7. ⏳ `src/app/api/admin/chapters/[id]/route.ts` (PUT)

---

## 📊 预期收益

### 代码质量

- ✅ 统一的验证逻辑
- ✅ 更好的错误消息
- ✅ 类型安全 (自动类型推导)
- ✅ 减少重复代码

### 开发体验

- ✅ 自动补全
- ✅ 编译时类型检查
- ✅ 更容易维护

### 代码减少

- 每个API: **10-20 行** 验证代码
- 7 个文件: **约 100 行** 总计

---

## 🔗 相关资源

- [Zod 官方文档](https://zod.dev/)
- [Zod GitHub](https://github.com/colinhacks/zod)
- [TypeScript 类型推导](https://zod.dev/?id=type-inference)

---

**创建日期:** 2025-11-13
**依赖:** Zod v3.x
**预计节省:** ~100 行代码
