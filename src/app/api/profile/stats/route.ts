// src/app/api/profile/stats/route.ts
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  unauthorizedResponse,
  handleApiError
} from '@/lib/api-response'

// GET - Get user statistics
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return unauthorizedResponse()
    }

    // Count unique novels the user has read
    const booksReadCount = await prisma.readingHistory.count({
      where: {
        userId: session.user.id
      }
    })

    return successResponse({
      booksRead: booksReadCount
    })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch profile stats')
  }
}
