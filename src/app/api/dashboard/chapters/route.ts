import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateWithSchema, chapterCreateSchema, countWords, WORD_LIMITS } from '@/lib/validators'

// POST - Create a new chapter
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    console.log('[Chapters API] Creating chapter:', {
      novelId: body.novelId,
      titleLength: body.title?.length,
      contentLength: body.content?.length,
      isPublished: body.isPublished
    })

    // ✅ Validate using Zod schema (validates title, content length, etc.)
    const validation = validateWithSchema(chapterCreateSchema, {
      novelId: body.novelId,
      title: body.title,
      content: body.content,
      chapterNumber: 0, // Will be calculated below
      isPublished: body.isPublished,
    })

    if (!validation.success) {
      console.error('[Chapters API] Validation failed:', {
        error: validation.error,
        details: validation.details
      })
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const { novelId, title, content, isPublished } = validation.data

    // Check if novel belongs to this author
    const novel = await prisma.novel.findFirst({
      where: {
        id: novelId,
        authorId: session.user.email,
      },
      include: {
        chapters: {
          orderBy: {
            chapterNumber: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!novel) {
      return NextResponse.json(
        { error: 'Novel not found or unauthorized' },
        { status: 404 }
      )
    }

    // Calculate next chapter number
    const nextChapterNumber = novel.chapters.length > 0
      ? novel.chapters[0].chapterNumber + 1
      : 1

    // Calculate word count
    const wordCount = content.trim().split(/\s+/).filter((w: string) => w).length

    // Generate slug
    const slug = `${novel.slug}-chapter-${nextChapterNumber}`

    // Create chapter
    const chapter = await prisma.chapter.create({
      data: {
        novelId,
        chapterNumber: nextChapterNumber,
        title,
        slug,
        content,
        wordCount,
        isPublished: isPublished !== undefined ? isPublished : true,
      },
    })

    // Update novel statistics
    await prisma.novel.update({
      where: { id: novelId },
      data: {
        totalChapters: { increment: 1 },
        wordCount: { increment: wordCount },
      },
    })

    // Auto-publish novel when a chapter is published
    if (isPublished === true && !novel.isPublished) {
      // Chapter is being published and novel is still a draft
      await prisma.novel.update({
        where: { id: novelId },
        data: { isPublished: true },
      })
    }

    return NextResponse.json({
      message: 'Chapter created successfully',
      chapter,
    })
  } catch (error) {
    console.error('[Dashboard Chapters API] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create chapter' },
      { status: 500 }
    )
  }
}
