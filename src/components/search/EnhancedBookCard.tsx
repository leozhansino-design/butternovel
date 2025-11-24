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

  // 显示的标签（最多3个）
  const displayedTags = tags.slice(0, 3)

  // 状态显示文本
  const statusText = status === 'COMPLETED' ? 'Completed' : 'Ongoing'
  const statusColor = status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      {/* 横向长方形卡片：封面+统计在左，内容在右 */}
      <div className="flex h-64 sm:h-72 md:h-80">
        {/* 左侧：封面和统计信息 */}
        <div className="flex-shrink-0 w-36 sm:w-44 md:w-48 flex flex-col">
          {/* 封面图片 */}
          <Link href={`/novels/${slug}`} className="relative group flex-1">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:opacity-90 transition-opacity"
              sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, 192px"
            />
          </Link>

          {/* 统计信息区域 */}
          <div className="p-2 sm:p-3 bg-gray-50 border-t border-gray-200 space-y-1.5">
            {/* 阅读量 */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
              <span>👁</span>
              <span>{formatNumber(viewCount)}</span>
            </div>

            {/* 评分 */}
            {averageRating && totalRatings > 0 ? (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                <span>⭐</span>
                <span>{averageRating.toFixed(1)} ({totalRatings})</span>
              </div>
            ) : null}

            {/* 章节数 */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
              <span>📖</span>
              <span>{chaptersCount} ch</span>
            </div>

            {/* 状态标识 */}
            <div className={`text-xs font-medium px-2 py-1 rounded text-center ${statusColor}`}>
              {statusText}
            </div>
          </div>
        </div>

        {/* 右侧：文字内容区域 */}
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col overflow-hidden">
          {/* 标题 */}
          <Link
            href={`/novels/${slug}`}
            className="font-bold text-gray-900 text-lg sm:text-xl md:text-2xl hover:text-yellow-600 transition-colors mb-2 line-clamp-2"
          >
            {title}
          </Link>

          {/* 作者 */}
          <p className="text-sm sm:text-base text-gray-600 mb-3 truncate">
            by <span className="hover:underline cursor-pointer font-medium">{authorName}</span>
          </p>

          {/* 简介 - 固定3行避免部分露出 */}
          <p className="text-sm sm:text-base text-gray-700 mb-4 line-clamp-3 leading-relaxed">
            {blurb}
          </p>

          {/* 标签 - 最多3个，放在底部 */}
          {displayedTags.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-2">
              {displayedTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/search?tags=${tag.slug}`}
                  className="inline-block px-3 py-1.5 bg-gray-100 hover:bg-yellow-100 text-gray-700 hover:text-gray-900 rounded-full text-xs sm:text-sm font-medium transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default EnhancedBookCard
