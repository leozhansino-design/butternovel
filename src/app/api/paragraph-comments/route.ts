// src/app/api/paragraph-comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadCommentImage } from '@/lib/cloudinary'

// GET - 获取某个段落的评论
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chapterId = searchParams.get('chapterId')
    const paragraphIndex = searchParams.get('paragraphIndex')

    if (!chapterId || !paragraphIndex) {
      return NextResponse.json(
        { success: false, error: 'Missing chapterId or paragraphIndex' },
        { status: 400 }
      )
    }

    const comments = await prisma.paragraphComment.findMany({
      where: {
        chapterId: parseInt(chapterId),
        paragraphIndex: parseInt(paragraphIndex),
        parentId: null, // Only get top-level comments, not replies
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
          }
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [
        { likeCount: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ success: true, data: comments })
  } catch (error: any) {
    console.error('Failed to fetch paragraph comments:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - 发表段落评论
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { novelId, chapterId, paragraphIndex, content, image } = body

    if (!novelId || !chapterId || paragraphIndex === undefined || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 验证内容长度
    if (content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment content cannot be empty' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Comment content too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    let imageUrl: string | undefined
    let imagePublicId: string | undefined

    // 如果有图片，上传到Cloudinary
    if (image) {
      try {
        // 验证图片大小（前端应该已经验证过，这里再验证一次）
        const base64Length = image.length - (image.indexOf(',') + 1)
        const sizeInBytes = (base64Length * 3) / 4
        const sizeInMB = sizeInBytes / (1024 * 1024)

        if (sizeInMB > 2) {
          return NextResponse.json(
            { success: false, error: 'Image size exceeds 2MB limit' },
            { status: 400 }
          )
        }

        const result = await uploadCommentImage(image, session.user.id)
        imageUrl = result.url
        imagePublicId = result.publicId
      } catch (error: any) {
        console.error('Failed to upload comment image:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to upload image' },
          { status: 500 }
        )
      }
    }

    // 创建评论
    const comment = await prisma.paragraphComment.create({
      data: {
        novelId: parseInt(novelId),
        chapterId: parseInt(chapterId),
        paragraphIndex: parseInt(paragraphIndex),
        content: content.trim(),
        imageUrl,
        imagePublicId,
        userId: session.user.id
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
          }
        },
        _count: {
          select: {
            replies: true,
          },
        },
      }
    })

    return NextResponse.json({ success: true, data: comment })
  } catch (error: any) {
    console.error('Failed to create paragraph comment:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
