// src/app/api/novels/[id]/first-chapter/route.ts
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  notFoundResponse,
  handleApiError
} from '@/lib/api-response'

// GET - Get first chapter of a novel
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const novelId = parseInt(id)

    if (isNaN(novelId)) {
      return notFoundResponse('Novel')
    }

    // Find first published chapter
    const firstChapter = await prisma.chapter.findFirst({
      where: {
        novelId,
        isPublished: true
      },
      orderBy: {
        chapterNumber: 'asc'
      },
      select: {
        id: true
      }
    })

    if (!firstChapter) {
      return notFoundResponse('Chapter')
    }

    return successResponse({ chapterId: firstChapter.id })
  } catch (error) {
    return handleApiError(error, 'Failed to get first chapter')
  }
}
