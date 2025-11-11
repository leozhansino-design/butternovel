// src/app/api/library/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// GET - 获取用户书架
export const GET = withErrorHandling(async () => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

    const library = await prisma.library.findMany({
      where: { userId: session.user.id },
      include: {
        novel: {
          include: {
            category: true,
            _count: {
              select: { chapters: true }
            }
          }
        }
      },
      orderBy: {
        addedAt: 'desc'
      }
    })

    // 获取所有小说的阅读历史
    const novelIds = library.map(item => item.novel.id)
    const readingHistories = await prisma.readingHistory.findMany({
      where: {
        userId: session.user.id,
        novelId: { in: novelIds }
      },
      include: {
        chapter: true
      }
    })

    // 优化：一次性获取所有章节进度，然后按 novelId 分组
    const allChapterProgress = await prisma.chapterProgress.findMany({
      where: {
        userId: session.user.id,
        chapter: {
          novelId: { in: novelIds }
        }
      },
      include: {
        chapter: {
          select: { novelId: true }
        }
      }
    })

    // 按 novelId 分组计数
    const progressMap = new Map<number, number>()
    allChapterProgress.forEach(progress => {
      const novelId = progress.chapter.novelId
      progressMap.set(novelId, (progressMap.get(novelId) || 0) + 1)
    })

    const historyMap = new Map(readingHistories.map(item => [item.novelId, item]))

    const novels = library.map(item => {
      const history = historyMap.get(item.novel.id)
      const readCount = progressMap.get(item.novel.id) || 0

      return {
        id: item.novel.id,
        title: item.novel.title,
        slug: item.novel.slug,
        coverImage: item.novel.coverImage,
        category: item.novel.category.name,
        status: item.novel.status,
        totalChapters: item.novel._count.chapters,
        addedAt: item.addedAt.toISOString(),
        // 阅读进度
        lastReadChapter: history?.chapter.chapterNumber || null,
        lastReadChapterTitle: history?.chapter.title || null,
        readChapters: readCount
      }
    })

  return successResponse({ novels })
})

// POST - 添加到书架
export const POST = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { novelId } = await request.json()

  if (!novelId) {
    return errorResponse('Novel ID required', 400, 'MISSING_NOVEL_ID')
  }

  // 检查用户是否存在
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!userExists) {
    return errorResponse('User not found', 404, 'USER_NOT_FOUND')
  }

  // 检查是否已存在
  const existing = await prisma.library.findUnique({
    where: {
      userId_novelId: {
        userId: session.user.id,
        novelId: parseInt(novelId)
      }
    }
  })

  if (existing) {
    return successResponse({ message: 'Already in library' })
  }

  await prisma.library.create({
    data: {
      userId: session.user.id,
      novelId: parseInt(novelId)
    }
  })

  return successResponse({ message: 'Added to library' })
})

// DELETE - 从书架移除
export const DELETE = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { novelId } = await request.json()

  if (!novelId) {
    return errorResponse('Novel ID required', 400, 'MISSING_NOVEL_ID')
  }

  await prisma.library.delete({
    where: {
      userId_novelId: {
        userId: session.user.id,
        novelId: parseInt(novelId)
      }
    }
  })

  return successResponse({ message: 'Removed from library' })
})