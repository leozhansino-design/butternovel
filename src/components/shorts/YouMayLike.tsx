'use client'

import Link from 'next/link'
import { getShortNovelGenreName, formatReadingTime, estimateReadingTime } from '@/lib/short-novel'

interface ShortNovel {
  id: number
  title: string
  slug: string
  blurb: string
  shortNovelGenre: string | null
  wordCount: number
  viewCount: number
  likeCount: number
  averageRating: number | null
}

interface YouMayLikeProps {
  novels: ShortNovel[]
  variant?: 'sidebar' | 'bottom'
}

// Truncate preview text
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...'
  }
  return truncated + '...'
}

export default function YouMayLike({ novels, variant = 'sidebar' }: YouMayLikeProps) {
  if (novels.length === 0) {
    return null
  }

  // Sidebar variant - vertical list
  if (variant === 'sidebar') {
    return (
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-b border-amber-100/50">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            You May Like
          </h3>
        </div>

        {/* Novel List */}
        <div className="divide-y divide-gray-100/50">
          {novels.slice(0, 4).map((novel) => {
            const readingTime = estimateReadingTime(novel.wordCount)

            return (
              <Link
                key={novel.id}
                href={`/shorts/${novel.slug}`}
                className="group block px-5 py-4 hover:bg-amber-50/50 transition-colors"
              >
                {/* Genre & Time */}
                <div className="flex items-center gap-2 mb-2">
                  {novel.shortNovelGenre && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white rounded text-xs font-medium">
                      {getShortNovelGenreName(novel.shortNovelGenre)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatReadingTime(readingTime)}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2 mb-2">
                  {novel.title}
                </h4>

                {/* Blurb Preview - 150 chars for sidebar */}
                <p className="text-sm text-gray-500 line-clamp-3 mb-3 leading-relaxed">
                  {truncateText(novel.blurb, 150)}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    {novel.viewCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    {novel.likeCount.toLocaleString()}
                  </span>
                  {novel.averageRating && novel.averageRating > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {novel.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* View All Link */}
        <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100/50">
          <Link
            href="/shorts"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl text-amber-600 font-medium hover:bg-amber-50 transition-colors"
          >
            Browse All Shorts
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  // Bottom variant - horizontal cards
  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="flex items-center gap-2 text-xl md:text-2xl font-bold text-gray-900">
          <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          More Stories You&apos;ll Love
        </h3>
        <Link
          href="/shorts"
          className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors"
        >
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {novels.map((novel) => {
          const readingTime = estimateReadingTime(novel.wordCount)

          return (
            <Link
              key={novel.id}
              href={`/shorts/${novel.slug}`}
              className="group block"
            >
              {/* Frosted Glass Card */}
              <div className="relative h-full bg-white/70 backdrop-blur-md rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/50 hover:border-amber-200 hover:-translate-y-1">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-amber-50/30 pointer-events-none" />

                <div className="relative p-5">
                  {/* Genre & Time */}
                  <div className="flex items-center justify-between mb-3">
                    {novel.shortNovelGenre && (
                      <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white rounded-full text-xs font-semibold">
                        {getShortNovelGenreName(novel.shortNovelGenre)}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatReadingTime(readingTime)}
                    </span>
                  </div>

                  {/* Title - Large, bold, max 2 lines */}
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2 mb-3 leading-tight">
                    {novel.title.length > 80 ? novel.title.substring(0, 80) + '...' : novel.title}
                  </h4>

                  {/* Preview - 200 chars */}
                  <p className="text-sm text-gray-600 line-clamp-4 mb-4 leading-relaxed">
                    {truncateText(novel.blurb, 200)}
                  </p>

                  {/* Stats & Read */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100/80">
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
                          <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {novel.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-full shadow-sm group-hover:shadow-md transition-shadow">
                      Read
                      <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Decorative accent */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
