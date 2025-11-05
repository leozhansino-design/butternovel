// src/app/api/admin/chapters/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'

// PUT /api/admin/chapters/[id] - 更新章节
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    console.log('📝 [API] Updating chapter:', params.id)

    // 验证管理员权限
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chapterId = parseInt(params.id)
    const updates = await request.json()

    console.log('📦 [API] Updates to apply:', Object.keys(updates))

    // 获取当前章节数据
    const currentChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { 
        id: true, 
        novelId: true,
        wordCount: true 
      }
    })

    if (!currentChapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // 准备更新数据
    const data: any = {}

    if (updates.title !== undefined) {
      data.title = updates.title
      console.log('📝 [API] Updating title')
    }

    if (updates.content !== undefined) {
      data.content = updates.content
      console.log('📝 [API] Updating content')
    }

    if (updates.wordCount !== undefined) {
      data.wordCount = updates.wordCount
      console.log('📝 [API] Updating word count')
    }

    if (updates.isPublished !== undefined) {
      data.isPublished = updates.isPublished
      console.log('📝 [API] Updating publish status')
    }

    // 执行更新
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No changes to update' },
        { status: 400 }
      )
    }

    console.log('💾 [API] Updating chapter in database...')

    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data,
    })

    // 如果字数改变了，更新小说的总字数
    if (updates.wordCount !== undefined && updates.wordCount !== currentChapter.wordCount) {
      console.log('📊 [API] Updating novel word count...')
      
      const wordCountDiff = updates.wordCount - currentChapter.wordCount

      await prisma.novel.update({
        where: { id: currentChapter.novelId },
        data: {
          wordCount: {
            increment: wordCountDiff
          }
        }
      })
    }

    console.log('✅ [API] Chapter updated successfully!')

    return NextResponse.json({
      success: true,
      chapter: {
        id: updatedChapter.id,
        title: updatedChapter.title,
      }
    })

  } catch (error: any) {
    console.error('❌ [API] Error updating chapter:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update chapter' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/chapters/[id] - 删除章节
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    console.log('🗑️ [API] Deleting chapter:', params.id)

    // 验证管理员权限
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chapterId = parseInt(params.id)

    // 获取章节信息
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        novelId: true,
        wordCount: true,
        chapterNumber: true,
      }
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // 删除章节
    console.log('💾 [API] Deleting chapter from database...')

    await prisma.chapter.delete({
      where: { id: chapterId }
    })

    // 更新小说的章节数和总字数
    console.log('📊 [API] Updating novel statistics...')

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

    // 重新编号剩余章节
    console.log('🔢 [API] Renumbering remaining chapters...')

    const remainingChapters = await prisma.chapter.findMany({
      where: {
        novelId: chapter.novelId,
        chapterNumber: {
          gt: chapter.chapterNumber
        }
      },
      orderBy: { chapterNumber: 'asc' }
    })

    for (const ch of remainingChapters) {
      await prisma.chapter.update({
        where: { id: ch.id },
        data: { chapterNumber: ch.chapterNumber - 1 }
      })
    }

    console.log('✅ [API] Chapter deleted successfully!')

    return NextResponse.json({
      success: true,
      message: 'Chapter deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ [API] Error deleting chapter:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete chapter' },
      { status: 500 }
    )
  }
}