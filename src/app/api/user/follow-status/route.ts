// src/app/api/user/follow-status/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling, errorResponse, successResponse } from '@/lib/api-error-handler'

// GET - Check if current user is following a specific user
export const GET = withErrorHandling(async (request: Request) => {
  const session = await auth()

  if (!session?.user?.id) {
    return errorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return errorResponse('User ID is required', 400, 'VALIDATION_ERROR')
  }

  // Return false if Follow table doesn't exist yet
  try {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId
        }
      }
    })

    return successResponse({ isFollowing: !!follow })
  } catch (error) {
    // Follow table doesn't exist yet
    return successResponse({ isFollowing: false })
  }
})
