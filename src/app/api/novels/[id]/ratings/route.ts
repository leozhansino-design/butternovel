// src/app/api/novels/[id]/ratings/route.ts
// Get novel ratings list with pagination

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parsePaginationParams, createPaginationResponse } from '@/lib/pagination'
import { errorResponse, ErrorCode } from '@/lib/api-response'
import { auth } from '@/lib/auth'
import crypto from 'crypto'

// 生成游客ID
function generateGuestId(ipAddress: string, userAgent: string): string {
  const data = `${ipAddress}:${userAgent}`
  return crypto.createHash('md5').update(data).digest('hex')
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return errorResponse('Invalid novel ID', ErrorCode.BAD_REQUEST)
    }

    // 获取当前用户信息（用于检查点赞状态）
    const session = await auth()
    const userId = session?.user?.id || null
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const guestId = userId ? null : generateGuestId(ipAddress, userAgent)

    // ✅ Use pagination utility
    const { page, limit, offset } = parsePaginationParams(request.url, {
      defaultLimit: 10,
      maxLimit: 50,
    })

    // Get ratings list (only with reviews) - 按点赞数和时间排序
    const ratings = await prisma.rating.findMany({
      where: {
        novelId,
        review: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { likeCount: 'desc' },  // 先按点赞数降序
        { createdAt: 'desc' },   // 再按时间降序
      ],
      skip: offset,
      take: limit,
    })

    // 检查当前用户对每个评分的点赞状态
    const ratingsWithLikeStatus = await Promise.all(
      ratings.map(async (rating) => {
        const userLike = await prisma.ratingLike.findFirst({
          where: userId
            ? { userId, ratingId: rating.id }
            : { guestId, ratingId: rating.id }
        })

        return {
          ...rating,
          userHasLiked: !!userLike,
        }
      })
    )

    // Get total count
    const total = await prisma.rating.count({
      where: {
        novelId,
        review: {
          not: null,
        },
      },
    })

    // ✅ Create standardized pagination response
    const pagination = createPaginationResponse({ page, limit, offset }, total)

    // Return data directly for backward compatibility with frontend
    return NextResponse.json({
      ratings: ratingsWithLikeStatus,
      pagination,
    })
  } catch (error) {
    console.error('Failed to fetch ratings:', error)
    return errorResponse('Failed to fetch ratings', ErrorCode.INTERNAL_ERROR)
  }
}
