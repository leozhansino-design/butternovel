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

  // 智能显示标签：根据标签长度决定显示2个或3个
  const calculateDisplayTags = () => {
    if (tags.length === 0) return []

    // 计算前3个标签的总字符长度
    const firstThree = tags.slice(0, 3)
    const totalLength = firstThree.reduce((sum, tag) => sum + tag.name.length, 0)

    // 如果3个标签总长度超过30个字符，只显示2个避免溢出
    // 否则显示3个
    return totalLength > 30 ? tags.slice(0, 2) : tags.slice(0, 3)
  }

  const displayedTags = calculateDisplayTags()

  // 状态显示文本
  const statusText = status === 'COMPLETED' ? 'Completed' : 'Ongoing'
  const statusColor = status === 'COMPLETED' ? 'text-green-600' : 'text-blue-600'

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      {/* 横向卡片：封面在左，所有信息在右 */}
      <div className="flex h-56 sm:h-64">
        {/* 左侧：封面图片（占满整个高度） */}
        <Link href={`/novels/${slug}`} className="flex-shrink-0 relative group w-40 sm:w-48">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:opacity-90 transition-opacity"
            sizes="(max-width: 640px) 160px, 192px"
          />
        </Link>

        {/* 右侧：所有文字信息 */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col">
          {/* 标题 */}
          <Link
            href={`/novels/${slug}`}
            className="font-bold text-gray-900 text-xl sm:text-2xl hover:text-blue-600 transition-colors mb-2 line-clamp-2"
          >
            {title}
          </Link>

          {/* 作者 */}
          <p className="text-sm sm:text-base text-gray-600 mb-3">
            by <span className="font-medium">{authorName}</span>
          </p>

          {/* 统计信息 - 横向一行，简洁显示 */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
            <span>{formatNumber(viewCount)} views</span>
            {averageRating && totalRatings > 0 && (
              <span>★ {averageRating.toFixed(1)}</span>
            )}
            <span>{chaptersCount} chapters</span>
            <span className={`font-semibold ${statusColor}`}>{statusText}</span>
          </div>

          {/* 简介 - 固定2行 */}
          <p className="text-sm sm:text-base text-gray-700 mb-4 line-clamp-2 leading-relaxed flex-1">
            {blurb}
          </p>

          {/* 标签 - 智能显示2-3个，单行显示 */}
          {displayedTags.length > 0 && (
            <div className="flex gap-2 overflow-hidden">
              {displayedTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/search?tags=${tag.slug}`}
                  className="inline-block px-3 py-1 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis"
                  onClick={(e) => e.stopPropagation()}
                  title={tag.name}
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
