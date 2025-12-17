'use client'

import Link from 'next/link'
import { formatReadingTime, estimateReadingTime, getShortNovelGenreName } from '@/lib/short-novel'

interface ShortNovel {
  id: number
  title: string
  slug: string
  blurb: string
  readingPreview: string | null
  shortNovelGenre: string | null
  wordCount: number
  viewCount: number
  likeCount: number
  averageRating: number | null
}

interface FeaturedShortsProps {
  novels: ShortNovel[]
}

export default function FeaturedShorts({ novels }: FeaturedShortsProps) {
  if (novels.length === 0) {
    return null
  }

  return (
    <section className="w-full bg-white py-10 md:py-14 lg:py-16">
      <div className="px-4 md:px-8 lg:px-[150px]">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Featured Shorts
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Discover new quick reads</p>
          </div>
          <Link
            href="/shorts"
            className="hidden sm:flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {novels.slice(0, 6).map((novel) => {
            const readingTime = estimateReadingTime(novel.wordCount)
            const previewText = novel.readingPreview || novel.blurb
            const maxPreviewLength = 280

            return (
              <Link
                key={novel.id}
                href={`/shorts/${novel.slug}`}
                className="group block"
              >
                <div className="relative h-full bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-0.5">
                  <div className="p-5">
                    {/* Genre & Time */}
                    <div className="flex items-center justify-between mb-3">
                      {novel.shortNovelGenre && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                          {getShortNovelGenreName(novel.shortNovelGenre)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatReadingTime(readingTime)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-3 line-clamp-2 leading-tight">
                      {novel.title.length > 80 ? novel.title.substring(0, 80) + '...' : novel.title}
                    </h3>

                    {/* Preview */}
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {previewText.length > maxPreviewLength ? (
                        <>
                          {previewText.substring(0, maxPreviewLength)}
                          <span className="text-blue-600 font-medium"> ...more</span>
                        </>
                      ) : (
                        previewText
                      )}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {novel.viewCount.toLocaleString()}
                        </span>
                        {novel.averageRating && novel.averageRating > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {novel.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <span className="text-blue-600 font-medium text-sm group-hover:underline">
                        Read →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Mobile View All */}
        <div className="sm:hidden mt-6">
          <Link
            href="/shorts"
            className="block w-full py-3 text-center border border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all"
          >
            View All Shorts
          </Link>
        </div>
      </div>
    </section>
  )
}
