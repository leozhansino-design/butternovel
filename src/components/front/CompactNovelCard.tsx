// src/components/front/CompactNovelCard.tsx
// 简化的小说卡片组件 - 用于横向滚动分类区
'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CompactNovelCardProps {
  id: number;
  title: string;
  coverImage?: string;
  rating?: number | null;
  slug?: string;
}

const CompactNovelCard = memo(function CompactNovelCard({
  id,
  title,
  coverImage,
  rating,
  slug
}: CompactNovelCardProps) {
  const cover = coverImage || `https://images.unsplash.com/photo-${1544947950 + id}?w=300&h=450&fit=crop`;
  const bookLink = slug ? `/novels/${slug}` : `/novels/book-${id}`;
  const showRating = rating && rating > 0;

  return (
    <Link
      href={bookLink}
      className="group block flex-shrink-0"
      style={{ width: '150px' }}
    >
      {/* 封面容器 */}
      <div className="relative w-full rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow"
           style={{ aspectRatio: '2/3' }}>
        {/* 评分徽章 - 简约大气设计 */}
        {showRating && (
          <div className="absolute top-2 left-2 z-10 bg-white/95 backdrop-blur-sm text-gray-900 px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 border border-gray-100"
               style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-gray-900">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* 封面图片 */}
        <Image
          src={cover}
          alt={title}
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
        {title}
      </h3>
    </Link>
  );
});

export default CompactNovelCard;
