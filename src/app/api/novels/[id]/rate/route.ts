// src/app/api/novels/[id]/rate/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// POST - 提交评分
export const POST = withErrorHandling(async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const params = await context.params
  const { score, review } = await request.json()
  const novelId = parseInt(params.id)

  // 验证评分值
  if (!score || ![2, 4, 6, 8, 10].includes(score)) {
    return errorResponse('Invalid score. Must be 2, 4, 6, 8, or 10', 400, 'INVALID_SCORE')
  }

  // 检查小说是否存在
  const novel = await prisma.novel.findUnique({
    where: { id: novelId }
  })

  if (!novel) {
    return errorResponse('Novel not found', 404, 'NOVEL_NOT_FOUND')
  }

  // 检查用户是否已经评分
  const existingRating = await prisma.rating.findUnique({
    where: {
      userId_novelId: {
        userId: session.user.id,
        novelId
      }
    }
  })

  if (existingRating) {
    return errorResponse('You have already rated this novel', 400, 'ALREADY_RATED')
  }

  // 创建评分记录
  const rating = await prisma.rating.create({
    data: {
      userId: session.user.id,
      novelId,
      score,
      review: review || null
    }
  })

  // 重新计算小说的平均评分和总评分数
  const ratings = await prisma.rating.findMany({
    where: { novelId },
    select: { score: true }
  })

  const totalRatings = ratings.length
  const averageRating = ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings

  // 更新小说的评分统计
  await prisma.novel.update({
    where: { id: novelId },
    data: {
      averageRating,
      totalRatings
    }
  })

  return successResponse({
    rating: {
      id: rating.id,
      score: rating.score,
      review: rating.review,
      createdAt: rating.createdAt.toISOString()
    },
    novelStats: {
      averageRating,
      totalRatings
    }
  })
})
