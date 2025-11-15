// src/app/api/chapter-progress/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  handleApiError,
  ErrorCode,
} from '@/lib/api-response'
import { addChapterReadContribution } from '@/lib/contribution'

// POST - Update chapter progress
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { chapterId, scrollPosition, percentage, isCompleted } = body

    if (!chapterId) {
      return errorResponse('Missing chapterId', ErrorCode.BAD_REQUEST)
    }

    // Validate chapter exists
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(chapterId) },
      select: { id: true, novelId: true },
    })

    if (!chapter) {
      return notFoundResponse('Chapter')
    }

    // Check if this chapter was already marked as completed
    const existingProgress = await prisma.chapterProgress.findUnique({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId: parseInt(chapterId),
        },
      },
    })

    const wasAlreadyCompleted = existingProgress?.isCompleted || false

    // Update or create chapter progress
    const progress = await prisma.chapterProgress.upsert({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId: parseInt(chapterId),
        },
      },
      update: {
        scrollPosition: scrollPosition ?? existingProgress?.scrollPosition ?? 0,
        percentage: percentage ?? existingProgress?.percentage ?? 0,
        isCompleted: isCompleted ?? existingProgress?.isCompleted ?? false,
      },
      create: {
        userId: session.user.id,
        chapterId: parseInt(chapterId),
        scrollPosition: scrollPosition ?? 0,
        percentage: percentage ?? 0,
        isCompleted: isCompleted ?? false,
      },
    })

    // ⭐ 如果章节刚刚标记为完成（之前未完成），添加贡献度
    if (isCompleted && !wasAlreadyCompleted) {
      try {
        const contributionResult = await addChapterReadContribution(
          session.user.id,
          chapterId.toString()
        )

        if (contributionResult.levelUp) {
        }
      } catch (error) {
        // 不影响主流程
      }
    }

    return successResponse({
      progress,
      message: isCompleted ? 'Chapter completed!' : 'Progress saved',
    })
  } catch (error) {
    return handleApiError(error, 'Failed to update chapter progress')
  }
}

// GET - Get chapter progress
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')

    if (!chapterId) {
      return errorResponse('Missing chapterId', ErrorCode.BAD_REQUEST)
    }

    const progress = await prisma.chapterProgress.findUnique({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId: parseInt(chapterId),
        },
      },
    })

    return successResponse({
      progress: progress || null,
    })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch chapter progress')
  }
}
