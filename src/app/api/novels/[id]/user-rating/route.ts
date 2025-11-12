// src/app/api/novels/[id]/user-rating/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// GET - 获取当前用户的评分状态
export const GET = withErrorHandling(async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const session = await auth()
  const params = await context.params
  const novelId = parseInt(params.id)

  // 如果用户未登录，返回未评分状态
  if (!session?.user?.id) {
    return successResponse({
      hasRated: false,
      rating: null
    })
  }

  // 查找用户的评分
  const rating = await prisma.rating.findUnique({
    where: {
      userId_novelId: {
        userId: session.user.id,
        novelId
      }
    },
    select: {
      id: true,
      score: true,
      review: true,
      createdAt: true
    }
  })

  if (!rating) {
    return successResponse({
      hasRated: false,
      rating: null
    })
  }

  return successResponse({
    hasRated: true,
    rating: {
      id: rating.id,
      score: rating.score,
      review: rating.review,
      createdAt: rating.createdAt.toISOString()
    }
  })
})
