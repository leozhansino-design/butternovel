// src/app/api/profile/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - 获取用户资料和统计
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        _count: {
          select: {
            library: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 获取阅读统计
    const totalChaptersRead = await prisma.chapterProgress.count({
      where: { userId: session.user.id }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        stats: {
          booksInLibrary: user._count.library,
          chaptersRead: totalChaptersRead,
          // 阅读时长可以后续添加
          readingTime: 0
        }
      }
    })
  } catch (error) {
    console.error('GET /api/profile error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PATCH - 更新用户资料
export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio } = body

    // 验证
    if (name && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }

    if (bio && (typeof bio !== 'string' || bio.length > 500)) {
      return NextResponse.json({ error: 'Bio must be 500 characters or less' }, { status: 400 })
    }

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(bio !== undefined && { bio: bio.trim() || null })
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('PATCH /api/profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
