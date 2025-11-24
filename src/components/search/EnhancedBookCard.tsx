// src/components/search/EnhancedBookCard.tsx
'use client'

import { memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Tag {
  id: string
  name: string
  slug: string
}

interface Category {
  id: number
  name: string
  slug: string
}

interface EnhancedBookCardProps {
  id: number
  title: string
  slug: string
  coverImage: string
  authorName: string
  blurb: string
  viewCount: number
  averageRating?: number | null
  totalRatings: number
  status: string
  category: Category
  tags: Tag[]
  chaptersCount: number
}

const EnhancedBookCard = memo(function EnhancedBookCard({
  id,
  title,
  slug,
  coverImage,
  authorName,
  blurb,
  viewCount,
  averageRating,
  totalRatings,
  status,
  category,
  tags,
  chaptersCount,
}: EnhancedBookCardProps) {
  // 格式化数字（K/M）
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // 截断简介
  const truncateBlurb = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  // 显示的标签（最多4个）
  const displayedTags = tags.slice(0, 4)
  const remainingTagsCount = Math.max(0, tags.length - 4)

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      {/* 横向长方形卡片：封面在左，内容在右 */}
      <div className="flex h-40 sm:h-48">
        {/* 封面图片 - 固定宽高比 2:3 */}
        <Link href={`/novels/${slug}`} className="flex-shrink-0 relative group">
          <div className="relative w-28 h-full sm:w-32">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:opacity-90 transition-opacity"
              sizes="(max-width: 640px) 112px, 128px"
            />
          </div>
        </Link>

        {/* 信息区域 */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col overflow-hidden">
          {/* 标题 */}
          <Link
            href={`/novels/${slug}`}
            className="font-semibold text-gray-900 text-sm sm:text-base hover:text-yellow-600 transition-colors mb-1 line-clamp-1 sm:line-clamp-2"
          >
            {title}
          </Link>

          {/* 作者 */}
          <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">
            by <span className="hover:underline cursor-pointer">{authorName}</span>
          </p>

          {/* 阅读量和评分 */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mb-2">
            <div className="flex items-center gap-1">
              <span>👁</span>
              <span>{formatNumber(viewCount)}</span>
            </div>

            {averageRating && totalRatings > 0 ? (
              <div className="flex items-center gap-1">
                <span>⭐</span>
                <span>
                  {averageRating.toFixed(1)} ({totalRatings})
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-1">
              <span>📖</span>
              <span>{chaptersCount} ch</span>
            </div>
          </div>

          {/* 简介 */}
          <p className="text-xs sm:text-sm text-gray-700 mb-2 line-clamp-2 flex-1">
            {truncateBlurb(blurb, 150)}
          </p>

          {/* 标签 */}
          {displayedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {displayedTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/search?tags=${tag.slug}`}
                  className="inline-block px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tag.name}
                </Link>
              ))}
              {remainingTagsCount > 0 && (
                <span className="inline-block px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-xs">
                  +{remainingTagsCount} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default EnhancedBookCard
