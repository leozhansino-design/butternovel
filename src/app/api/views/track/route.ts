// src/app/api/views/track/route.ts
import { NextResponse } from 'next/server'
import { trackNovelView } from '@/lib/view-tracker'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { novelId } = await request.json()

    if (!novelId) {
      return NextResponse.json({ error: 'novelId required' }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id || null

    const result = await trackNovelView(novelId, userId)

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