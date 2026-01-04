// User stats API for mobile app
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Get stories read count (from reading history if tracked)
    // For now, this is handled client-side

    return NextResponse.json({
      following: followingCount,
      followers: followersCount,
      bookmarked: bookmarkedCount,
      storiesRead: 0, // Client-side tracking
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[User Stats] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
