// src/app/api/admin/novels/[id]/ban/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'

export const POST = withAdminAuth(async (
  session,
  request: Request,
  props: { params: Promise<{ id: string }> }
) => {
  try {
    const params = await props.params

    const novelId = parseInt(params.id)
    const { isBanned } = await request.json()

    // 🔄 添加数据库重试机制，解决连接超时问题
    const novel = await withRetry(
      () => prisma.novel.update({
        where: { id: novelId },
        data: { isBanned },
        select: { id: true, title: true, isBanned: true }
      }),
      { operationName: 'Update novel ban status' }
    )

    return NextResponse.json({
      success: true,
      novel
    })

  } catch (error: any) {
    console.error('Ban/Unban error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update ban status' },
      { status: 500 }
    )
  }
})