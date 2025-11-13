// src/app/api/admin/chapters/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'
import { validateWithSchema, chapterUpdateSchema } from '@/lib/validators'

export const PUT = withAdminAuth(async (session, request: Request, props: { params: Promise<{ id: string }> }) => {
  try {
    const params = await props.params
    const chapterId = parseInt(params.id)
    const body = await request.json()

    // ✅ 使用 Zod 验证
    const validation = validateWithSchema(chapterUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      )
    }

    const updates = validation.data

    // 🔄 添加数据库重试机制，解决连接超时问题
    const currentChapter = await withRetry(
      () => prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { id: true, novelId: true, wordCount: true }
      }),
      { operationName: 'Get current chapter' }
    )

    if (!currentChapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const data: any = {}
    if (updates.title !== undefined) data.title = updates.title
    if (updates.content !== undefined) data.content = updates.content
    if (body.wordCount !== undefined) data.wordCount = body.wordCount
    if (updates.isPublished !== undefined) data.isPublished = updates.isPublished

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No changes to update' }, { status: 400 })
    }

    // 🔄 添加数据库重试机制，解决连接超时问题
    const updatedChapter = await withRetry(
      () => prisma.chapter.update({
        where: { id: chapterId },
        data,
      }),
      { operationName: 'Update chapter' }
    )

    if (body.wordCount !== undefined && body.wordCount !== currentChapter.wordCount) {
      const wordCountDiff = body.wordCount - currentChapter.wordCount
      // 🔄 添加数据库重试机制，解决连接超时问题
      await withRetry(
        () => prisma.novel.update({
          where: { id: currentChapter.novelId },
          data: { wordCount: { increment: wordCountDiff } }
        }),
        { operationName: 'Update novel word count' }
      )
    }

    return NextResponse.json({
      success: true,
      chapter: { id: updatedChapter.id, title: updatedChapter.title }
    })

  } catch (error: any) {
    console.error('Error updating chapter:', error)
    return NextResponse.json({ error: error.message || 'Failed to update' }, { status: 500 })
  }
})

export const DELETE = withAdminAuth(async (session, request: Request, props: { params: Promise<{ id: string }> }) => {
  try {
    const params = await props.params

    const chapterId = parseInt(params.id)

    // 🔄 添加数据库重试机制，解决连接超时问题
    const chapter = await withRetry(
      () => prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { id: true, novelId: true, wordCount: true, chapterNumber: true }
      }),
      { operationName: 'Get chapter for deletion' }
    )

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // 🔄 添加数据库重试机制，解决连接超时问题
    await withRetry(
      () => prisma.chapter.delete({ where: { id: chapterId } }),
      { operationName: 'Delete chapter' }
    )

    // 🔄 添加数据库重试机制，解决连接超时问题
    const novel = await withRetry(
      () => prisma.novel.findUnique({
        where: { id: chapter.novelId },
        select: { totalChapters: true, wordCount: true }
      }),
      { operationName: 'Get novel after chapter deletion' }
    )

    if (novel) {
      // 🔄 添加数据库重试机制，解决连接超时问题
      await withRetry(
        () => prisma.novel.update({
          where: { id: chapter.novelId },
          data: {
            totalChapters: Math.max(0, novel.totalChapters - 1),
            wordCount: Math.max(0, novel.wordCount - chapter.wordCount),
          }
        }),
        { operationName: 'Update novel after chapter deletion' }
      )
    }

    // ✅ 优化: 使用单次 SQL 批量更新代替循环 (N次 → 1次)
    // 将所有后续章节的章节号减 1
    await withRetry(
      () => prisma.$executeRaw`
        UPDATE "Chapter"
        SET "chapterNumber" = "chapterNumber" - 1
        WHERE "novelId" = ${chapter.novelId}
        AND "chapterNumber" > ${chapter.chapterNumber}
      `,
      { operationName: 'Reorder remaining chapters' }
    )

    return NextResponse.json({ success: true, message: 'Chapter deleted' })

  } catch (error: any) {
    console.error('Error deleting chapter:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 })
  }
})