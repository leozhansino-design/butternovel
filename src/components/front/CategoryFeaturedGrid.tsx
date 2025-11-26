// src/components/front/CategoryFeaturedGrid.tsx
// Multiple hero cards with rich info + horizontal scroll
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
  status?: string;
  categoryName?: string;
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
    const scrollAmount = 350;
    const newPos = direction === 'left'
      ? trackRef.current.scrollLeft - scrollAmount
      : trackRef.current.scrollLeft + scrollAmount;
    trackRef.current.scrollTo({ left: newPos, behavior: 'smooth' });
  };

  if (books.length === 0) return null;

  // Mobile: 1-2 hero cards, Desktop: 2-3
  const heroCount = books.length >= 8 ? 3 : (books.length >= 5 ? 2 : 1);
  const heroBooks = books.slice(0, heroCount);
  const restBooks = books.slice(heroCount);

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 px-4 md:px-8 lg:px-[150px]">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          {title}
        </h2>
        {categorySlug && (
          <Link
            href={`/search?genre=${categorySlug}`}
            className="group flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            <span>View All</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}
      </div>

      {/* Horizontal scroll */}
      <div className="relative">
        {/* Gradient masks - desktop only */}
        {canScrollLeft && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none w-[120px]" />
        )}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none w-[120px]" />

        {/* Nav buttons - desktop only */}
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
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 lg:px-[150px]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Hero Cards - responsive width */}
          {heroBooks.map((book) => (
            <Link
              key={book.id}
              href={book.slug ? `/novels/${book.slug}` : `/novels/book-${book.id}`}
              className="group flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px]"
            >
              <div className="relative h-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-800">
                {/* Blurred Background */}
                <div className="absolute inset-0">
                  <Image
                    src={book.coverImage || '/placeholder-cover.jpg'}
                    alt=""
                    fill
                    className="object-cover scale-125 blur-2xl opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-slate-900/70 to-slate-900/90" />
                </div>

                {/* Content */}
                <div className="relative flex gap-3 sm:gap-4 p-4 sm:p-5">
                  {/* Cover with rating badge */}
                  <div className="flex-shrink-0 relative">
                    <div
                      className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20"
                      style={{ width: '90px', height: '120px' }}
                    >
                      <Image
                        src={book.coverImage || '/placeholder-cover.jpg'}
                        alt={book.title}
                        fill
                        sizes="90px"
                        className="object-cover"
                      />
                      {/* Rating badge - top right of cover */}
                      {book.rating && book.rating > 0 && (
                        <div className="absolute top-1 right-1 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg">
                          <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-[10px] font-bold text-gray-900">{book.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                      {book.categoryName && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] sm:text-[10px] font-medium rounded-full">
                          {book.categoryName}
                        </span>
                      )}
                      {book.status && (
                        <span className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium rounded-full ${
                          book.status === 'COMPLETED'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}>
                          {book.status === 'COMPLETED' ? 'Completed' : 'Ongoing'}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 mb-1.5 sm:mb-2">
                      {book.title}
                    </h3>

                    {/* Description */}
                    {book.blurb && (
                      <p className="text-[11px] sm:text-xs text-slate-300/90 line-clamp-2 sm:line-clamp-3 leading-relaxed flex-1">
                        {book.blurb}
                      </p>
                    )}

                    {/* Read button */}
                    <div className="mt-2 sm:mt-3 inline-flex items-center gap-1 sm:gap-1.5 text-blue-400 font-semibold text-xs group-hover:text-blue-300 transition-colors">
                      <span>Read Now</span>
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* Regular book cards */}
          {restBooks.map((book) => (
            <Link
              key={book.id}
              href={book.slug ? `/novels/${book.slug}` : `/novels/book-${book.id}`}
              className="group flex-shrink-0 w-[100px] sm:w-[110px] md:w-[120px]"
            >
              <div
                className="relative rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-all"
                style={{ aspectRatio: '3/4' }}
              >
                <Image
                  src={book.coverImage || '/placeholder-cover.jpg'}
                  alt={book.title}
                  fill
                  sizes="(max-width: 640px) 100px, 120px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {book.rating && book.rating > 0 && (
                  <div className="absolute top-1.5 right-1.5 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold flex items-center gap-0.5 shadow">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{book.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <h3 className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {book.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
