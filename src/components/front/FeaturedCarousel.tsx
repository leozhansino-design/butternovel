// src/components/front/FeaturedCarousel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Book {
  id: number;
  title: string;
  slug: string;
  coverImage: string;
  description: string;
  category: {
    name: string;
  };
}

export default function FeaturedCarousel({ books }: { books: Book[] }) {
  const [isPaused, setIsPaused] = useState(false);
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

  // Auto scroll
  useEffect(() => {
    if (isPaused || !trackRef.current) return;

    const interval = setInterval(() => {
      if (trackRef.current) {
        const cardWidth = 150 + 16; // Card width + gap
        const currentScroll = trackRef.current.scrollLeft;
        const maxScroll = trackRef.current.scrollWidth - trackRef.current.clientWidth;

        if (currentScroll >= maxScroll - 10) {
          // Reached end, scroll back to start
          trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Continue scrolling
          trackRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Scroll by one card width
  const scrollByOneCard = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;

    const cardWidth = 150 + 16; // Card width + gap
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;

    trackRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Title area - aligned with first book */}
      <div className="mb-4 sm:mb-6 md:mb-8 px-4 md:px-8 lg:px-[150px]">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          Featured Novels
        </h2>
      </div>

      {/* Carousel area - extends to screen edge */}
      <div className="relative">
        {/* Left edge gradient mask - hidden on mobile */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 bg-gradient-to-r from-slate-50/80 via-slate-50/60 to-transparent z-10 pointer-events-none lg:w-[150px]" />

        {/* Right edge gradient mask - hidden on mobile */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 bg-gradient-to-l from-slate-50/80 via-slate-50/60 to-transparent z-10 pointer-events-none lg:w-[150px]" />

        {/* Left navigation button */}
        {canScrollLeft && (
          <button
            onClick={() => scrollByOneCard('left')}
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 left-[70px]"
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
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 right-[70px]"
            aria-label="Next"
          >
            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Novel list - horizontal scroll */}
        <div
          ref={trackRef}
          className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 lg:px-[150px]"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/novels/${book.slug}`}
              className="group block flex-shrink-0"
              style={{ width: '150px' }}
            >
              {/* Cover container */}
              <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow"
                   style={{ aspectRatio: '2/3' }}>
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  sizes="150px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title */}
              <h3
                className="mt-2 font-semibold text-gray-900 group-hover:text-amber-600 transition-colors"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.4',
                  height: '2.8em',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word'
                }}
              >
                {book.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}