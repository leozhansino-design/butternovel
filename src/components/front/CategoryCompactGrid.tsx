// src/components/front/CategoryCompactGrid.tsx
// Compact grid layout - clean 2-row grid display
'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Book {
  id: number;
  title: string;
  slug?: string;
  coverImage?: string;
  rating?: number | null;
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

  const displayBooks = books.slice(0, 8); // Show 8 books max (4x2 grid)

  const bgStyles = {
    default: 'bg-white',
    warm: 'bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30',
    cool: 'bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30'
  };

  const accentColors = {
    default: 'text-gray-900 hover:text-amber-600',
    warm: 'text-gray-900 hover:text-orange-600',
    cool: 'text-gray-900 hover:text-blue-600'
  };

  return (
    <section className={`w-full ${bgStyles[variant]} py-10 md:py-14`}>
      <div className="px-4 md:px-8 lg:px-[150px]">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          {categorySlug && (
            <Link
              href={`/search?genre=${categorySlug}`}
              className={`group flex items-center gap-1.5 text-sm sm:text-base text-gray-600 ${accentColors[variant].split(' ')[1]} transition-colors font-medium`}
            >
              <span>View All</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {displayBooks.map((book) => (
            <Link
              key={book.id}
              href={book.slug ? `/novels/${book.slug}` : `/novels/book-${book.id}`}
              className="group block"
            >
              <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 border border-gray-100">
                {/* Cover */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={book.coverImage || `https://images.unsplash.com/photo-${1544947950 + book.id}?w=200&h=300&fit=crop`}
                    alt={book.title}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 23vw, 200px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Rating */}
                  {book.rating && book.rating > 0 && (
                    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1 shadow text-xs font-bold">
                      <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {book.rating.toFixed(1)}
                    </div>
                  )}
                </div>
                {/* Title */}
                <h3 className={`mt-3 text-sm font-semibold ${accentColors[variant]} transition-colors line-clamp-2`}>
                  {book.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
