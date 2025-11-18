import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'

/**
 * 计算搜索相关性分数
 * 优先级：标题精确匹配 > 标题前缀匹配 > 标题包含 > 作者匹配 > 简介匹配
 */
function calculateRelevanceScore(novel: any, query: string): number {
  const normalizedQuery = query.toLowerCase().trim()
  const title = novel.title.toLowerCase()
  const authorName = novel.authorName.toLowerCase()
  const blurb = novel.blurb.toLowerCase()

  // 去除空格版本（支持 "thetruth" 搜索 "the truth switch"）
  const titleNoSpaces = title.replace(/\s+/g, '')
  const queryNoSpaces = normalizedQuery.replace(/\s+/g, '')

  let score = 0

  // 标题精确匹配（最高优先级）
  if (title === normalizedQuery) {
    score += 1000
  }
  // 标题以查询开头（高优先级）
  else if (title.startsWith(normalizedQuery)) {
    score += 800
  }
  // 无空格版本精确匹配
  else if (titleNoSpaces === queryNoSpaces) {
    score += 700
  }
  // 无空格版本前缀匹配
  else if (titleNoSpaces.startsWith(queryNoSpaces)) {
    score += 600
  }
  // 标题包含查询
  else if (title.includes(normalizedQuery)) {
    score += 500
    // 如果匹配在词首，额外加分
    const words = title.split(/\s+/)
    if (words.some(word => word.startsWith(normalizedQuery))) {
      score += 200
    }
  }
  // 作者名匹配
  else if (authorName.includes(normalizedQuery)) {
    score += 100
  }
  // 简介匹配
  else if (blurb.includes(normalizedQuery)) {
    score += 50
  }

  // 额外因素：标题越短，相关性可能越高
  score -= title.length * 0.1

  // 热度因素：点赞数和章节数
  score += (novel._count?.likes || 0) * 0.5
  score += (novel._count?.chapters || 0) * 0.2

  return score
}

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

    // 如果有搜索关键词，获取更多结果以便排序（不分页）
    // 否则按更新时间排序并分页
    const shouldRankByRelevance = query.trim().length > 0

    let novels: any[] = []
    let total = 0

    if (shouldRankByRelevance) {
      // 获取所有匹配结果（限制最多200条以避免性能问题）
      const allResults = await withRetry(
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
          take: 200, // 限制最大查询量
        }),
        { operationName: 'Search novels' }
      ) as any[]

      // 计算相关性分数并排序
      const rankedResults = allResults
        .map(novel => ({
          ...novel,
          relevanceScore: calculateRelevanceScore(novel, query.trim()),
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)

      total = rankedResults.length

      // 手动分页
      const startIndex = (page - 1) * limit
      novels = rankedResults.slice(startIndex, startIndex + limit)
    } else {
      // 无搜索关键词，按更新时间排序
      const [allNovels, count] = await Promise.all([
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
              { updatedAt: 'desc' },
            ],
            skip: (page - 1) * limit,
            take: limit,
          }),
          { operationName: 'Get novels' }
        ) as Promise<any[]>,
        withRetry(
          () => prisma.novel.count({ where }),
          { operationName: 'Count novels' }
        ) as Promise<number>,
      ])

      novels = allNovels
      total = count
    }

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
