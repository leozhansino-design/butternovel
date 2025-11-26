// src/components/front/CategoryFeaturedGrid.tsx
// Featured spotlight + horizontal scroll - 1 hero book with blur bg + scrollable list
'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Book {
  id: number;
  title: string;
  slug?: string;
  coverImage?: string;
  rating?: number | null;
  blurb?: string;
}

interface CategoryFeaturedGridProps {
  title: string;
  categorySlug?: string;
  books: Book[];
}

export default function CategoryFeaturedGrid({
  title,
  categorySlug,
  books
}: CategoryFeaturedGridProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
    const track = trackRef.current;
    if (track) {
      track.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      return () => {
        track.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [books]);

  const scroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const scrollAmount = 300;
    const newPos = direction === 'left'
      ? trackRef.current.scrollLeft - scrollAmount
      : trackRef.current.scrollLeft + scrollAmount;
    trackRef.current.scrollTo({ left: newPos, behavior: 'smooth' });
  };

  if (books.length === 0) return null;

  const featured = books[0];
  const restBooks = books.slice(1);

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8 px-4 md:px-8 lg:px-[150px]">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          {title}
        </h2>
        {categorySlug && (
          <Link
            href={`/search?genre=${categorySlug}`}
            className="group flex items-center gap-1.5 text-sm sm:text-base text-gray-600 hover:text-amber-600 transition-colors font-medium"
          >
            <span>View All</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}
      </div>

      {/* Featured Hero Card with Frosted Glass */}
      <div className="px-4 md:px-8 lg:px-[150px] mb-6">
        <Link
          href={featured.slug ? `/novels/${featured.slug}` : `/novels/book-${featured.id}`}
          className="group block"
        >
          <div className="relative rounded-2xl overflow-hidden bg-slate-900">
            {/* Blurred Background Image */}
            <div className="absolute inset-0">
              <Image
                src={featured.coverImage || '/placeholder-cover.jpg'}
                alt=""
                fill
                className="object-cover scale-110 blur-2xl opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90" />
            </div>

            {/* Content */}
            <div className="relative flex items-center gap-6 p-6 md:p-8">
              {/* Cover - Fixed size, no scaling beyond 300x400 */}
              <div className="flex-shrink-0">
                <div
                  className="relative rounded-lg overflow-hidden shadow-2xl group-hover:shadow-amber-500/20 transition-shadow"
                  style={{ width: '120px', height: '160px' }}
                >
                  <Image
                    src={featured.coverImage || '/placeholder-cover.jpg'}
                    alt={featured.title}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  {/* Rating Badge */}
                  {featured.rating && featured.rating > 0 && (
                    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1 shadow-lg">
                      <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-bold">{featured.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 mb-2">
                  {featured.title}
                </h3>
                {featured.blurb && (
                  <p className="text-sm text-slate-300 line-clamp-2 md:line-clamp-3 leading-relaxed mb-4">
                    {featured.blurb}
                  </p>
                )}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm rounded-full transition-colors">
                  Read Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Rest books - Horizontal Scroll */}
      {restBooks.length > 0 && (
        <div className="relative">
          {/* Gradient masks */}
          {canScrollLeft && (
            <div className="hidden lg:block absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none w-[120px]" />
          )}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none w-[120px]" />

          {/* Nav buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all left-[50px]"
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all right-[50px]"
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Scrollable list */}
          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 lg:px-[150px]"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {restBooks.map((book) => (
              <Link
                key={book.id}
                href={book.slug ? `/novels/${book.slug}` : `/novels/book-${book.id}`}
                className="group flex-shrink-0"
                style={{ width: '120px' }}
              >
                {/* Cover - 3:4 ratio matching 300x400 */}
                <div
                  className="relative rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-all"
                  style={{ aspectRatio: '3/4' }}
                >
                  <Image
                    src={book.coverImage || '/placeholder-cover.jpg'}
                    alt={book.title}
                    fill
                    sizes="120px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {book.rating && book.rating > 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 shadow">
                      <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {book.rating.toFixed(1)}
                    </div>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2">
                  {book.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
