// src/components/front/CategoryCarousel.tsx
// Horizontal scroll category component - Inkitt style
'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import CompactNovelCard from './CompactNovelCard';

interface CategoryCarouselProps {
  title: string;
  categorySlug?: string;
  books: Array<{
    id: number;
    title: string;
    slug?: string;
    coverImage?: string;
    rating?: number | null;
  }>;
}

export default function CategoryCarousel({
  title,
  categorySlug,
  books
}: CategoryCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position
  const checkScrollPosition = () => {
    if (!trackRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 0);
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

  // Scroll by one book width (card width + gap)
  const scrollByOneCard = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;

    const cardWidth = 150 + 16; // Card width + gap
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;

    trackRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  if (books.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      {/* Section Header - aligned with first book */}
      <div className="mb-4 sm:mb-6 md:mb-8" style={{ paddingLeft: '150px', paddingRight: '150px' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
            {title}
          </h2>

          {categorySlug && (
            <Link
              href={`/search?genre=${categorySlug}`}
              className="group flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-600 hover:text-amber-600 transition-colors font-medium flex-shrink-0 ml-2"
            >
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Carousel Wrapper - extends to screen edge */}
      <div className="relative">
        {/* Left edge gradient mask */}
        <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" style={{ width: '150px' }} />

        {/* Right edge gradient mask */}
        <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" style={{ width: '150px' }} />

        {/* Left navigation button */}
        {canScrollLeft && (
          <button
            onClick={() => scrollByOneCard('left')}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
            style={{ left: '70px' }}
            aria-label="Previous"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right navigation button */}
        {canScrollRight && (
          <button
            onClick={() => scrollByOneCard('right')}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
            style={{ right: '70px' }}
            aria-label="Next"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Novel list - horizontal scroll, extends to edge */}
        <div
          ref={trackRef}
          className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{
            paddingLeft: '150px',
            paddingRight: '150px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {books.map((book) => (
            <CompactNovelCard
              key={book.id}
              id={book.id}
              title={book.title}
              slug={book.slug}
              coverImage={book.coverImage}
              rating={book.rating}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
