// src/components/front/CategoryCompactGrid.tsx
// Compact grid layout with frosted glass cards - 2 rows
'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Book {
  id: number;
  title: string;
  slug?: string;
  coverImage?: string;
  rating?: number | null;
  authorName?: string;
  categoryName?: string;
  chaptersCount?: number;
}

interface CategoryCompactGridProps {
  title: string;
  categorySlug?: string;
  books: Book[];
  variant?: 'default' | 'warm' | 'cool';
}

export default function CategoryCompactGrid({
  title,
  categorySlug,
  books,
  variant = 'default'
}: CategoryCompactGridProps) {
  if (books.length === 0) return null;

  // Show 4 or 8 books to ensure complete rows (2 cols mobile, 4 cols desktop)
  const maxBooks = books.length >= 8 ? 8 : (books.length >= 4 ? 4 : books.length);
  const displayBooks = books.slice(0, maxBooks);

  const bgStyles = {
    default: 'bg-slate-50/50',
    warm: 'bg-gradient-to-br from-blue-50/40 via-slate-50/30 to-sky-50/30',
    cool: 'bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-slate-50/40'
  };

  const accentColors = {
    default: 'hover:text-blue-600',
    warm: 'hover:text-blue-600',
    cool: 'hover:text-blue-600'
  };

  return (
    <section className={`w-full ${bgStyles[variant]} py-8 sm:py-10 md:py-12`}>
      <div className="px-4 md:px-8 lg:px-[150px]">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          {categorySlug && (
            <Link
              href={`/search?genre=${categorySlug}`}
              className={`group flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base text-gray-600 ${accentColors[variant]} transition-colors font-medium`}
            >
              <span>View All</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>

        {/* Grid - horizontal cards with cover + info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayBooks.map((book) => (
            <Link
              key={book.id}
              href={book.slug ? `/novels/${book.slug}` : `/novels/book-${book.id}`}
              className="group block"
            >
              <div className="flex gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-0.5 border border-white/50">
                {/* Cover with rating badge */}
                <div className="flex-shrink-0 relative">
                  <div
                    className="relative rounded-lg overflow-hidden bg-gray-100 shadow-sm"
                    style={{ width: '72px', height: '96px' }}
                  >
                    <Image
                      src={book.coverImage || '/placeholder-cover.jpg'}
                      alt={book.title}
                      fill
                      sizes="72px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Rating badge on cover */}
                    {book.rating && book.rating > 0 && (
                      <div className="absolute top-1 right-1 bg-white/95 backdrop-blur-sm px-1 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 shadow">
                        <svg className="w-2 h-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{book.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
                  <h3 className={`text-sm font-semibold text-gray-900 ${accentColors[variant]} transition-colors line-clamp-2`}>
                    {book.title}
                  </h3>
                  {book.authorName && (
                    <p className="text-[10px] text-gray-500 truncate">
                      {book.authorName}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    {book.categoryName && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full truncate max-w-[50px]">
                        {book.categoryName}
                      </span>
                    )}
                    {book.chaptersCount !== undefined && book.chaptersCount > 0 && (
                      <span>{book.chaptersCount} Ch</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
