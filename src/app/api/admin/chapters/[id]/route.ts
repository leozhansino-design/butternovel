// src/app/api/admin/chapters/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chapterId = parseInt(params.id)
    const updates = await request.json()

    const currentChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, novelId: true, wordCount: true }
    })

    if (!currentChapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const data: any = {}
    if (updates.title !== undefined) data.title = updates.title
    if (updates.content !== undefined) data.content = updates.content
    if (updates.wordCount !== undefined) data.wordCount = updates.wordCount
    if (updates.isPublished !== undefined) data.isPublished = updates.isPublished

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No changes to update' }, { status: 400 })
    }

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data,
    })

    if (updates.wordCount !== undefined && updates.wordCount !== currentChapter.wordCount) {
      const wordCountDiff = updates.wordCount - currentChapter.wordCount
      await prisma.novel.update({
        where: { id: currentChapter.novelId },
        data: { wordCount: { increment: wordCountDiff } }
      })
    }

    return NextResponse.json({
      success: true,
      chapter: { id: updatedChapter.id, title: updatedChapter.title }
    })

  } catch (error: any) {
    console.error('Error updating chapter:', error)
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chapterId = parseInt(params.id)

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, novelId: true, wordCount: true, chapterNumber: true }
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    await prisma.chapter.delete({ where: { id: chapterId } })

    const novel = await prisma.novel.findUnique({
      where: { id: chapter.novelId },
      select: { totalChapters: true, wordCount: true }
    })

    if (novel) {
      await prisma.novel.update({
        where: { id: chapter.novelId },
        data: {
          totalChapters: Math.max(0, novel.totalChapters - 1),
          wordCount: Math.max(0, novel.wordCount - chapter.wordCount),
        }
      })
    }

    const remainingChapters = await prisma.chapter.findMany({
      where: {
        novelId: chapter.novelId,
        chapterNumber: { gt: chapter.chapterNumber }
      },
      orderBy: { chapterNumber: 'asc' }
    })

    for (const ch of remainingChapters) {
      await prisma.chapter.update({
        where: { id: ch.id },
        data: { chapterNumber: ch.chapterNumber - 1 }
      })
    }

    return NextResponse.json({ success: true, message: 'Chapter deleted' })

  } catch (error: any) {
    console.error('Error deleting chapter:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 })
  }
}