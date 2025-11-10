// src/app/novels/[slug]/chapters/[number]/page.tsx
// ✅ 性能优化版本 - 合并查询，减少数据库往返次数
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ChapterReader from '@/components/reader/ChapterReader'
import ViewTracker from '@/components/ViewTracker'

interface PageProps {
  params: Promise<{
    slug: string
    number: string
  }>
}

async function getChapterData(slug: string, chapterNumber: number) {
  // ✅ 一次查询获取所有需要的数据
  const [novel, chapter, chapters] = await Promise.all([
    // 查询小说基本信息
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
    }),
    
    // 查询当前章节（包含content）
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
    }),
    
    // 查询章节列表（不包含content）
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
  ])

  if (!novel || !chapter) return null

  return {
    novel,
    chapter,
    chapters,
    totalChapters: novel._count.chapters
  }
}

export const revalidate = 3600

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
  const novels = await prisma.novel.findMany({
    where: {
      isPublished: true,
      isBanned: false,
    },
    select: {
      slug: true,
      chapters: {
        where: { isPublished: true },
        select: { chapterNumber: true },
        take: 50
      }
    },
    take: 100
  })

  const params: { slug: string; number: string }[] = []
  
  for (const novel of novels) {
    for (const chapter of novel.chapters) {
      params.push({
        slug: novel.slug,
        number: chapter.chapterNumber.toString()
      })
    }
  }

  return params
}