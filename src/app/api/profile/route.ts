// src/app/api/profile/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'
import { validateWithSchema, profileUpdateSchema } from '@/lib/validators'

// GET - 获取用户资料和统计
export const GET = withErrorHandling(async () => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
      _count: {
        select: {
          library: true
        }
      }
    }
  })

  if (!user) {
    return errorResponse('User not found', 404, 'USER_NOT_FOUND')
  }

  // 获取阅读统计
  const totalChaptersRead = await prisma.chapterProgress.count({
    where: { userId: session.user.id }
  })

  return successResponse({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      stats: {
        booksInLibrary: user._count.library,
        chaptersRead: totalChaptersRead,
        // 阅读时长可以后续添加
        readingTime: 0
      }
    }
  })
})

// PATCH - 更新用户资料
export const PATCH = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const body = await request.json()

  // ✅ 使用 Zod 验证
  const validation = validateWithSchema(profileUpdateSchema, body)
  if (!validation.success) {
    return errorResponse(validation.error, 400, 'VALIDATION_ERROR')
  }

  const { name, bio } = validation.data

  // ✅ 先检查用户是否存在 (防止 OAuth 用户被删除后仍有 session)
  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!existingUser) {
    return errorResponse('User not found', 404, 'USER_NOT_FOUND')
  }

  // 更新用户
  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(bio !== undefined && { bio: bio.trim() || null })
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true
    }
  })

  return successResponse({ user: updatedUser })
})
