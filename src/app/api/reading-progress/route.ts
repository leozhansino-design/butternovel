// src/app/api/reading-progress/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'
import { NextResponse } from 'next/server'

// POST - 记录阅读进度
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { novelId, chapterId } = await request.json()

    if (!novelId || !chapterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 更新或创建阅读历史
    await withRetry(() =>
      prisma.readingHistory.upsert({
        where: {
          userId_novelId: {
            userId: session.user.id,
            novelId: parseInt(novelId)
          }
        },
        update: {
          chapterId: parseInt(chapterId),
          lastReadAt: new Date()
        },
        create: {
          userId: session.user.id,
          novelId: parseInt(novelId),
          chapterId: parseInt(chapterId)
        }
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/reading-progress error:', error)
    return NextResponse.json({ error: 'Failed to save reading progress' }, { status: 500 })
  }
}
