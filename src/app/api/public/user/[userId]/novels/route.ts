import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch user's published novels
    const novels = await prisma.novel.findMany({
      where: {
        authorId: userId,
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        isPublished: true,
        viewCount: true,
        likeCount: true,
        _count: {
          select: {
            chapters: true,
            ratings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ novels })
  } catch (error) {
    console.error('[API /api/public/user/[userId]/novels] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
