// src/app/api/user/follow/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// POST - Follow a user
export const POST = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { userId } = await request.json()

  if (!userId || typeof userId !== 'string') {
    return errorResponse('User ID is required', 400, 'VALIDATION_ERROR')
  }

  // Can't follow yourself
  if (userId === session.user.id) {
    return errorResponse('You cannot follow yourself', 400, 'VALIDATION_ERROR')
  }

  // Check if target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!targetUser) {
    return errorResponse('User not found', 404, 'USER_NOT_FOUND')
  }

  // Return error if Follow table doesn't exist yet
  try {
    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId
        }
      }
    })

    if (existingFollow) {
      return errorResponse('Already following this user', 400, 'ALREADY_FOLLOWING')
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: userId
      }
    })

    return successResponse({ message: 'Successfully followed user' })
  } catch (error) {
    return errorResponse('Follow system not available yet. Please contact administrator.', 503, 'SERVICE_UNAVAILABLE')
  }
})

// DELETE - Unfollow a user
export const DELETE = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { userId } = await request.json()

  if (!userId || typeof userId !== 'string') {
    return errorResponse('User ID is required', 400, 'VALIDATION_ERROR')
  }

  // Return error if Follow table doesn't exist yet
  try {
    // Find and delete the follow relationship
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId
        }
      }
    })

    if (!follow) {
      return errorResponse('Not following this user', 400, 'NOT_FOLLOWING')
    }

    await prisma.follow.delete({
      where: {
        id: follow.id
      }
    })

    return successResponse({ message: 'Successfully unfollowed user' })
  } catch (error) {
    return errorResponse('Follow system not available yet. Please contact administrator.', 503, 'SERVICE_UNAVAILABLE')
  }
})
