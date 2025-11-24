// src/components/search/BookCardSkeleton.tsx
'use client'

/**
 * 书籍卡片骨架屏组件
 * 用于搜索结果加载时的占位动画
 */
export default function BookCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
      {/* 横向长方形卡片：封面+统计在左，内容在右 */}
      <div className="flex h-64 sm:h-72 md:h-80">
        {/* 左侧：封面和统计信息骨架 */}
        <div className="flex-shrink-0 w-36 sm:w-44 md:w-48 flex flex-col">
          {/* 封面骨架 */}
          <div className="flex-1 bg-gray-200" />

          {/* 统计信息区域骨架 */}
          <div className="p-2 sm:p-3 bg-gray-50 border-t border-gray-200 space-y-1.5">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-14" />
            <div className="h-6 bg-gray-200 rounded w-full" />
          </div>
        </div>

        {/* 右侧：文字内容区域骨架 */}
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col">
          {/* 标题骨架 - 2行 */}
          <div className="h-6 sm:h-7 md:h-8 bg-gray-200 rounded w-full mb-2" />
          <div className="h-6 sm:h-7 md:h-8 bg-gray-200 rounded w-3/4 mb-3" />

          {/* 作者骨架 */}
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-32 mb-4" />

          {/* 简介骨架 - 3行 */}
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-4/5 mb-6" />

          {/* 标签骨架 */}
          <div className="flex gap-2 mt-auto">
            <div className="h-7 sm:h-8 bg-gray-200 rounded-full w-20" />
            <div className="h-7 sm:h-8 bg-gray-200 rounded-full w-24" />
            <div className="h-7 sm:h-8 bg-gray-200 rounded-full w-16" />
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
