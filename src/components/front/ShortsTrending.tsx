'use client'

import { useState, useEffect, useRef } from 'react'
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

interface ShortsTrendingProps {
  novels: ShortNovel[]
  autoPlayInterval?: number
}

export default function ShortsTrending({
  novels,
  autoPlayInterval = 6000
}: ShortsTrendingProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Check scroll position
  const checkScrollPosition = () => {
    if (!trackRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScrollPosition()
    const track = trackRef.current
    if (track) {
      track.addEventListener('scroll', checkScrollPosition)
      window.addEventListener('resize', checkScrollPosition)
      return () => {
        track.removeEventListener('scroll', checkScrollPosition)
        window.removeEventListener('resize', checkScrollPosition)
      }
    }
  }, [novels])

  // Auto play with loop
  useEffect(() => {
    if (!isAutoPlaying || !trackRef.current || novels.length === 0) return

    const timer = setInterval(() => {
      if (trackRef.current) {
        const track = trackRef.current
        const currentScroll = track.scrollLeft
        const maxScroll = track.scrollWidth - track.clientWidth

        if (currentScroll >= maxScroll - 10) {
          track.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          const cards = track.children
          if (cards.length === 0) return

          let nextCard: Element | null = null
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement
            const cardLeft = card.offsetLeft - track.offsetLeft
            if (cardLeft > currentScroll + 10) {
              nextCard = card
              break
            }
          }

          if (nextCard) {
            const nextCardElement = nextCard as HTMLElement
            const scrollToPosition = nextCardElement.offsetLeft - track.offsetLeft
            track.scrollTo({ left: scrollToPosition, behavior: 'smooth' })
          }
        }
      }
    }, autoPlayInterval)

    return () => clearInterval(timer)
  }, [isAutoPlaying, autoPlayInterval, novels.length])

  // Scroll by one card with loop support
  const scrollByOneCard = (direction: 'left' | 'right') => {
    if (!trackRef.current) return

    const track = trackRef.current
    const currentScroll = track.scrollLeft
    const maxScroll = track.scrollWidth - track.clientWidth
    const cards = track.children

    if (cards.length === 0) return

    if (direction === 'right') {
      if (currentScroll >= maxScroll - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement
        const cardLeft = card.offsetLeft - track.offsetLeft
        if (cardLeft > currentScroll + 10) {
          track.scrollTo({ left: cardLeft, behavior: 'smooth' })
          return
        }
      }
    } else {
      if (currentScroll <= 10) {
        track.scrollTo({ left: maxScroll, behavior: 'smooth' })
        return
      }
      for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i] as HTMLElement
        const cardLeft = card.offsetLeft - track.offsetLeft
        if (cardLeft < currentScroll - 10) {
          track.scrollTo({ left: cardLeft, behavior: 'smooth' })
          return
        }
      }
    }
  }

  if (novels.length === 0) {
    return null
  }

  return (
    <section className="w-full bg-gradient-to-br from-amber-50 via-white to-orange-50/50 py-10 md:py-14 lg:py-16">
      {/* Section Header */}
      <div className="mb-4 sm:mb-6 md:mb-8 px-4 md:px-8 lg:px-[150px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Shorts Trending
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Quick reads in 10-30 minutes</p>
            </div>
          </div>
          <Link
            href="/shorts"
            className="hidden sm:flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors"
          >
            View All Shorts
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Carousel Wrapper */}
      <div
        className="relative"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Left edge gradient mask */}
        {canScrollLeft && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-50/80 via-amber-50/60 to-transparent z-10 pointer-events-none lg:w-[120px]" />
        )}

        {/* Right edge gradient mask */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 bg-gradient-to-l from-amber-50/80 via-amber-50/60 to-transparent z-10 pointer-events-none lg:w-[120px]" />

        {/* Left navigation button */}
        <button
          onClick={() => scrollByOneCard('left')}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 left-[50px]"
          aria-label="Previous"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right navigation button */}
        <button
          onClick={() => scrollByOneCard('right')}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 right-[50px]"
          aria-label="Next"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Novel Cards */}
        <div
          ref={trackRef}
          className="flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 lg:px-[150px]"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}
        >
          {novels.map((novel) => {
            const readingTime = estimateReadingTime(novel.wordCount)
            const preview = novel.readingPreview || novel.blurb

            return (
              <Link
                key={novel.id}
                href={`/shorts/${novel.slug}`}
                className="group block flex-shrink-0 w-[300px] sm:w-[340px] md:w-[380px] lg:w-[420px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="relative h-full bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-amber-100 hover:border-amber-300 hover:-translate-y-1">
                  {/* Card Content */}
                  <div className="p-5 sm:p-6">
                    {/* Genre & Reading Time */}
                    <div className="flex items-center justify-between mb-3">
                      {novel.shortNovelGenre && (
                        <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-xs font-semibold">
                          {getShortNovelGenreName(novel.shortNovelGenre)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatReadingTime(readingTime)}
                      </span>
                    </div>

                    {/* Title - Bold and prominent */}
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors mb-3 line-clamp-2 leading-tight">
                      {novel.title}
                    </h3>

                    {/* Preview Text */}
                    <p className="text-sm sm:text-base text-gray-600 line-clamp-4 leading-relaxed mb-4">
                      {preview}
                    </p>

                    {/* Stats & Read Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
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

                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm rounded-full group-hover:from-amber-600 group-hover:to-orange-600 transition-all shadow-sm group-hover:shadow-md">
                        Read
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Decorative accent */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile View All Link */}
      <div className="sm:hidden mt-6 px-4">
        <Link
          href="/shorts"
          className="block w-full py-3 text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
        >
          View All Shorts
        </Link>
      </div>
    </section>
  )
}
