// User stories API for mobile app
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

    const stories = await prisma.novel.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        tags: true,
        chapters: {
          select: {
            id: true,
            title: true,
            chapterNumber: true,
            wordCount: true,
          },
          orderBy: { chapterNumber: 'asc' },
        },
      },
    })

    // Transform to match ShortNovel model
    const transformedStories = stories.map(story => ({
      id: story.id,
      title: story.title,
      slug: story.slug,
      blurb: story.blurb || '',
      coverImage: story.coverImage,
      authorName: story.authorName,
      shortNovelGenre: story.shortNovelGenre || story.category?.name || 'General',
      viewCount: story.viewCount,
      likeCount: story.likeCount,
      wordCount: story.wordCount,
      averageRating: story.averageRating,
      category: story.category,
      tags: story.tags,
      chapters: story.chapters,
    }))

    return NextResponse.json({
      stories: transformedStories
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[User Stories] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
