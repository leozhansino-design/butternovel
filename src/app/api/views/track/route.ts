// src/app/api/views/track/route.ts
import { NextResponse } from 'next/server'
import { trackView } from '@/lib/view-tracker'  // ✅ 改成 trackView
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { novelId } = await request.json()

    if (!novelId) {
      return NextResponse.json({ error: 'novelId required' }, { status: 400 })
    }

    // 获取用户信息
    const session = await auth()
    const userId = session?.user?.id || null

    // 获取IP和UA
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // ✅ 调用 trackView（不是 trackNovelView）
    const result = await trackView({
      novelId: parseInt(novelId),
      userId,
      ipAddress,
      userAgent
    })

    return NextResponse.json({
      success: true,
      counted: result.counted,
      viewCount: result.viewCount
    })
  } catch (error: any) {
    console.error('❌ View tracking API error:', error)
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    )
  }
}