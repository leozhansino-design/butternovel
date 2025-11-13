// src/app/api/profile/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

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
  const { name, bio } = body

  // 验证
  if (name && (typeof name !== 'string' || name.trim().length === 0)) {
    return errorResponse('Invalid name', 400, 'INVALID_NAME')
  }

  if (bio && (typeof bio !== 'string' || bio.length > 500)) {
    return errorResponse('Bio must be 500 characters or less', 400, 'INVALID_BIO')
  }

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
