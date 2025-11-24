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
  tagsCount: number // 添加tags总数
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
  tagsCount,
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
  // 使用实际的tags总数而不是返回的tags数组长度
  const remainingTagsCount = tagsCount - displayedTags.length

  // 状态显示文本
  const statusText = status === 'COMPLETED' ? 'Completed' : 'Ongoing'
  const statusColor = status === 'COMPLETED' ? 'text-green-600' : 'text-blue-600'

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      {/* 横向卡片：封面在左，所有信息在右 */}
      <div className="flex h-64 sm:h-72 md:h-80">
        {/* 左侧：封面图片（占满整个高度） */}
        <Link href={`/novels/${slug}`} className="flex-shrink-0 relative group w-44 sm:w-52 md:w-56">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:opacity-90 transition-opacity"
            sizes="(max-width: 640px) 176px, (max-width: 768px) 208px, 224px"
          />
        </Link>

        {/* 右侧：所有文字信息 */}
        <div className="flex-1 p-5 sm:p-6 md:p-8 flex flex-col justify-between min-w-0">
          {/* 上部分：标题、作者、统计信息、简介 */}
          <div className="flex-1 min-h-0 flex flex-col">
            {/* 标题 - 最多2行，缩小字体给下方更多空间 */}
            <Link
              href={`/novels/${slug}`}
              className="font-bold text-gray-900 text-lg sm:text-xl hover:text-blue-600 transition-colors mb-1.5 line-clamp-2 leading-tight"
            >
              {title}
            </Link>

            {/* 作者 */}
            <p className="text-sm sm:text-base text-gray-600 mb-1.5">
              by <span className="font-medium">{authorName}</span>
            </p>

            {/* 统计信息 - 横向一行，简洁显示 */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
              <span>{formatNumber(viewCount)} views</span>
              {averageRating && totalRatings > 0 && (
                <span>★ {averageRating.toFixed(1)}</span>
              )}
              <span>{chaptersCount} chapters</span>
              <span className={`font-semibold ${statusColor}`}>{statusText}</span>
            </div>

            {/* 简介 - 根据是否有tags动态调整行数：有tags显示3行，无tags显示4-5行 */}
            <p className={`text-sm sm:text-base text-gray-700 leading-relaxed ${displayedTags.length > 0 ? 'line-clamp-3' : 'line-clamp-5'}`}>
              {blurb}
            </p>
          </div>

          {/* 底部：标签 - 智能显示2-3个，单行显示，显示剩余数量 */}
          {displayedTags.length > 0 && (
            <div className="flex gap-2 items-center flex-wrap pt-2.5 min-w-0">
              {displayedTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/search?tags=${tag.slug}`}
                  className="inline-block px-3 py-1 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  title={tag.name}
                  style={{ maxWidth: '200px' }}
                >
                  {tag.name}
                </Link>
              ))}
              {remainingTagsCount > 0 && (
                <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shrink-0">
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
