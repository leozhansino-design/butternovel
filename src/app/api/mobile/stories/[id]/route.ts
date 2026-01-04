// Delete story API for mobile app
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/mobile-auth'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { id } = await context.params
    const storyId = parseInt(id)

    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: 'Invalid story ID' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Check if story exists and belongs to user
    const story = await prisma.novel.findUnique({
      where: { id: storyId },
      select: { authorId: true }
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    if (story.authorId !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own stories' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Delete story and related data
    await prisma.$transaction([
      // Delete chapters
      prisma.chapter.deleteMany({ where: { novelId: storyId } }),
      // Delete ratings
      prisma.rating.deleteMany({ where: { novelId: storyId } }),
      // Delete bookmarks
      prisma.bookmark.deleteMany({ where: { novelId: storyId } }),
      // Delete comments
      prisma.paragraphComment.deleteMany({ where: { novelId: storyId } }),
      // Delete the novel
      prisma.novel.delete({ where: { id: storyId } }),
    ])

    console.log('[Delete Story] Story deleted:', storyId)

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Delete Story] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
