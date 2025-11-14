// src/app/api/profile/[userId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import { calculateContributionPoints } from '@/lib/user-level'

/**
 * 获取用户Profile信息
 * GET /api/profile/[userId]
 */
export async function GET(
  request: Request,
  props: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await props.params
    const userId = params.userId

    // 获取用户完整信息
    const user = await withRetry(
      () =>
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            bio: true,
            contributionPoints: true,
            totalReadingMinutes: true,
            createdAt: true,
            isWriter: true,
            writerName: true,
            // 统计数据
            _count: {
              select: {
                comments: true,
                ratings: true,
                likes: true,
                library: true,
                readingHistory: true,
                ratingReplies: true,
                ratingLikes: true,
              },
            },
            // 书架 (最近10本)
            library: {
              take: 10,
              orderBy: { addedAt: 'desc' },
              select: {
                addedAt: true,
                novel: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImage: true,
                    authorName: true,
                    averageRating: true,
                  },
                },
              },
            },
            // 阅读历史 (最近10本)
            readingHistory: {
              take: 10,
              orderBy: { lastReadAt: 'desc' },
              select: {
                lastReadAt: true,
                novel: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImage: true,
                  },
                },
                chapter: {
                  select: {
                    id: true,
                    title: true,
                    chapterNumber: true,
                  },
                },
              },
            },
            // 评分记录 (最近10条)
            ratings: {
              take: 10,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                score: true,
                review: true,
                likeCount: true,
                createdAt: true,
                novel: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImage: true,
                  },
                },
              },
            },
          },
        }),
      { operationName: 'Get user profile' }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 计算贡献度 (如果数据库没有，从统计计算)
    const contributionPoints =
      user.contributionPoints ||
      calculateContributionPoints({
        comments: user._count.comments,
        ratings: user._count.ratings,
        replies: user._count.ratingReplies,
        likes: user._count.likes,
      })

    // Books Read: 只计算真正读过章节的小说数量
    const booksRead = user.readingHistory.length

    // 格式化响应
    const profileData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'Anonymous User',
        avatar: user.avatar,
        bio: user.bio,
        isWriter: user.isWriter,
        writerName: user.writerName,
        createdAt: user.createdAt,
      },
      stats: {
        contributionPoints,
        totalReadingMinutes: user.totalReadingMinutes || 0,
        booksRead, // 修正后的Books Read统计
        comments: user._count.comments,
        ratings: user._count.ratings,
        likes: user._count.likes,
        libraryBooks: user._count.library,
        replies: user._count.ratingReplies,
        receivedLikes: user._count.ratingLikes,
      },
      library: user.library,
      readingHistory: user.readingHistory,
      ratings: user.ratings,
    }

    return NextResponse.json({
      success: true,
      profile: profileData,
    })
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
