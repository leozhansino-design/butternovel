// src/app/api/ratings/[id]/replies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addRatingReplyContribution } from '@/lib/contribution'

type Params = {
  params: Promise<{ id: string }>
}

// GET - Get all replies for a rating
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const ratingId = id

    // Get all replies for this rating (including nested replies)
    const replies = await prisma.ratingReply.findMany({
      where: { ratingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            contributionPoints: true,
            level: true,
          },
        },
        childReplies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Only return top-level replies (parentReplyId is null)
    // Child replies are included via the childReplies relation
    const topLevelReplies = replies.filter(reply => !reply.parentReplyId)

    return NextResponse.json({
      replies: topLevelReplies,
      count: replies.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    )
  }
}

// POST - Create a new reply
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to reply' },
        { status: 401 }
      )
    }

    const { id } = await params
    const ratingId = id

    const body = await request.json()
    const { content, parentReplyId } = body

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reply content cannot be empty' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Reply must be 500 characters or less' },
        { status: 400 }
      )
    }

    // Check if rating exists
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId },
    })

    if (!rating) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      )
    }

    // If replying to another reply, check it exists and belongs to same rating
    if (parentReplyId) {
      const parentReply = await prisma.ratingReply.findUnique({
        where: { id: parentReplyId },
      })

      if (!parentReply) {
        return NextResponse.json(
          { error: 'Parent reply not found' },
          { status: 404 }
        )
      }

      if (parentReply.ratingId !== ratingId) {
        return NextResponse.json(
          { error: 'Parent reply does not belong to this rating' },
          { status: 400 }
        )
      }
    }

    // Create reply
    const reply = await prisma.ratingReply.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        ratingId,
        parentReplyId: parentReplyId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            contributionPoints: true,
            level: true,
          },
        },
      },
    })

    // ⭐ 添加贡献度
    try {
      const contributionResult = await addRatingReplyContribution(session.user.id, reply.id)

      if (contributionResult.levelUp) {
      }
    } catch (error) {
      // 不影响主流程，只记录错误
    }

    return NextResponse.json({
      reply,
      message: 'Reply posted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
