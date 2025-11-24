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
        {/* 评分徽章 */}
        {showRating && (
          <div className="absolute top-2 left-2 z-10 bg-black/75 text-white px-2 py-1 rounded flex items-center gap-1"
               style={{ fontSize: '12px', fontWeight: 600 }}>
            <span style={{ color: '#FFD700', fontSize: '10px' }}>⭐</span>
            <span>{rating.toFixed(1)}</span>
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
        className="mt-2 font-medium text-gray-900 group-hover:text-amber-600 transition-colors"
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
