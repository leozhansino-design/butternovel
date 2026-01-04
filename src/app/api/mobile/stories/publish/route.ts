// Publish story API for mobile app
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/mobile-auth'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const MIN_CHARACTERS = 2000
const MAX_CHARACTERS = 100000
const MAX_TITLE_LENGTH = 80

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await request.json()
    const { title, content, genre, blurb, coverImage, tags } = body

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { error: `Title must be ${MAX_TITLE_LENGTH} characters or less` },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!content || content.length < MIN_CHARACTERS) {
      return NextResponse.json(
        { error: `Story must be at least ${MIN_CHARACTERS} characters` },
        { status: 400, headers: corsHeaders }
      )
    }

    if (content.length > MAX_CHARACTERS) {
      return NextResponse.json(
        { error: `Story must be ${MAX_CHARACTERS} characters or less` },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!genre) {
      return NextResponse.json(
        { error: 'Genre is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Get author info
    const author = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true }
    })

    // Generate slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const timestamp = Date.now().toString(36)
    const slug = `${baseSlug}-${timestamp}`

    // Calculate word count (approximate)
    const wordCount = content.split(/\s+/).length

    // Find or create category
    let category = await prisma.category.findFirst({
      where: { name: genre }
    })

    if (!category) {
      const categorySlug = genre.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      category = await prisma.category.create({
        data: {
          name: genre,
          slug: categorySlug,
        }
      })
    }

    // Create novel with a single chapter
    const novel = await prisma.novel.create({
      data: {
        title: title.trim(),
        slug,
        blurb: blurb || title,
        coverImage: coverImage || null,
        authorId: user.id,
        authorName: author?.name || 'Anonymous',
        categoryId: category.id,
        shortNovelGenre: genre,
        wordCount,
        chapters: {
          create: {
            title: 'Chapter 1',
            chapterNumber: 1,
            content,
            wordCount,
          }
        },
        // Connect or create tags
        tags: tags && tags.length > 0
          ? {
              connectOrCreate: tags.map((tagName: string) => ({
                where: { name: tagName },
                create: {
                  name: tagName,
                  slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                }
              }))
            }
          : undefined,
      },
      include: {
        category: true,
        tags: true,
        chapters: {
          select: {
            id: true,
            title: true,
            chapterNumber: true,
            wordCount: true,
          }
        }
      }
    })

    console.log('[Publish Story] Story created:', novel.id)

    return NextResponse.json({
      success: true,
      story: {
        id: novel.id,
        title: novel.title,
        slug: novel.slug,
        blurb: novel.blurb,
        coverImage: novel.coverImage,
        authorName: novel.authorName,
        shortNovelGenre: novel.shortNovelGenre,
        wordCount: novel.wordCount,
        viewCount: novel.viewCount,
        likeCount: novel.likeCount,
        averageRating: novel.averageRating,
        category: novel.category,
        tags: novel.tags,
        chapters: novel.chapters,
      }
    }, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error('[Publish Story] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
