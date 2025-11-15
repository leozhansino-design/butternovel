// src/app/api/reading-history/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  unauthorizedResponse,
  handleApiError
} from '@/lib/api-response'

// GET - Get user's reading history
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return unauthorizedResponse()
    }

    // ⚡ OPTIMIZATION: Add pagination support
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const skip = (page - 1) * limit

    // ⚡ OPTIMIZATION: Fetch history and count in parallel
    const [history, totalCount] = await Promise.all([
      prisma.readingHistory.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          novel: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              authorName: true,
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
          lastReadAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.readingHistory.count({
        where: {
          userId: session.user.id
        }
      })
    ]) as [any[], number]

    // Transform data for frontend, filtering out any invalid entries
    const novels = history
      .filter(item => item.novel && item.novel.category) // Filter out null novels/categories
      .map(item => ({
        id: item.novel.id,
        title: item.novel.title,
        slug: item.novel.slug,
        coverImage: item.novel.coverImage,
        authorName: item.novel.authorName,
        status: item.novel.status,
        totalChapters: item.novel.totalChapters,
        categoryName: item.novel.category.name,
        lastReadAt: item.lastReadAt.toISOString()
      }))

    return successResponse({
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
    return handleApiError(error, 'Failed to fetch reading history')
  }
}
