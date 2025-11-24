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

  // 检查滚动状态
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

  // 自动滚动
  useEffect(() => {
    if (isPaused || !trackRef.current) return;

    const interval = setInterval(() => {
      if (trackRef.current) {
        const cardWidth = 150 + 16; // 卡片宽度 + gap
        const currentScroll = trackRef.current.scrollLeft;
        const maxScroll = trackRef.current.scrollWidth - trackRef.current.clientWidth;

        if (currentScroll >= maxScroll - 10) {
          // 滚动到末尾，回到开始
          trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // 继续滚动
          trackRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // 滚动一本书的宽度
  const scrollByOneCard = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;

    const cardWidth = 150 + 16; // 卡片宽度 + gap
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
      {/* 标题区域 - 与第一本书对齐 */}
      <div className="mb-4 sm:mb-6 md:mb-8" style={{ paddingLeft: '150px', paddingRight: '150px' }}>
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          Featured Novels
        </h2>
      </div>

      {/* 轮播区域 - 延伸到屏幕边缘 */}
      <div className="relative">
        {/* 左边缘渐变遮罩 */}
        <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-slate-50/80 via-slate-50/60 to-transparent z-10 pointer-events-none" style={{ width: '150px' }} />

        {/* 右边缘渐变遮罩 */}
        <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-slate-50/80 via-slate-50/60 to-transparent z-10 pointer-events-none" style={{ width: '150px' }} />

        {/* 左导航按钮 */}
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

        {/* 右导航按钮 */}
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

        {/* 小说列表 - 横向滚动 */}
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
            <Link
              key={book.id}
              href={`/novels/${book.slug}`}
              className="group block flex-shrink-0"
              style={{ width: '150px' }}
            >
              {/* 封面容器 */}
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

              {/* 标题 */}
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