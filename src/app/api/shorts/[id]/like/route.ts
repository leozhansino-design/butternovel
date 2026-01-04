// Like/unlike a short novel
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { authenticateRequest } from '@/lib/mobile-auth'

// CORS headers for mobile app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST - Toggle like
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid novel ID' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Try mobile auth first, then fall back to session auth
    const { user: mobileUser } = await authenticateRequest(request)
    const session = mobileUser ? null : await auth()
    const userId = mobileUser?.id || session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to like' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Check if user already liked this novel
    const existingLike = await prisma.novelLike.findUnique({
      where: {
        userId_novelId: {
          userId,
          novelId
        }
      }
    })

    let isLiked: boolean
    let likeCount: number

    if (existingLike) {
      // Remove like
      await prisma.$transaction([
        prisma.novelLike.delete({
          where: {
            userId_novelId: {
              userId,
              novelId
            }
          }
        }),
        prisma.novel.update({
          where: { id: novelId },
          data: { likeCount: { decrement: 1 } }
        })
      ])

      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { likeCount: true }
      })

      isLiked = false
      likeCount = novel?.likeCount || 0
    } else {
      // Add like
      await prisma.$transaction([
        prisma.novelLike.create({
          data: {
            novelId,
            userId
          }
        }),
        prisma.novel.update({
          where: { id: novelId },
          data: { likeCount: { increment: 1 } }
        })
      ])

      const novel = await prisma.novel.findUnique({
        where: { id: novelId },
        select: { likeCount: true }
      })

      isLiked = true
      likeCount = novel?.likeCount || 0
    }

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Like API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process like' },
      { status: 500, headers: corsHeaders }
    )
  }
}

// GET - Check like status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return NextResponse.json(
        { success: false, isLiked: false },
        { status: 400, headers: corsHeaders }
      )
    }

    // Try mobile auth first, then fall back to session auth
    const { user: mobileUser } = await authenticateRequest(request)
    const session = mobileUser ? null : await auth()
    const userId = mobileUser?.id || session?.user?.id

    if (!userId) {
      return NextResponse.json({
        success: true,
        isLiked: false
      }, { headers: corsHeaders })
    }

    const existingLike = await prisma.novelLike.findUnique({
      where: {
        userId_novelId: {
          userId,
          novelId
        }
      }
    })

    return NextResponse.json({
      success: true,
      isLiked: !!existingLike
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Like status API error:', error)
    return NextResponse.json(
      { success: false, isLiked: false },
      { status: 500, headers: corsHeaders }
    )
  }
}
