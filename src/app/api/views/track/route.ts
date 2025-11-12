// src/app/api/views/track/route.ts
import { NextResponse } from 'next/server'
import { trackView } from '@/lib/view-tracker'  // ✅ 改成 trackView
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  // 🚨 临时禁用 - 诊断数据库请求异常问题
  console.log('⚠️  [ViewTracker] Temporarily disabled for debugging')
  return NextResponse.json({
    success: true,
    counted: false,
    viewCount: 0
  })