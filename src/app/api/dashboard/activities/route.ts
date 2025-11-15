// src/app/api/dashboard/activities/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// GET - Fetch recent activities for the authenticated user
export const GET = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  try {
    // Get recent chapters published
    const recentChapters = await prisma.chapter.findMany({
      where: {
        novel: {
          authorId: session.user.id
        },
        isPublished: true
      },
      include: {
        novel: {
          select: {
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get recent comments on user's novels (if Comments table exists)
    let recentComments: any[] = []
    try {
      // Check if Comment model exists by querying it
      recentComments = await prisma.$queryRaw`
        SELECT
          c.id,
          c.content,
          c."createdAt",
          c."userId",
          u.name as "userName",
          n.title as "novelTitle",
          n.slug as "novelSlug",
          ch.title as "chapterTitle",
          ch."chapterNumber"
        FROM "Comment" c
        INNER JOIN "User" u ON c."userId" = u.id
        INNER JOIN "Chapter" ch ON c."chapterId" = ch.id
        INNER JOIN "Novel" n ON ch."novelId" = n.id
        WHERE n."authorId" = ${session.user.id}
        ORDER BY c."createdAt" DESC
        LIMIT 5
      `
    } catch (error) {
      console.log('[Dashboard Activities] Comments table not available yet')
    }

    // Get recent likes on user's novels
    const recentLikes = await prisma.novelLike.findMany({
      where: {
        novel: {
          authorId: session.user.id
        }
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true
          }
        },
        novel: {
          select: {
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get recent ratings on user's novels
    const recentRatings = await prisma.rating.findMany({
      where: {
        novel: {
          authorId: session.user.id
        }
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        novel: {
          select: {
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Combine and sort all activities
    const activities: any[] = []

    // Add chapter publications
    recentChapters.forEach(chapter => {
      activities.push({
        type: 'chapter_published',
        timestamp: chapter.createdAt,
        data: {
          chapterTitle: chapter.title,
          chapterNumber: chapter.chapterNumber,
          novelTitle: chapter.novel.title,
          novelSlug: chapter.novel.slug
        }
      })
    })

    // Add comments
    recentComments.forEach((comment: any) => {
      activities.push({
        type: 'comment',
        timestamp: comment.createdAt,
        data: {
          userName: comment.userName,
          content: comment.content,
          novelTitle: comment.novelTitle,
          novelSlug: comment.novelSlug,
          chapterTitle: comment.chapterTitle,
          chapterNumber: comment.chapterNumber
        }
      })
    })

    // Add likes
    recentLikes.forEach(like => {
      activities.push({
        type: 'like',
        timestamp: like.createdAt,
        data: {
          userName: like.user?.name || 'Anonymous',
          novelTitle: like.novel.title,
          novelSlug: like.novel.slug
        }
      })
    })

    // Add ratings
    recentRatings.forEach(rating => {
      activities.push({
        type: 'rating',
        timestamp: rating.createdAt,
        data: {
          userName: rating.user?.name || 'Anonymous',
          score: rating.score,
          novelTitle: rating.novel.title,
          novelSlug: rating.novel.slug
        }
      })
    })

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Take only the 10 most recent
    const recentActivities = activities.slice(0, 10)

    return successResponse({
      activities: recentActivities
    })
  } catch (error) {
    console.error('[Dashboard Activities] Error fetching activities:', error)
    return errorResponse('Failed to fetch activities', 500, 'INTERNAL_ERROR')
  }
})
