// src/app/api/novels/[id]/user-rating/route.ts
// 获取当前用户对该小说的评分状态

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'

// CORS headers for mobile app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Use mobile-compatible auth
    const { user } = await authenticateRequest(request)

    if (!user) {
      return NextResponse.json(
        { hasRated: false, rating: null },
        { status: 200, headers: corsHeaders }
      )
    }

    const { id } = await context.params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { error: 'Invalid novel ID' },
        { status: 400, headers: corsHeaders }
      )
    }

    // 查找用户的评分
    const rating = await prisma.rating.findUnique({
      where: {
        userId_novelId: {
          userId: user.id,
          novelId,
        },
      },
      select: {
        id: true,
        score: true,
        review: true,
        createdAt: true,
      },
    })

    if (!rating) {
      return NextResponse.json({
        hasRated: false,
        rating: null,
      }, { headers: corsHeaders })
    }

    return NextResponse.json({
      hasRated: true,
      rating,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[User Rating API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
