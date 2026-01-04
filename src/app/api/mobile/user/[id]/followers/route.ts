// User followers list API
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
    const { user: currentUser } = await authenticateRequest(request)

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          }
        }
      }
    })

    // Check if current user follows each person
    let currentUserFollowing: string[] = []
    if (currentUser) {
      const myFollowing = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true }
      })
      currentUserFollowing = myFollowing.map((f: { followingId: string }) => f.followingId)
    }

    const result = followers.map((f: typeof followers[number]) => ({
      id: f.follower.id,
      name: f.follower.name,
      avatar: f.follower.avatar,
      bio: f.follower.bio,
      isFollowing: currentUserFollowing.includes(f.follower.id),
    }))

    return NextResponse.json({ followers: result }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Followers List] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
