// Get user's public bookshelf (Library)
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

    // Get user's library/bookshelf with novel details
    const libraryItems = await prisma.library.findMany({
      where: { userId },
      include: {
        novel: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true }
            },
            tags: {
              include: { tag: true }
            },
            chapters: {
              select: { id: true },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format the novels for mobile
    const novels = libraryItems
      .filter((item: typeof libraryItems[number]) => item.novel != null)
      .map((item: typeof libraryItems[number]) => {
        const novel = item.novel!
        return {
          id: novel.id,
          title: novel.title,
          blurb: novel.blurb || '',
          genre: novel.genre || novel.category,
          category: novel.category,
          authorId: novel.authorId,
          authorName: novel.author?.name || 'Unknown Author',
          authorAvatar: novel.author?.avatar,
          viewCount: novel.viewCount || 0,
          likeCount: novel.likeCount || 0,
          wordCount: novel.wordCount || 0,
          averageRating: novel.averageRating ? Number(novel.averageRating) : null,
          createdAt: novel.createdAt.toISOString(),
          tags: novel.tags?.map((t: { tag: { id: number; name: string } }) => ({
            id: t.tag.id,
            name: t.tag.name
          })) || [],
          chapters: novel.chapters?.map((c: { id: number }) => ({ id: c.id })) || [],
        }
      })

    return NextResponse.json({
      success: true,
      novels
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Get User Bookshelf] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
