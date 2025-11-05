// src/app/novels/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

async function getNovelBySlug(slug: string) {
  const novel = await prisma.novel.findUnique({
    where: { slug },
    include: {
      category: true,
      chapters: {
        where: { isPublished: true },
        orderBy: { chapterNumber: 'asc' },
        take: 2,
      },
      _count: {
        select: {
          chapters: true,
          likes: true,
          comments: true,
        }
      }
    }
  })

  return novel
}

export default async function NovelDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const novel = await getNovelBySlug(resolvedParams.slug)

  if (!novel || !novel.isPublished || novel.isBanned) {
    notFound()
  }

  const firstChapter = novel.chapters[0]
  const secondChapter = novel.chapters[1]

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* 毛玻璃卡片 */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                  {/* Cover */}
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="relative w-64 md:w-72 lg:w-80">
                      <div className="aspect-[2/3] relative rounded-xl overflow-hidden shadow-2xl">
                        <Image
                          src={novel.coverImage}
                          alt={novel.title}
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                      {novel.title}
                    </h1>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-gray-600">by</span>
                      <span className="font-semibold text-gray-900 text-lg">
                        {novel.authorName}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <span className="px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full font-medium text-sm">
                        {novel.category.name}
                      </span>
                      <span className={`px-4 py-1.5 rounded-full font-medium text-sm ${
                        novel.status === 'COMPLETED' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {novel.status === 'COMPLETED' ? '✓ Completed' : '📝 Ongoing'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 mb-8 text-gray-700">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="font-medium">{formatNumber(novel.viewCount)}</span>
                        <span className="text-sm">Reads</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span className="font-medium">{formatNumber(novel._count.likes)}</span>
                        <span className="text-sm">Votes</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="font-medium">{novel._count.chapters}</span>
                        <span className="text-sm">Chapters</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{Math.ceil(novel.wordCount / 200)}m</span>
                        <span className="text-sm">Read</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {firstChapter && (
                        <Link
                          href={`/novels/${novel.slug}/chapters/${firstChapter.chapterNumber}`}
                          className="px-8 py-3 bg-gradient-to-r from-[#b39320] to-[#d4af37] hover:from-[#9a7d1a] hover:to-[#b39320] text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Start Reading
                        </Link>
                      )}
                      
                      {/* 爱心按钮 */}
                      <button 
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b39320] to-[#d4af37] hover:from-[#9a7d1a] hover:to-[#b39320] flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                        aria-label="Add to Library"
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blurb Section - 白色背景 */}
        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <svg className="w-7 h-7 text-[#b39320]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Blurb
              </h2>
              <div className="prose prose-xl max-w-none">
                <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                  {novel.blurb}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 1 - 白色背景 */}
        {firstChapter && (
          <section className="py-12 md:py-16 bg-white border-t border-gray-200">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* 章节标题 */}
                <div className="text-center border-b border-gray-200 pb-8">
                  <div className="text-sm text-gray-500 mb-4 font-medium tracking-wider uppercase">
                    Chapter {firstChapter.chapterNumber}
                  </div>
                  <h3 className="text-4xl md:text-5xl font-bold text-gray-900">
                    {firstChapter.title}
                  </h3>
                </div>

                {/* 完整章节内容 */}
                <div className="prose prose-lg max-w-none">
                  <div className="text-gray-800 text-lg leading-loose whitespace-pre-wrap">
                    {firstChapter.content}
                  </div>
                </div>

                {/* Continue Reading 按钮 */}
                <div className="border-t border-gray-200 pt-10 text-center">
                  {secondChapter ? (
                    <Link
                      href={`/novels/${novel.slug}/chapters/${secondChapter.chapterNumber}`}
                      className="inline-flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-[#b39320] to-[#d4af37] hover:from-[#9a7d1a] hover:to-[#b39320] text-white font-bold text-lg rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <span>Continue Reading</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  ) : (
                    <div className="text-gray-700 text-lg">
                      <p className="mb-4">🎉 You've reached the end of available chapters!</p>
                      <Link
                        href="/"
                        className="text-[#b39320] hover:text-[#9a7d1a] font-semibold"
                      >
                        Browse more novels →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
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
    },
    take: 100,
  })

  return novels.map((novel) => ({
    slug: novel.slug,
  }))
}


