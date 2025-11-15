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

  // ⭐ CRITICAL FIX: 如果user不存在且userId是email，尝试从admin_profile创建
  // 这解决了旧的小说记录authorId是email但user表中没有记录的问题
  if (!user && isEmail) {
    console.log(`[User Profile API] User not found for ${userId}, checking admin_profile...`)

    try {
      // 查找admin_profile
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { email: userId },
      })

      if (adminProfile) {
        console.log(`[User Profile API] Found admin_profile, creating user account...`)

        // 自动创建user记录
        try {
          user = await prisma.user.create({
            data: {
              email: adminProfile.email,
              name: adminProfile.displayName || 'ButterPicks',
              avatar: adminProfile.avatar || null,
              bio: adminProfile.bio || null,
              role: 'ADMIN',
              isVerified: true,
            },
            select: {
              id: true,
              name: true,
              avatar: true,
              bio: true,
              role: true,
              contributionPoints: true,
              level: true,
              totalReadingTime: true,
              createdAt: true,
              libraryPrivacy: true,
              _count: {
                select: {
                  ratings: true,
                },
              },
            },
          })

          console.log(`[User Profile API] ✅ Successfully created user account from admin_profile`)
        } catch (createError: any) {
          // 处理名字冲突
          if (createError.code === 'P2002') {
            const uniqueName = `${adminProfile.displayName}-${Date.now()}`
            user = await prisma.user.create({
              data: {
                email: adminProfile.email,
                name: uniqueName,
                avatar: adminProfile.avatar || null,
                bio: adminProfile.bio || null,
                role: 'ADMIN',
                isVerified: true,
              },
              select: {
                id: true,
                name: true,
                avatar: true,
                bio: true,
                role: true,
                contributionPoints: true,
                level: true,
                totalReadingTime: true,
                createdAt: true,
                libraryPrivacy: true,
                _count: {
                  select: {
                    ratings: true,
                  },
                },
              },
            })
            console.log(`[User Profile API] ✅ Created user with unique name: ${uniqueName}`)
          } else {
            throw createError
          }
        }
      }
    } catch (error) {
      console.error(`[User Profile API] Error creating user from admin_profile:`, error)
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
