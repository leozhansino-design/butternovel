// src/app/api/views/track/route.ts
import { NextResponse } from 'next/server'
// import { trackView } from '@/lib/view-tracker'
// import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  // 🚨 临时禁用 View 追踪 - 减少数据库查询
  return NextResponse.json({ success: true, counted: false, viewCount: 0 })
}