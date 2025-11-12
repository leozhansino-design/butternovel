// src/app/novels/[slug]/chapters/[number]/page.tsx
// ✅ 修复：统一缓存策略
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { withRetry } from '@/lib/db-retry'
import ChapterReader from '@/components/reader/ChapterReader'
import ViewTracker from '@/components/ViewTracker'

interface PageProps {
  params: Promise<{
    slug: string
    number: string
  }>
}

async function getChapterData(slug: string, chapterNumber: number) {
  // 🔄 添加数据库重试机制，解决连接超时问题
  const [novel, chapter, chapters, nextChapterContent] = await Promise.all([
    withRetry(
      () => prisma.novel.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          slug: true,
          _count: {
            select: { chapters: true }
          }
        }
      }),
      { operationName: 'Get novel for chapter page' }
    ),

    withRetry(
      () => prisma.chapter.findFirst({
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
      }),
      { operationName: 'Get current chapter' }
    ),

    withRetry(
      () => prisma.chapter.findMany({
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
      }),
      { operationName: 'Get all chapters list' }
    ),

    withRetry(
      () => prisma.chapter.findFirst({
        where: {
          novel: { slug },
          chapterNumber: chapterNumber + 1,
          isPublished: true
        },
        select: {
          content: true,
        }
      }),
      { operationName: 'Get next chapter for prefetch' }
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
  // 🔧 修复构建时数据库连接问题：完全跳过预渲染
  // 所有章节页面都通过 dynamicParams = true 在访问时动态生成
  // 这样可以避免构建时的数据库连接超时问题

  console.log('📝 [Build] Skipping chapter pages pre-rendering to avoid DB connection issues')

  // 返回空数组，不预渲染任何章节页面
  return []
}