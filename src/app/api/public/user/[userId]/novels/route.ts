import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user exists (support both User.id and email for admin accounts)
    const isEmail = userId.includes('@')
    let user = await prisma.user.findUnique({
      where: isEmail ? { email: userId } : { id: userId },
      select: {
        id: true,
        name: true
      }
    })

    // If not found in User table and querying by email, check AdminProfile
    if (!user && isEmail) {
      const adminProfile = await prisma.adminProfile.findUnique({
        where: { email: userId }
      })

      if (adminProfile) {
        // Create a virtual user object for admin
        user = {
          id: adminProfile.email,
          name: adminProfile.displayName || 'ButterPicks'
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10') // 2 rows × 5 columns = 10 novels per page
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await prisma.novel.count({
      where: {
        authorId: userId,
        isPublished: true
      }
    })

    // Fetch user's published novels with pagination
    const novels = await prisma.novel.findMany({
      where: {
        authorId: userId,
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        isPublished: true,
        viewCount: true,
        likeCount: true,
        _count: {
          select: {
            chapters: true,
            ratings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    return NextResponse.json({
      novels,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
