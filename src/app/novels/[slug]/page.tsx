// src/app/novels/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/shared/Footer'
import ViewTracker from '@/components/ViewTracker'
import { formatNumber } from '@/lib/format'

async function getNovel(slug: string) {
  const novel = await prisma.novel.findUnique({
    where: { slug },
    include: {
      category: true,
      chapters: {
        orderBy: { chapterNumber: 'asc' },
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          wordCount: true,
          content: true,
        },
      },
      _count: {
        select: {
          chapters: true,
          likes: true,
        },
      },
    },
  })

  if (!novel || !novel.isPublished || novel.isBanned) {
    return null
  }

  return novel
}

export default async function NovelDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const novel = await getNovel(slug)

  if (!novel) {
    notFound()
  }

  const firstChapter = novel.chapters[0]

  return (
    <>
      <ViewTracker novelId={novel.id} />
      
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-12 md:py-16 bg-gradient-to-b from-amber-50 via-orange-50 to-[#fff7ed]">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="grid lg:grid-cols-[380px_1fr] gap-8 p-8 md:p-12">
                    
                    {/* Cover Image */}
                    <div className="flex justify-center lg:justify-start">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                        <div className="relative w-[280px] h-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
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
                    <div className="flex flex-col gap-6">
                      
                      {/* Title & Author */}
                      <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
                          {novel.title}
                        </h1>
                        <div className="flex items-center gap-2 text-lg">
                          <span className="text-gray-600">by</span>
                          <span className="font-semibold text-gray-900">
                            {novel.authorName}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-3">
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

                      {/* Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                          <div className="text-2xl font-bold text-gray-900">{formatNumber(novel.viewCount)}</div>
                          <div className="text-sm text-gray-600 mt-1">👁️ Reads</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl">
                          <div className="text-2xl font-bold text-gray-900">{novel._count.likes}</div>
                          <div className="text-sm text-gray-600 mt-1">❤️ Votes</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                          <div className="text-2xl font-bold text-gray-900">{novel._count.chapters}</div>
                          <div className="text-sm text-gray-600 mt-1">📖 Chapters</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                          <div className="text-2xl font-bold text-gray-900">
                            {Math.round((novel.chapters.reduce((sum, ch) => sum + ch.wordCount, 0) / 200))}m
                          </div>
                          <div className="text-sm text-gray-600 mt-1">⏱️ Read</div>
                        </div>
                      </div>

                      {/* Blurb */}
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">📖</span>
                          <h2 className="text-lg font-bold text-gray-900">Blurb</h2>
                        </div>
                        <div className="bg-white/80 rounded-xl p-4">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap max-h-[240px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-50">
                            {novel.blurb}
                          </p>
                        </div>
                      </div>

                      {/* CTA Buttons */}
                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        <Link
                          href={`/novels/${novel.slug}/chapters/1`}
                          className="flex items-center gap-2 px-8 py-4 bg-gradient-to-br from-[#f4d03f] via-[#e8b923] to-[#d4a017] hover:from-[#f5d85a] hover:via-[#f4d03f] hover:to-[#e8b923] text-white font-semibold rounded-xl transition-all shadow-[0_4px_14px_rgba(228,185,35,0.4)] hover:shadow-[0_6px_20px_rgba(228,185,35,0.5)] hover:scale-105"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Start Reading
                        </Link>

                        <button 
                          className="p-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl hover:scale-110"
                          aria-label="Add to Library"
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>

                        <button 
                          className="p-4 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl hover:scale-110"
                          aria-label="Like"
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

          {/* First Chapter Preview */}
          {firstChapter && (
            <section className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Chapter 1: {firstChapter.title}
                    </h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
                  </div>

                  <div className="prose prose-lg max-w-none">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 md:p-12">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {firstChapter.content.substring(0, 1000)}...
                      </p>
                      
                      <div className="mt-8 pt-8 border-t border-amber-200">
                        <Link
                          href={`/novels/${novel.slug}/chapters/1`}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                        >
                          Continue Reading
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Chapter List */}
          <section className="py-16 bg-gradient-to-b from-white to-amber-50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    All Chapters ({novel._count.chapters})
                  </h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {novel.chapters.map((chapter) => (
                      <Link
                        key={chapter.id}
                        href={`/novels/${novel.slug}/chapters/${chapter.chapterNumber}`}
                        className="flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-amber-700 font-bold group-hover:scale-110 transition-transform">
                            {chapter.chapterNumber}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                              {chapter.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {chapter.wordCount.toLocaleString()} words
                            </p>
                          </div>
                        </div>
                        <svg 
                          className="w-5 h-5 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}