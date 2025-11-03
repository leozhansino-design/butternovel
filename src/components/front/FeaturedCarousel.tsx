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
  
  // 每次滚动显示8本书
  const booksPerView = 8;
  const maxScroll = Math.max(0, books.length - booksPerView);

  // 自动滚动
  useEffect(() => {
    if (isPaused || maxScroll === 0) return;

    const interval = setInterval(() => {
      setScrollPosition((prev) => {
        const next = prev + 1;
        return next > maxScroll ? 0 : next;
      });
    }, 4000); // 每4秒滚动一次

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
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          ✨ Featured Novels
        </h2>
        
      </div>

      {/* 轮播容器 */}
      <div className="relative -mx-2">
        {/* 左箭头 */}
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

        {/* 书籍网格 - 横向8本 */}
        <div className="overflow-hidden px-2">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${scrollPosition * (100 / booksPerView)}%)`
            }}
          >
            {books.map((book, index) => (
              <div
                key={book.id}
                className="flex-shrink-0 px-2"
                style={{ 
                  width: `${100 / booksPerView}%`,
                  minWidth: '120px' // 最小宽度保证不会太小
                }}
              >
                <Link
                  href={`/novels/${book.slug}`}
                  className="group block"
                >
                  {/* 封面 */}
                  <div className="relative aspect-[2/3] mb-2 overflow-hidden rounded-lg bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300">
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Hover遮罩 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full transition-opacity duration-300">
                        Read
                      </span>
                    </div>

                    {/* 分类角标 */}
                    <div className="absolute top-1.5 left-1.5">
                      <span className="text-[9px] font-bold text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                        {book.category.name.replace(/[🗡️🏙️💕✨]/g, '').trim()}
                      </span>
                    </div>
                  </div>

                  {/* 书名 */}
                  <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-purple-600 transition-colors min-h-[2.5rem]">
                    {book.title}
                  </h3>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* 右箭头 */}
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

      {/* 进度指示器 */}
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