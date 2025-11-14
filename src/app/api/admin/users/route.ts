// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { withAdminAuth } from '@/lib/admin-middleware'

/**
 * 获取用户列表（带搜索、筛选、分页）
 * GET /api/admin/users?page=1&limit=20&search=&authMethod=&status=&sortBy=createdAt&sortOrder=desc
 */
export const GET = withAdminAuth(async (session, request: Request) => {
  try {
    const { searchParams } = new URL(request.url)

    // 分页参数
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 搜索参数
    const search = searchParams.get('search') || ''
    const authMethod = searchParams.get('authMethod') || '' // all | google | facebook | email
    const status = searchParams.get('status') || '' // all | active | banned | verified

    // 排序参数
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 构建查询条件
    const where: any = {}

    // 搜索条件（邮箱或名字）
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 注册方式筛选
    if (authMethod === 'google') {
      where.googleId = { not: null }
    } else if (authMethod === 'facebook') {
      where.facebookId = { not: null }
    } else if (authMethod === 'email') {
      where.googleId = null
      where.facebookId = null
    }

    // 状态筛选
    if (status === 'banned') {
      where.isBanned = true
    } else if (status === 'active') {
      where.isBanned = false
      where.isActive = true
    } else if (status === 'verified') {
      where.isVerified = true
    }

    // 排序
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // 获取总数和用户列表
    const [total, users] = await Promise.all([
      withRetry(() => prisma.user.count({ where }), { operationName: 'Count users' }),
      withRetry(
        () =>
          prisma.user.findMany({
            where,
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              role: true,
              googleId: true,
              facebookId: true,
              isWriter: true,
              isVerified: true,
              isActive: true,
              isBanned: true,
              createdAt: true,
              updatedAt: true,
              // 统计信息
              _count: {
                select: {
                  comments: true,
                  ratings: true,
                  likes: true,
                  library: true,
                  readingHistory: true,
                  ratingReplies: true,
                },
              },
            },
            skip,
            take: limit,
            orderBy,
          }),
        { operationName: 'Get users list' }
      ),
    ])

    // 格式化用户数据
    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name || 'Unnamed User',
      avatar: user.avatar,
      role: user.role,
      authMethod: user.googleId
        ? 'google'
        : user.facebookId
        ? 'facebook'
        : 'email',
      isWriter: user.isWriter,
      isVerified: user.isVerified,
      isActive: user.isActive,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        comments: user._count.comments,
        ratings: user._count.ratings,
        likes: user._count.likes,
        libraryBooks: user._count.library,
        readingHistory: user._count.readingHistory,
        replies: user._count.ratingReplies,
      },
    }))

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
})
