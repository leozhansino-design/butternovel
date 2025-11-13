// src/app/api/admin/chapters/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'

export const POST = withAdminAuth(async (session, request: Request) => {
  try {

    const { novelId, title, content, chapterNumber, isPublished, wordCount } = await request.json()

    if (!novelId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 🔄 添加数据库重试机制，解决连接超时问题
    const novel = await withRetry(
      () => prisma.novel.findUnique({
        where: { id: novelId },
        select: { id: true, totalChapters: true, wordCount: true }
      }),
      { operationName: 'Get novel for new chapter' }
    )

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const slug = `chapter-${chapterNumber}`

    // ⭐ FIX: 改为计算单词数，而不是字符数
    const calculatedWordCount = wordCount !== undefined
      ? wordCount
      : content.trim().split(/\s+/).filter((w: string) => w).length

    // 🔄 添加数据库重试机制，解决连接超时问题
    const chapter = await withRetry(
      () => prisma.chapter.create({
        data: {
          novelId,
          title,
          slug,
          content,
          chapterNumber,
          wordCount: calculatedWordCount,
          isPublished: isPublished !== undefined ? isPublished : true,
        }
      }),
      { operationName: 'Create chapter' }
    )

    // 🔄 添加数据库重试机制，解决连接超时问题
    await withRetry(
      () => prisma.novel.update({
        where: { id: novelId },
        data: {
          totalChapters: novel.totalChapters + 1,
          wordCount: novel.wordCount + chapter.wordCount,
        }
      }),
      { operationName: 'Update novel after chapter creation' }
    )

    return NextResponse.json({
      success: true,
      chapter: { id: chapter.id, title: chapter.title, chapterNumber: chapter.chapterNumber }
    })

  } catch (error: any) {
    console.error('Error creating chapter:', error)
    return NextResponse.json({ error: error.message || 'Failed to create chapter' }, { status: 500 })
  }
})