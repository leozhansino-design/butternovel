import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'

// GET /api/search/suggestions?q=the+truth
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    // 至少需要2个字符才开始搜索
    if (query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    const normalizedQuery = query.trim().toLowerCase()

    // 只搜索标题，快速返回前10个建议
    const suggestions = await withRetry(
      () => prisma.novel.findMany({
        where: {
          isPublished: true,
          isBanned: false,
          title: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          category: {
            select: {
              name: true,
            },
          },
        },
        take: 10,
      }),
      { operationName: 'Get search suggestions' }
    ) as any[]

    // 按相关性排序：标题开头匹配 > 包含匹配
    const sortedSuggestions = suggestions.sort((a, b) => {
      const aTitle = a.title.toLowerCase()
      const bTitle = b.title.toLowerCase()
      const aStartsWith = aTitle.startsWith(normalizedQuery)
      const bStartsWith = bTitle.startsWith(normalizedQuery)

      // 优先显示以查询开头的结果
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1

      // 其次按标题长度排序（更短的更相关）
      return aTitle.length - bTitle.length
    })

    return NextResponse.json({
      success: true,
      data: sortedSuggestions.map(novel => ({
        id: novel.id,
        title: novel.title,
        slug: novel.slug,
        coverImage: novel.coverImage,
        category: novel.category.name,
      })),
    })
  } catch (error) {
    console.error('Search suggestions API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
