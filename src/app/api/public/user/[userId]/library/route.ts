import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    const { searchParams } = new URL(request.url)

    // ⚡ OPTIMIZATION: Add pagination to prevent large queries
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user exists and if their library is public
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        libraryPrivacy: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If library is private, return empty list
    if (user.libraryPrivacy) {
      return NextResponse.json({
        novels: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasMore: false
        }
      })
    }

    // ⚡ OPTIMIZATION: Fetch library entries and total count in parallel
    const [libraryEntries, totalCount] = await Promise.all([
      prisma.library.findMany({
        where: { userId },
        include: {
          novel: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              status: true,
              totalChapters: true,
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          addedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.library.count({
        where: { userId }
      })
    ]) as any[]

    const novels = libraryEntries.map(entry => ({
      id: entry.novel.id,
      title: entry.novel.title,
      slug: entry.novel.slug,
      coverImage: entry.novel.coverImage,
      category: entry.novel.category.name,
      status: entry.novel.status,
      totalChapters: entry.novel.totalChapters,
      addedAt: entry.addedAt.toISOString()
    }))

    return NextResponse.json({
      novels,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + novels.length < totalCount
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
