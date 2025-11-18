import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'

// GET /api/search?q=keyword&category=1&page=1&limit=20
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // 最大50条

    // 构建搜索条件
    const where: any = {
      isPublished: true, // 只搜索已发布的小说
      isBanned: false,   // 排除被禁用的小说
    }

    // 搜索关键词（标题、作者名、简介）
    if (query.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { authorName: { contains: query.trim(), mode: 'insensitive' } },
        { blurb: { contains: query.trim(), mode: 'insensitive' } },
      ]
    }

    // 分类筛选
    if (category) {
      where.categoryId = parseInt(category)
    }

    // 执行搜索（带重试机制）
    const [novels, total] = await Promise.all([
      withRetry(
        () => prisma.novel.findMany({
          where,
          select: {
            id: true,
            title: true,
            slug: true,
            blurb: true,
            coverImage: true,
            authorName: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                chapters: {
                  where: { isPublished: true },
                },
                likes: true,
              },
            },
          },
          orderBy: [
            { updatedAt: 'desc' }, // 最近更新的排在前面
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        { operationName: 'Search novels' }
      ),
      withRetry(
        () => prisma.novel.count({ where }),
        { operationName: 'Count search results' }
      ),
    ])

    // 格式化结果
    const formattedNovels = novels.map((novel) => ({
      id: novel.id,
      title: novel.title,
      slug: novel.slug,
      blurb: novel.blurb,
      coverImage: novel.coverImage,
      authorName: novel.authorName,
      status: novel.status,
      createdAt: novel.createdAt,
      updatedAt: novel.updatedAt,
      category: novel.category,
      chaptersCount: novel._count.chapters,
      likesCount: novel._count.likes,
    }))

    return NextResponse.json({
      success: true,
      data: {
        novels: formattedNovels,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
        query: query.trim() || null,
        category: category ? parseInt(category) : null,
      },
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search novels',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
