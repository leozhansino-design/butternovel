// src/app/novels/[slug]/chapters/[number]/page.tsx
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
  const novel = await prisma.novel.findUnique({
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

  if (!novel) return null

  const chapter = await prisma.chapter.findFirst({
    where: {
      novelId: novel.id,
      chapterNumber: chapterNumber,
      isPublished: true
    }
  })

  if (!chapter) return null

  const chapters = await prisma.chapter.findMany({
    where: {
      novelId: novel.id,
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

  return {
    novel,
    chapter,
    chapters,
    totalChapters: novel._count.chapters
  }
}

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