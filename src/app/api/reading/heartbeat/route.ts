// src/app/api/reading/heartbeat/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'

/**
 * 接收阅读心跳，更新用户阅读时长
 * POST /api/reading/heartbeat
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { chapterId, minutes } = body

    if (!chapterId || !minutes || minutes <= 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // 更新用户的总阅读时长
    await withRetry(
      () =>
        prisma.user.update({
          where: { id: session.user.id },
          data: {
            totalReadingMinutes: {
              increment: minutes,
            },
          },
        }),
      { operationName: 'Update reading time' }
    )

    // 可选：记录阅读会话（用于未来分析）
    // await withRetry(
    //   () =>
    //     prisma.readingSession.create({
    //       data: {
    //         userId: session.user.id,
    //         chapterId,
    //         duration: minutes,
    //       },
    //     }),
    //   { operationName: 'Create reading session' }
    // )

    return NextResponse.json({
      success: true,
      message: `Reading time updated: +${minutes} minute(s)`,
    })
  } catch (error: any) {
    console.error('Error updating reading time:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update reading time' },
      { status: 500 }
    )
  }
}
