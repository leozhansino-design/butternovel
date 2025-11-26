// src/components/front/CategoryRankedList.tsx
// Numbered ranking list - elegant blue theme
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
}

interface CategoryRankedListProps {
  title: string;
  categorySlug?: string;
  books: Book[];
}

export default function CategoryRankedList({
  title,
  categorySlug,
  books
}: CategoryRankedListProps) {
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

  return (
    <section className="w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-8 sm:py-10 md:py-14">
      {/* Section Header */}
      <div className="mb-4 sm:mb-6 md:mb-8 px-4 md:px-8 lg:px-[150px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">
              {title}
            </h2>
          </div>
          {categorySlug && (
            <Link
              href={`/search?genre=${categorySlug}`}
              className="group flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base text-slate-300 hover:text-blue-400 transition-colors font-medium"
            >
              <span>View All</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Carousel Wrapper */}
      <div className="relative">
        {/* Gradient masks - desktop only */}
        {canScrollLeft && (
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10 pointer-events-none w-[120px]" />
        )}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent z-10 pointer-events-none w-[120px]" />

        {/* Nav buttons - desktop only */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-all left-[50px]"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-all right-[50px]"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Ranked list */}
        <div
          ref={trackRef}
          className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 lg:px-[150px]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {books.slice(0, 10).map((book, index) => (
            <Link
              key={book.id}
              href={book.slug ? `/novels/${book.slug}` : `/novels/book-${book.id}`}
              className="group flex-shrink-0 w-[100px] sm:w-[110px] md:w-[130px]"
            >
              {/* Cover with integrated rank - all elements inside overflow:hidden container */}
              <div
                className="relative rounded-lg sm:rounded-xl overflow-hidden bg-slate-700 shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/20 transition-all group-hover:-translate-y-1"
                style={{ aspectRatio: '3/4' }}
              >
                <Image
                  src={book.coverImage || '/placeholder-cover.jpg'}
                  alt={book.title}
                  fill
                  sizes="(max-width: 640px) 100px, 130px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Rank badge - inside cover, top-left */}
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                    'bg-gradient-to-br from-blue-500 to-blue-700'
                  }`}>
                    <span className="text-white font-bold text-[10px] sm:text-xs">
                      {index + 1}
                    </span>
                  </div>
                </div>

                {/* Rating badge - inside cover, top-right */}
                {book.rating && book.rating > 0 && (
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white/95 backdrop-blur-sm px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg">
                    <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-900">{book.rating.toFixed(1)}</span>
                  </div>
                )}

                {/* Bottom gradient overlay for better text readability if needed */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Title */}
              <h3 className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                {book.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
