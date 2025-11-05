// src/app/api/admin/chapters/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'

// POST /api/admin/chapters - 创建新章节
export async function POST(request: Request) {
  try {
    console.log('📝 [API] Creating new chapter...')

    // 验证管理员权限
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { novelId, title, content, chapterNumber, isPublished, wordCount } = body

    console.log('📦 [API] Chapter data:', { novelId, title, chapterNumber, wordCount })

    // 验证必填字段
    if (!novelId || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 验证小说是否存在
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { id: true, totalChapters: true, wordCount: true }
    })

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    }

    // 生成 slug
    const slug = `chapter-${chapterNumber}`

    // 创建章节
    console.log('💾 [API] Creating chapter in database...')

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

    // 更新小说的章节数和总字数
    console.log('📊 [API] Updating novel statistics...')

    await prisma.novel.update({
      where: { id: novelId },
      data: {
        totalChapters: novel.totalChapters + 1,
        wordCount: novel.wordCount + chapter.wordCount,
      }
    })

    console.log('✅ [API] Chapter created successfully!')

    return NextResponse.json({
      success: true,
      chapter: {
        id: chapter.id,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
      }
    })

  } catch (error: any) {
    console.error('❌ [API] Error creating chapter:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create chapter' },
      { status: 500 }
    )
  }
}