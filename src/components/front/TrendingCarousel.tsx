'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { smartTruncate } from '@/lib/utils';

interface TrendingNovel {
  id: number;
  title: string;
  slug: string;
  coverImage: string;
  blurb: string;
  categoryName: string;
  status: string;
  chaptersCount: number;
  rating: number | null;
}

interface TrendingCarouselProps {
  novels: TrendingNovel[];
  autoPlayInterval?: number;
}

export default function TrendingCarousel({
  novels,
  autoPlayInterval = 5000
}: TrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Responsive items per page
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const totalPages = Math.ceil(novels.length / itemsPerPage);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto play
  useEffect(() => {
    if (!isAutoPlaying || novels.length === 0) return;

    const timer = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isAutoPlaying, nextSlide, autoPlayInterval, novels.length]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      nextSlide();
    }
    if (touchStart - touchEnd < -75) {
      prevSlide();
    }
  };

  if (novels.length === 0) {
    return null;
  }

  const startIdx = currentIndex * itemsPerPage;
  const visibleNovels = novels.slice(startIdx, startIdx + itemsPerPage);

  return (
    <section className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-50/50 py-12 md:py-16 lg:py-20">
      <div className="w-full px-5 md:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            🔥 Trending Now
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Discover the hottest novels everyone is reading
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Carousel Track */}
          <div
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <div className="flex gap-4 md:gap-6 transition-transform duration-500 ease-in-out">
              {visibleNovels.map((novel) => (
                <div
                  key={novel.id}
                  className="flex-shrink-0"
                  style={{
                    width: itemsPerPage === 1 ? '100%' : itemsPerPage === 2 ? 'calc(50% - 12px)' : 'calc(33.333% - 16px)'
                  }}
                >
                  <Link
                    href={`/novels/${novel.slug}`}
                    className="group block h-full"
                  >
                    <div className="relative h-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1">
                      {/* Card Content */}
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 h-full">
                        {/* Cover Image */}
                        <div className="flex-shrink-0 mx-auto md:mx-0">
                          <div
                            className="relative rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow"
                            style={{ width: '150px', height: '200px' }}
                          >
                            <Image
                              src={novel.coverImage}
                              alt={novel.title}
                              fill
                              sizes="150px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Rating Badge */}
                            {novel.rating && novel.rating > 0 && (
                              <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                                ★ {novel.rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Novel Info */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          {/* Title */}
                          <div>
                            <h3
                              className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2"
                              title={novel.title}
                            >
                              {novel.title}
                            </h3>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-600 mb-3">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                {novel.categoryName}
                              </span>
                              <span>•</span>
                              <span className={novel.status === 'COMPLETED' ? 'text-green-600 font-medium' : 'text-blue-600 font-medium'}>
                                {novel.status === 'COMPLETED' ? 'Completed' : 'Ongoing'}
                              </span>
                              <span>•</span>
                              <span>{novel.chaptersCount} parts</span>
                            </div>

                            {/* Blurb */}
                            <p className="text-sm md:text-base text-gray-700 line-clamp-3 leading-relaxed">
                              {smartTruncate(novel.blurb, 120)}
                            </p>
                          </div>

                          {/* Read Button */}
                          <div className="mt-4">
                            <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm md:text-base group-hover:gap-3 transition-all">
                              Read Now
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Blue accent border on hover */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          {totalPages > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-10 h-10 md:w-12 md:h-12 bg-white hover:bg-blue-600 text-gray-700 hover:text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-10 border border-gray-200"
                aria-label="Previous"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 w-10 h-10 md:w-12 md:h-12 bg-white hover:bg-blue-600 text-gray-700 hover:text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-10 border border-gray-200"
                aria-label="Next"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6 md:mt-8">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === index
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
