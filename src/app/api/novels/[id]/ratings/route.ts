// src/app/api/novels/[id]/ratings/route.ts
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// GET - 获取评分列表（分页）
export const GET = withErrorHandling(async (
  request: Request,
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params
  const novelId = parseInt(params.id)
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const skip = (page - 1) * limit

  // 检查小说是否存在
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: {
      id: true,
      averageRating: true,
      totalRatings: true
    }
  })

  if (!novel) {
    return errorResponse('Novel not found', 404, 'NOVEL_NOT_FOUND')
  }

  // 获取评分列表
  const ratings = await prisma.rating.findMany({
    where: { novelId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    skip,
    take: limit
  })

  // 格式化返回数据
  const formattedRatings = ratings.map(rating => ({
    id: rating.id,
    score: rating.score,
    review: rating.review,
    createdAt: rating.createdAt.toISOString(),
    user: {
      id: rating.user.id,
      name: rating.user.name || 'Anonymous',
      avatar: rating.user.avatar
    }
  }))

  return successResponse({
    ratings: formattedRatings,
    pagination: {
      page,
      limit,
      total: novel.totalRatings,
      hasMore: skip + ratings.length < novel.totalRatings
    },
    novelStats: {
      averageRating: novel.averageRating,
      totalRatings: novel.totalRatings
    }
  })
})
