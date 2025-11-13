// src/app/api/library/check/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { isInUserLibrary } from '@/lib/cache'

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ isInLibrary: false })
    }

    const { searchParams } = new URL(request.url)
    const novelId = searchParams.get('novelId')

    if (!novelId) {
      return NextResponse.json({ error: 'Novel ID required' }, { status: 400 })
    }

    // ⚡ Try Redis first for fast lookup
    const isInLibrary = await isInUserLibrary(session.user.id, parseInt(novelId))

    return NextResponse.json({ isInLibrary })
  } catch (error) {
    console.error('GET /api/library/check error:', error)
    return NextResponse.json({ isInLibrary: false })
  }
}