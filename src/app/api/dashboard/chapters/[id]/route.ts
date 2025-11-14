import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateWithSchema, chapterUpdateSchema } from '@/lib/validators'

// GET - Get a single chapter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const chapterId = parseInt(id)

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novel: {
          authorId: session.user.id,
        },
      },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ chapter })
  } catch (error) {
    console.error('[Dashboard Chapter API] Get error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chapter' },
      { status: 500 }
    )
  }
}

// PUT - Update a chapter (including auto-save)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const chapterId = parseInt(id)
    const body = await request.json()

    // ✅ Validate using Zod schema (validates title, content length, etc.)
    const validation = validateWithSchema(chapterUpdateSchema, {
      title: body.title,
      content: body.content,
      isPublished: body.isPublished,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    // Check if chapter belongs to this author
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novel: {
          authorId: session.user.id,
        },
      },
    })

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Chapter not found or unauthorized' },
        { status: 404 }
      )
    }

    // Calculate word count if content is updated
    let wordCount = existingChapter.wordCount
    let wordCountDiff = 0

    if (body.content) {
      const newWordCount = body.content.trim().split(/\s+/).filter((w: string) => w).length
      wordCountDiff = newWordCount - existingChapter.wordCount
      wordCount = newWordCount
    }

    // Update chapter
    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        title: body.title || existingChapter.title,
        content: body.content || existingChapter.content,
        wordCount,
        isPublished: body.isPublished !== undefined ? body.isPublished : existingChapter.isPublished,
      },
    })

    // Update novel word count if content changed
    if (wordCountDiff !== 0) {
      await prisma.novel.update({
        where: { id: existingChapter.novelId },
        data: {
          wordCount: { increment: wordCountDiff },
        },
      })
    }

    // Auto-publish novel when a chapter is published
    if (body.isPublished === true && !existingChapter.isPublished) {
      // Chapter is being published for the first time
      const novel = await prisma.novel.findUnique({
        where: { id: existingChapter.novelId },
      })

      // If novel is still a draft, publish it automatically
      if (novel && !novel.isPublished) {
        await prisma.novel.update({
          where: { id: existingChapter.novelId },
          data: { isPublished: true },
        })
      }
    }

    return NextResponse.json({
      message: 'Chapter updated successfully',
      chapter: updatedChapter,
    })
  } catch (error) {
    console.error('[Dashboard Chapter API] Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update chapter' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a chapter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const chapterId = parseInt(id)

    // Check if chapter belongs to this author
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novel: {
          authorId: session.user.id,
        },
      },
    })

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Chapter not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete chapter
    await prisma.chapter.delete({
      where: { id: chapterId },
    })

    // Update novel statistics
    await prisma.novel.update({
      where: { id: existingChapter.novelId },
      data: {
        totalChapters: { decrement: 1 },
        wordCount: { decrement: existingChapter.wordCount },
      },
    })

    // Renumber remaining chapters
    const remainingChapters = await prisma.chapter.findMany({
      where: { novelId: existingChapter.novelId },
      orderBy: { chapterNumber: 'asc' },
    })

    // Update chapter numbers sequentially
    for (let i = 0; i < remainingChapters.length; i++) {
      await prisma.chapter.update({
        where: { id: remainingChapters[i].id },
        data: { chapterNumber: i + 1 },
      })
    }

    return NextResponse.json({
      message: 'Chapter deleted successfully',
    })
  } catch (error) {
    console.error('[Dashboard Chapter API] Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete chapter' },
      { status: 500 }
    )
  }
}
