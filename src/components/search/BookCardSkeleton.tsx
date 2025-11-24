// src/components/search/BookCardSkeleton.tsx
'use client'

/**
 * 书籍卡片骨架屏组件
 * 用于搜索结果加载时的占位动画
 */
export default function BookCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
      {/* 横向长方形卡片：封面在左，内容在右 */}
      <div className="flex h-48 sm:h-56 md:h-60">
        {/* 封面骨架 */}
        <div className="flex-shrink-0 w-32 h-full sm:w-40 md:w-44 bg-gray-200" />

        {/* 信息区域骨架 */}
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col">
          {/* 标题骨架 - 2行 */}
          <div className="h-5 sm:h-6 md:h-7 bg-gray-200 rounded w-full mb-2" />
          <div className="h-5 sm:h-6 md:h-7 bg-gray-200 rounded w-3/4 mb-3" />

          {/* 作者骨架 */}
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-32 mb-3" />

          {/* 阅读量和评分骨架 */}
          <div className="flex items-center gap-3 sm:gap-4 mb-3">
            <div className="h-4 sm:h-5 bg-gray-200 rounded w-16" />
            <div className="h-4 sm:h-5 bg-gray-200 rounded w-20" />
            <div className="h-4 sm:h-5 bg-gray-200 rounded w-16" />
          </div>

          {/* 简介骨架 - 2行 */}
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-5/6 mb-4" />

          {/* 标签骨架 */}
          <div className="flex gap-1.5 sm:gap-2 mt-auto">
            <div className="h-6 sm:h-7 bg-gray-200 rounded w-16" />
            <div className="h-6 sm:h-7 bg-gray-200 rounded w-20" />
            <div className="h-6 sm:h-7 bg-gray-200 rounded w-14" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 多个骨架屏组件
 */
export function BookCardSkeletonList({ count = 10 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </>
  )
}
