// src/app/api/novel-views/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - 获取阅读历史（访问过详情页的小说）
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取用户访问过的小说（去重）
    const novelViews = await prisma.novelView.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        novel: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        viewedAt: 'desc'
      },
      distinct: ['novelId']
    })

    const history = novelViews.map(view => ({
      id: view.novel.id,
      title: view.novel.title,
      slug: view.novel.slug,
      coverImage: view.novel.coverImage,
      category: view.novel.category.name,
      status: view.novel.status,
      viewedAt: view.viewedAt.toISOString()
    }))

    return NextResponse.json({ history })
  } catch (error) {
    console.error('GET /api/novel-views error:', error)
    return NextResponse.json({ error: 'Failed to fetch reading history' }, { status: 500 })
  }
}

// POST - 记录小说详情页浏览
export async function POST(request: Request) {
  try {
    const session = await auth()
    const { novelId } = await request.json()

    if (!novelId) {
      return NextResponse.json({ error: 'Novel ID required' }, { status: 400 })
    }

    // 如果用户已登录，记录浏览
    if (session?.user?.id) {
      // 检查最近是否已经记录过（避免重复刷新页面创建多条记录）
      const recentView = await prisma.novelView.findFirst({
        where: {
          userId: session.user.id,
          novelId: parseInt(novelId),
          viewedAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // 1小时内
          }
        }
      })

      if (!recentView) {
        await prisma.novelView.create({
          data: {
            userId: session.user.id,
            novelId: parseInt(novelId)
          }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/novel-views error:', error)
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 })
  }
}
