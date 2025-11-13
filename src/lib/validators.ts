// src/lib/validators.ts
// 📋 统一的数据验证 Schemas

import { z } from 'zod'

// ============================================
// 小说 (Novel) Schemas
// ============================================

export const novelCreateSchema = z.object({
  title: z.string()
    .min(1, '标题不能为空')
    .max(120, '标题最多120字'),

  coverImage: z.string()
    .min(1, '封面不能为空'),

  categoryId: z.coerce.number()
    .int('分类ID必须是整数')
    .positive('分类ID必须是正整数'),

  blurb: z.string()
    .min(1, '简介不能为空')
    .max(3000, '简介最多3000字'),

  status: z.enum(['ONGOING', 'COMPLETED'], {
    message: '状态必须是 ONGOING 或 COMPLETED'
  }),

  isPublished: z.boolean().optional(),
  isDraft: z.boolean().optional(),

  chapters: z.array(z.object({
    title: z.string().min(1).max(100),
    content: z.string().min(1)
  })).optional()
})

export const novelUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  blurb: z.string().min(1).max(3000).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  status: z.enum(['ONGOING', 'COMPLETED']).optional(),
  coverImage: z.string().optional(),
  isPublished: z.boolean().optional(),
  isDraft: z.boolean().optional(),
})

// ============================================
// 章节 (Chapter) Schemas
// ============================================

export const chapterCreateSchema = z.object({
  novelId: z.coerce.number().int().positive(),
  title: z.string()
    .min(1, '标题不能为空')
    .max(100, '标题最多100字'),
  content: z.string()
    .min(1, '内容不能为空'),
  chapterNumber: z.coerce.number().int().positive(),
  isPublished: z.boolean().optional(),
})

export const chapterUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
})

// ============================================
// 评分 (Rating) Schema
// ============================================

export const ratingSchema = z.object({
  score: z.number()
    .int('评分必须是整数')
    .refine(
      (val) => [2, 4, 6, 8, 10].includes(val),
      { message: '评分必须是 2, 4, 6, 8, 10 之一' }
    ),
  review: z.string()
    .max(1000, '评论最多1000字')
    .optional(),
})

// ============================================
// 认证 (Auth) Schemas
// ============================================

export const registerSchema = z.object({
  email: z.string()
    .email('邮箱格式不正确'),
  password: z.string()
    .min(6, '密码至少6位')
    .max(50, '密码最多50位'),
  name: z.string()
    .min(1)
    .max(50)
    .optional(),
})

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
})

// ============================================
// 用户资料 (Profile) Schemas
// ============================================

export const profileUpdateSchema = z.object({
  name: z.string()
    .min(1, '名字不能为空')
    .max(50, '名字最多50字')
    .optional(),
  bio: z.string()
    .max(500, '个人简介最多500字')
    .optional(),
})

// ============================================
// 图片验证
// ============================================

export const IMAGE_LIMITS = {
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  COVER: { width: 300, height: 400 },
  AVATAR: { width: 256, height: 256 },
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const

/**
 * 客户端图片验证 (浏览器环境)
 */
export function validateImage(
  file: File,
  type: 'cover' | 'avatar'
): Promise<{ valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    // 1. 类型检查
    if (!IMAGE_LIMITS.ALLOWED_TYPES.includes(file.type as any)) {
      resolve({
        valid: false,
        error: '不支持的文件类型。请上传 JPG、PNG 或 WebP 格式'
      })
      return
    }

    // 2. 大小检查
    if (file.size > IMAGE_LIMITS.MAX_SIZE) {
      const maxMB = IMAGE_LIMITS.MAX_SIZE / 1024 / 1024
      resolve({
        valid: false,
        error: `文件过大。最大允许 ${maxMB}MB`
      })
      return
    }

    // 3. 尺寸检查
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const dimensions = type === 'cover' ? IMAGE_LIMITS.COVER : IMAGE_LIMITS.AVATAR

      if (img.width !== dimensions.width || img.height !== dimensions.height) {
        resolve({
          valid: false,
          error: `图片尺寸必须为 ${dimensions.width}x${dimensions.height}px (当前: ${img.width}x${img.height}px)`
        })
      } else {
        resolve({ valid: true })
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ valid: false, error: '无法加载图片' })
    }

    img.src = url
  })
}

/**
 * 服务端 Base64 图片验证
 */
export function validateBase64Image(base64: string): { valid: boolean; error?: string } {
  // 检查是否是有效的 base64 格式
  const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/

  if (!base64Pattern.test(base64)) {
    return {
      valid: false,
      error: 'Invalid image format. Must be base64 encoded JPG, PNG, or WebP'
    }
  }

  // 检查大小 (粗略估算: base64 比原始大约大 33%)
  const estimatedSize = (base64.length * 3) / 4
  if (estimatedSize > IMAGE_LIMITS.MAX_SIZE * 1.5) {
    return {
      valid: false,
      error: 'Image too large'
    }
  }

  return { valid: true }
}

// ============================================
// 字数限制和计算
// ============================================

export const WORD_LIMITS = {
  TITLE_MAX: 120,
  BLURB_MAX: 3000,
  CHAPTER_TITLE_MAX: 100,
  CHAPTER_WORDS_MAX: 5000,
  COMMENT_MAX: 500,
  REVIEW_MAX: 1000,
} as const

/**
 * 计算文本字数
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w).length
}

/**
 * 验证字数限制
 */
export function validateWordCount(
  text: string,
  maxWords: number
): { valid: boolean; count: number; error?: string } {
  const count = countWords(text)
  return {
    valid: count <= maxWords,
    count,
    error: count > maxWords
      ? `超出字数限制 ${maxWords} (当前: ${count})`
      : undefined
  }
}

// ============================================
// 通用验证辅助函数
// ============================================

/**
 * 验证并返回解析后的数据
 *
 * 使用示例:
 * ```typescript
 * const result = validateWithSchema(novelCreateSchema, body)
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 400 })
 * }
 * const data = result.data
 * ```
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: any } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const firstError = result.error.issues[0]
  return {
    success: false,
    error: firstError?.message || 'Validation failed',
    details: result.error.flatten()
  }
}

/**
 * 安全验证 (不抛出错误)
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
) {
  return schema.safeParse(data)
}
