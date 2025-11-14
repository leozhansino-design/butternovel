// src/app/api/user/[userId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse } from '@/lib/api-error-handler'

// GET - Get public user profile data
export const GET = withErrorHandling(async (
  request: Request,
  context: { params: Promise<{ userId: string }> }
) => {
  const { userId } = await context.params

  if (!userId) {
    return errorResponse('User ID is required', 400, 'VALIDATION_ERROR')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      contributionPoints: true,
      level: true,
      totalReadingTime: true,
      createdAt: true,
      _count: {
        select: {
          ratings: true,
        },
      },
    },
  })

  if (!user) {
    return errorResponse('User not found', 404, 'USER_NOT_FOUND')
  }

  // Get books read count (unique novels from reading history)
  const booksReadRecords = await prisma.readingHistory.findMany({
    where: {
      userId: user.id,
    },
    select: { novelId: true },
    distinct: ['novelId'],
  })
  const booksRead = booksReadRecords.length

  // Get following and followers counts (default to 0 if Follow table doesn't exist)
  let following = 0
  let followers = 0
  try {
    following = await prisma.follow.count({
      where: { followerId: user.id }
    })
    followers = await prisma.follow.count({
      where: { followingId: user.id }
    })
  } catch (error) {
    console.log('Follow table does not exist yet. Run: npx prisma db push')
  }

  const userData = {
    ...user,
    stats: {
      booksRead: booksRead,
      following: following,
      followers: followers,
      totalRatings: user._count.ratings,
      readingTime: user.totalReadingTime,
    },
  }

  console.log('[API /api/user/[userId]] Returning user data:', {
    userId: userId,
    userName: user.name,
    hasStats: !!userData.stats
  })

  return NextResponse.json({
    success: true,
    data: userData
  }, { status: 200 })
})
