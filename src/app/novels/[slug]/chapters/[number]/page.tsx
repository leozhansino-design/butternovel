// src/app/novels/[slug]/chapters/[number]/page.tsx
// ✅ 修复：统一缓存策略
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-utils'
import ChapterReader from '@/components/reader/ChapterReader'
import ViewTracker from '@/components/ViewTracker'

interface PageProps {
  params: Promise<{
    slug: string
    number: string
  }>
}

async function getChapterData(slug: string, chapterNumber: number) {
  const [novel, chapter, chapters, nextChapterContent] = await Promise.all([
    withRetry(() =>
      prisma.novel.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          slug: true,
          _count: {
            select: { chapters: true }
          }
        }
      })
    ),

    withRetry(() =>
      prisma.chapter.findFirst({
        where: {
          novel: { slug },
          chapterNumber: chapterNumber,
          isPublished: true
        },
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          content: true,
          wordCount: true,
          novelId: true,
        }
      })
    ),

    withRetry(() =>
      prisma.chapter.findMany({
        where: {
          novel: { slug },
          isPublished: true
        },
        select: {
          id: true,
          chapterNumber: true,
          title: true
        },
        orderBy: {
          chapterNumber: 'asc'
        }
      })
    ),

    withRetry(() =>
      prisma.chapter.findFirst({
        where: {
          novel: { slug },
          chapterNumber: chapterNumber + 1,
          isPublished: true
        },
        select: {
          content: true,
        }
      })
    )
  ])

  if (!novel || !chapter) return null

  return {
    novel,
    chapter,
    chapters,
    nextChapterContent,
    totalChapters: novel._count.chapters
  }
}

// ✅ 修复：只保留这一个缓存配置（1小时）
export const revalidate = 3600

// 🔧 修复 build 连接池超时：允许动态参数，不强制预渲染所有章节
export const dynamicParams = true

export default async function ChapterPage({ params }: PageProps) {
  const resolvedParams = await params
  const chapterNumber = parseInt(resolvedParams.number)

  if (isNaN(chapterNumber)) {
    notFound()
  }

  const data = await getChapterData(resolvedParams.slug, chapterNumber)

  if (!data) {
    notFound()
  }

  return (
    <>
      <ViewTracker novelId={data.novel.id} />
      
      {data.nextChapterContent && (
        <link
          rel="prefetch"
          href={`/novels/${data.novel.slug}/chapters/${chapterNumber + 1}`}
          as="document"
        />
      )}
      
      <ChapterReader
        novel={data.novel}
        chapter={data.chapter}
        chapters={data.chapters}
        totalChapters={data.totalChapters}
      />
    </>
  )
}

export async function generateStaticParams() {
  // 🔧 修复：只预渲染最热门的前 5 个小说的前 3 章
  // 其他章节通过 dynamicParams = true 按需生成
  // 这样可以避免 build 时数据库连接池耗尽

  const novels = await withRetry(() =>
    prisma.novel.findMany({
      where: {
        isPublished: true,
        isBanned: false,
      },
      select: {
        slug: true,
        chapters: {
          where: { isPublished: true },
          select: { chapterNumber: true },
          orderBy: { chapterNumber: 'asc' },
          take: 3  // 只预渲染前 3 章
        }
      },
      orderBy: {
        viewCount: 'desc'  // 按热度排序
      },
      take: 5  // 只预渲染最热门的 5 个小说
    })
  )

  const params: { slug: string; number: string }[] = []

  for (const novel of novels) {
    for (const chapter of novel.chapters) {
      params.push({
        slug: novel.slug,
        number: chapter.chapterNumber.toString()
      })
    }
  }

  // 总共最多预渲染 5 × 3 = 15 个页面
  return params
}