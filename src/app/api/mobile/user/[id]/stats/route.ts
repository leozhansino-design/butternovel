// User stats API for mobile app
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/mobile-auth'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params

    // Get current user from token (if logged in)
    const { user: currentUser } = await authenticateRequest(request)

    // Get following count
    const followingCount = await prisma.follow.count({
      where: { followerId: userId }
    })

    // Get followers count
    const followersCount = await prisma.follow.count({
      where: { followingId: userId }
    })

    // Get bookmarked count (library items)
    const bookmarkedCount = await prisma.library.count({
      where: { userId }
    })

    // Check if current user is following this user
    let isFollowing = false
    if (currentUser && currentUser.id !== userId) {
      const followRecord = await prisma.follow.findFirst({
        where: {
          followerId: currentUser.id,
          followingId: userId
        }
      })
      isFollowing = !!followRecord
    }

    return NextResponse.json({
      following: followingCount,
      followers: followersCount,
      bookmarked: bookmarkedCount,
      storiesRead: 0, // Client-side tracking
      isFollowing,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[User Stats] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
