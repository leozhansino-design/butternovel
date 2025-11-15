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

  // Support both User.id and email for backward compatibility with old novel records
  // Old records may have email as authorId, new records use User.id
  const isEmail = userId.includes('@')
  let user = await prisma.user.findUnique({
    where: isEmail ? { email: userId } : { id: userId },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      role: true,  // Include role for admin check
      contributionPoints: true,
      level: true,
      totalReadingTime: true,
      createdAt: true,
      libraryPrivacy: true,  // Include privacy setting
      _count: {
        select: {
          ratings: true,
        },
      },
    },
  })

  // If user not found and querying by email, check AdminProfile table
  // This handles ButterPicks official account
  if (!user && isEmail) {
    const adminProfile = await prisma.adminProfile.findUnique({
      where: { email: userId },
    })

    if (adminProfile) {
      // Return special official account data structure
      return NextResponse.json({
        success: true,
        data: {
          id: adminProfile.email, // Use email as ID for admin
          name: adminProfile.displayName || 'ButterPicks',
          avatar: adminProfile.avatar || null,
          bio: adminProfile.bio || 'Official ButterNovel Account',
          role: 'ADMIN',
          contributionPoints: 0,
          level: 99, // Special level for official account
          totalReadingTime: 0,
          createdAt: adminProfile.createdAt,
          libraryPrivacy: 'PUBLIC',
          isOfficialAccount: true, // Special flag for official accounts
          stats: {
            booksRead: 0,
            following: 0,
            followers: 0,
            totalRatings: 0,
            readingTime: 0,
          },
        },
      }, { status: 200 })
    }
  }

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
    // Silent error handling for missing Follow table
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

  return NextResponse.json({
    success: true,
    data: userData
  }, { status: 200 })
})
