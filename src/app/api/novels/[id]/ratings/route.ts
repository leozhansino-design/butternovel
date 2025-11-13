// src/app/api/novels/[id]/ratings/route.ts
// Get novel ratings list with pagination

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parsePaginationParams, createPaginationResponse } from '@/lib/pagination'
import { errorResponse, ErrorCode } from '@/lib/api-response'

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

    // ✅ Use pagination utility
    const { page, limit, offset } = parsePaginationParams(request.url, {
      defaultLimit: 10,
      maxLimit: 50,
    })

    // Get ratings list (only with reviews)
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
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    })

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
      ratings,
      pagination,
    })
  } catch (error) {
    console.error('Failed to fetch ratings:', error)
    return errorResponse('Failed to fetch ratings', ErrorCode.INTERNAL_ERROR)
  }
}
