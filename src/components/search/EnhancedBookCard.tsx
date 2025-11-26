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

  // 智能显示标签：移动端显示更少
  const calculateDisplayTags = (isMobile: boolean) => {
    if (tags.length === 0) return []
    if (isMobile) {
      // 移动端只显示2个标签
      return tags.slice(0, 2)
    }

    // 计算前3个标签的总字符长度
    const firstThree = tags.slice(0, 3)
    const totalLength = firstThree.reduce((sum, tag) => sum + tag.name.length, 0)

    // 如果3个标签总长度超过30个字符，只显示2个避免溢出
    // 否则显示3个
    return totalLength > 30 ? tags.slice(0, 2) : tags.slice(0, 3)
  }

  const displayedTagsMobile = calculateDisplayTags(true)
  const displayedTagsDesktop = calculateDisplayTags(false)
  const remainingTagsCountMobile = tagsCount - displayedTagsMobile.length
  const remainingTagsCountDesktop = tagsCount - displayedTagsDesktop.length

  // 状态显示文本
  const statusText = status === 'COMPLETED' ? 'Completed' : 'Ongoing'
  const statusColor = status === 'COMPLETED' ? 'text-green-600' : 'text-blue-600'

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      {/* 移动端竖屏：紧凑水平布局 */}
      <div className="flex h-32 sm:h-48 md:h-56 lg:h-64">
        {/* 左侧：封面图片 - 移动端更小 */}
        <Link href={`/novels/${slug}`} className="flex-shrink-0 relative group w-20 sm:w-32 md:w-40 lg:w-44">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:opacity-90 transition-opacity"
            sizes="(max-width: 640px) 80px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 176px"
          />
        </Link>

        {/* 右侧：所有文字信息 */}
        <div className="flex-1 p-2.5 sm:p-4 md:p-5 lg:p-6 flex flex-col justify-between min-w-0">
          {/* 上部分：标题、作者、统计信息 */}
          <div className="flex-1 min-h-0 flex flex-col">
            {/* 标题 - 移动端更紧凑 */}
            <Link
              href={`/novels/${slug}`}
              className="font-bold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl hover:text-blue-600 transition-colors mb-0.5 sm:mb-1 line-clamp-2 leading-tight"
            >
              {title}
            </Link>

            {/* 作者 */}
            <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1 truncate">
              by <span className="font-medium">{authorName}</span>
            </p>

            {/* 统计信息 - 移动端单行紧凑 */}
            <div className="flex items-center flex-wrap gap-x-2 sm:gap-x-3 gap-y-0.5 text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
              <span>{formatNumber(viewCount)}</span>
              {averageRating && totalRatings > 0 && (
                <span>★{averageRating.toFixed(1)}</span>
              )}
              <span>{chaptersCount}ch</span>
              <span className={`font-semibold ${statusColor}`}>{statusText}</span>
            </div>

            {/* 简介 - 移动端1行，平板以上2-3行 */}
            <p className="text-[11px] sm:text-sm md:text-base text-gray-600 sm:text-gray-700 leading-snug sm:leading-relaxed line-clamp-1 sm:line-clamp-2 md:line-clamp-3">
              {blurb}
            </p>
          </div>

          {/* 底部：标签 - 移动端更紧凑 */}
          {tags.length > 0 && (
            <>
              {/* 移动端标签 */}
              <div className="flex sm:hidden gap-1 items-center flex-wrap pt-1 min-w-0">
                {displayedTagsMobile.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/search?tags=${tag.slug}`}
                    className="inline-block px-1.5 py-0.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded text-[10px] font-medium transition-colors whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: '80px' }}
                  >
                    {tag.name}
                  </Link>
                ))}
                {remainingTagsCountMobile > 0 && (
                  <span className="inline-block px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-medium whitespace-nowrap shrink-0">
                    +{remainingTagsCountMobile}
                  </span>
                )}
              </div>

              {/* 平板以上标签 */}
              <div className="hidden sm:flex gap-1.5 md:gap-2 items-center flex-wrap pt-2 min-w-0">
                {displayedTagsDesktop.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/search?tags=${tag.slug}`}
                    className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    title={tag.name}
                    style={{ maxWidth: '150px' }}
                  >
                    {tag.name}
                  </Link>
                ))}
                {remainingTagsCountDesktop > 0 && (
                  <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 bg-gray-50 text-gray-500 rounded-full text-xs md:text-sm font-medium whitespace-nowrap shrink-0">
                    +{remainingTagsCountDesktop} more
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

export default EnhancedBookCard
