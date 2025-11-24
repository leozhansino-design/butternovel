// src/components/search/BookCardSkeleton.tsx
'use client'

/**
 * 书籍卡片骨架屏组件
 * 用于搜索结果加载时的占位动画
 */
export default function BookCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
      {/* 横向卡片：封面在左，所有信息在右 */}
      <div className="flex h-64 sm:h-72 md:h-80">
        {/* 左侧：封面骨架（占满整个高度） */}
        <div className="flex-shrink-0 w-44 sm:w-52 md:w-56 bg-gray-200" />

        {/* 右侧：所有文字信息骨架 */}
        <div className="flex-1 p-5 sm:p-6 md:p-8 flex flex-col">
          {/* 标题骨架 - 2行 */}
          <div className="h-7 sm:h-8 bg-gray-200 rounded w-full mb-2" />
          <div className="h-7 sm:h-8 bg-gray-200 rounded w-3/4 mb-3" />

          {/* 作者骨架 */}
          <div className="h-5 bg-gray-200 rounded w-32 mb-4" />

          {/* 统计信息骨架 - 横向一行 */}
          <div className="flex gap-4 mb-4">
            <div className="h-5 bg-gray-200 rounded w-20" />
            <div className="h-5 bg-gray-200 rounded w-16" />
            <div className="h-5 bg-gray-200 rounded w-24" />
            <div className="h-5 bg-gray-200 rounded w-20" />
          </div>

          {/* 简介骨架 - 3行 */}
          <div className="h-5 bg-gray-200 rounded w-full mb-2" />
          <div className="h-5 bg-gray-200 rounded w-full mb-2" />
          <div className="h-5 bg-gray-200 rounded w-5/6 mb-6 flex-1" />

          {/* 标签骨架 - 智能显示2-3个 + more */}
          <div className="flex gap-2 items-center overflow-hidden">
            <div className="h-7 bg-gray-200 rounded-full w-20" />
            <div className="h-7 bg-gray-200 rounded-full w-24" />
            <div className="h-7 bg-gray-200 rounded-full w-20" />
            <div className="h-7 bg-gray-200 rounded-full w-16" />
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
