// src/components/front/FeaturedCarousel.tsx
'use client';

import { useState, useEffect } from 'react';
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
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const booksPerView = 8;
  const maxScroll = Math.max(0, books.length - booksPerView);

  useEffect(() => {
    if (isPaused || maxScroll === 0) return;

    const interval = setInterval(() => {
      setScrollPosition((prev) => {
        const next = prev + 1;
        return next > maxScroll ? 0 : next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused, maxScroll]);

  const scrollLeft = () => {
    setScrollPosition((prev) => Math.max(0, prev - booksPerView));
  };

  const scrollRight = () => {
    setScrollPosition((prev) => Math.min(maxScroll, prev + booksPerView));
  };

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          ✨ Featured Novels
        </h2>
      </div>

      <div className="relative -mx-2">
        {scrollPosition > 0 && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 border border-gray-200"
            aria-label="向左滚动"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="overflow-hidden px-2">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${scrollPosition * (100 / booksPerView)}%)`
            }}
          >
            {books.map((book) => (
              <div 
                key={book.id}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / booksPerView}%` }}
              >
                <Link
                  href={`/novels/${book.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300">
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="12.5vw"
                    />
                    <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 pointer-events-none" />
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-medium rounded-full">
                        {book.category.name}
                      </span>
                    </div>
                  </div>

                  {/* ⭐ 关键修改：固定高度容器 + 精确行高 + 省略号 */}
                  <h3 
                    className="text-xs font-semibold text-gray-900 mt-1 group-hover:text-purple-600 transition-colors"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: '1.2rem',
                      height: '2.4rem',
                    }}
                  >
                    {book.title}
                  </h3>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {scrollPosition < maxScroll && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 border border-gray-200"
            aria-label="向右滚动"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {maxScroll > 0 && (
        <div className="flex justify-center items-center gap-1.5 mt-3">
          {Array.from({ length: Math.ceil(books.length / booksPerView) }).map((_, index) => {
            const isActive = Math.floor(scrollPosition / booksPerView) === index;
            return (
              <button
                key={index}
                onClick={() => setScrollPosition(index * booksPerView)}
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-6 h-1.5 bg-purple-600'
                    : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`跳转到第${index + 1}组`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}