// src/app/api/admin/chapters/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { novelId, title, content, chapterNumber, isPublished, wordCount } = await request.json()

    if (!novelId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { id: true, totalChapters: true, wordCount: true }
    })

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    const slug = `chapter-${chapterNumber}`

    const chapter = await prisma.chapter.create({
      data: {
        novelId,
        title,
        slug,
        content,
        chapterNumber,
        wordCount: wordCount || content.length,
        isPublished: isPublished !== undefined ? isPublished : true,
      }
    })

    await prisma.novel.update({
      where: { id: novelId },
      data: {
        totalChapters: novel.totalChapters + 1,
        wordCount: novel.wordCount + chapter.wordCount,
      }
    })

    return NextResponse.json({
      success: true,
      chapter: { id: chapter.id, title: chapter.title, chapterNumber: chapter.chapterNumber }
    })

  } catch (error: any) {
    console.error('Error creating chapter:', error)
    return NextResponse.json({ error: error.message || 'Failed to create chapter' }, { status: 500 })
  }
}