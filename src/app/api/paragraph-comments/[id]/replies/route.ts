import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadCommentImage } from '@/lib/cloudinary'

// GET /api/paragraph-comments/[id]/replies - Get all replies for a comment
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const replies = await prisma.paragraphComment.findMany({
      where: {
        parentId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            level: true,
            contributionPoints: true,
            role: true,
            isOfficial: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [
        { likeCount: 'desc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: replies,
    })
  } catch (error) {
    console.error('[Paragraph Comment Replies API] Error fetching replies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch replies' },
      { status: 500 }
    )
  }
}

// POST /api/paragraph-comments/[id]/replies - Reply to a comment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: parentId } = await context.params
    const body = await request.json()
    const { novelId, chapterId, paragraphIndex, content, image } = body

    // Validate parent comment exists
    const parentComment = await prisma.paragraphComment.findUnique({
      where: { id: parentId },
    })

    if (!parentComment) {
      return NextResponse.json(
        { success: false, error: 'Parent comment not found' },
        { status: 404 }
      )
    }

    // Validate inputs
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Comment content must be less than 1000 characters' },
        { status: 400 }
      )
    }

    // Handle image upload if provided
    let imageUrl: string | undefined
    let imagePublicId: string | undefined

    if (image) {
      try {
        const uploadResult = await uploadCommentImage(image, session.user.id)
        imageUrl = uploadResult.url
        imagePublicId = uploadResult.publicId
      } catch (uploadError) {
        console.error('[Comment Reply API] Image upload failed:', uploadError)
        return NextResponse.json(
          { success: false, error: 'Failed to upload image' },
          { status: 500 }
        )
      }
    }

    // Create reply in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the reply
      const reply = await tx.paragraphComment.create({
        data: {
          novelId,
          chapterId,
          paragraphIndex,
          content: content.trim(),
          imageUrl,
          imagePublicId,
          userId: session.user.id,
          parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              level: true,
              contributionPoints: true,
              role: true,
              isOfficial: true,
            },
          },
        },
      })

      // Update parent comment's reply count
      await tx.paragraphComment.update({
        where: { id: parentId },
        data: {
          replyCount: {
            increment: 1,
          },
        },
      })

      // Add contribution points for replying (3 points)
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          contributionPoints: {
            increment: 3,
          },
        },
      })

      // Create contribution log
      await tx.contributionLog.create({
        data: {
          userId: session.user.id,
          action: 'COMMENT',
          points: 3,
          description: 'Replied to a comment',
        },
      })

      return reply
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[Comment Reply API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
