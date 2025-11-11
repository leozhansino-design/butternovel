// src/app/api/library/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - 获取用户书架
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const library = await prisma.library.findMany({
      where: { userId: session.user.id },
      include: {
        novel: {
          include: {
            category: true,
            _count: {
              select: { chapters: true }
            }
          }
        }
      },
      orderBy: {
        addedAt: 'desc'
      }
    })

    // 获取所有小说的阅读历史
    const novelIds = library.map(item => item.novel.id)
    const readingHistories = await prisma.readingHistory.findMany({
      where: {
        userId: session.user.id,
        novelId: { in: novelIds }
      },
      include: {
        chapter: true
      }
    })

    // 获取每本小说已读的章节数
    const chapterProgressCounts = await Promise.all(
      novelIds.map(async (novelId) => {
        const count = await prisma.chapterProgress.count({
          where: {
            userId: session.user.id,
            chapter: { novelId }
          }
        })
        return { novelId, count }
      })
    )

    const progressMap = new Map(chapterProgressCounts.map(item => [item.novelId, item.count]))
    const historyMap = new Map(readingHistories.map(item => [item.novelId, item]))

    const novels = library.map(item => {
      const history = historyMap.get(item.novel.id)
      const readCount = progressMap.get(item.novel.id) || 0

      return {
        id: item.novel.id,
        title: item.novel.title,
        slug: item.novel.slug,
        coverImage: item.novel.coverImage,
        category: item.novel.category.name,
        status: item.novel.status,
        totalChapters: item.novel._count.chapters,
        addedAt: item.addedAt.toISOString(),
        // 阅读进度
        lastReadChapter: history?.chapter.chapterNumber || null,
        readChapters: readCount
      }
    })

    return NextResponse.json({ novels })
  } catch (error) {
    console.error('GET /api/library error:', error)
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 })
  }
}

// POST - 添加到书架
export async function POST(request: Request) {
  try {
    const session = await auth()
    
    console.log('Session:', JSON.stringify(session, null, 2))
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { novelId } = await request.json()

    if (!novelId) {
      return NextResponse.json({ error: 'Novel ID required' }, { status: 400 })
    }

    // 检查用户是否存在
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    console.log('User exists:', userExists)
    
    if (!userExists) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 检查是否已存在
    const existing = await prisma.library.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId: parseInt(novelId)
        }
      }
    })

    if (existing) {
      return NextResponse.json({ message: 'Already in library' })
    }

    await prisma.library.create({
      data: {
        userId: session.user.id,
        novelId: parseInt(novelId)
      }
    })

    return NextResponse.json({ message: 'Added to library' })
  } catch (error) {
    console.error('POST /api/library error:', error)
    return NextResponse.json({ error: 'Failed to add to library' }, { status: 500 })
  }
}

// DELETE - 从书架移除
export async function DELETE(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { novelId } = await request.json()

    if (!novelId) {
      return NextResponse.json({ error: 'Novel ID required' }, { status: 400 })
    }

    await prisma.library.delete({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId: parseInt(novelId)
        }
      }
    })

    return NextResponse.json({ message: 'Removed from library' })
  } catch (error) {
    console.error('DELETE /api/library error:', error)
    return NextResponse.json({ error: 'Failed to remove from library' }, { status: 500 })
  }
}