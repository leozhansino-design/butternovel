import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { novelId, title, content, isPublished } = body

    // Validate required fields
    if (!novelId || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if novel belongs to this author
    const novel = await prisma.novel.findFirst({
      where: {
        id: parseInt(novelId),
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
        novelId: parseInt(novelId),
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
      where: { id: parseInt(novelId) },
      data: {
        totalChapters: { increment: 1 },
        wordCount: { increment: wordCount },
      },
    })

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
