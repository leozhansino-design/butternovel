'use client'

interface ParagraphCommentButtonProps {
  paragraphIndex: number
  onClick: () => void
  isActive: boolean
  commentCount?: number  // ✅ 接受预加载的评论数，而不是自己请求
}

export default function ParagraphCommentButton({
  paragraphIndex,
  onClick,
  isActive,
  commentCount = 0  // ✅ 默认值为0
}: ParagraphCommentButtonProps) {
  // ✅ FIX: 移除独立请求逻辑 - 改为接受预加载的 commentCount prop
  // 之前：每个按钮独立请求 → 40个按钮 = 40次请求 = 连接池爆炸
  // 现在：从父组件接收批量获取的数据 → 0次请求

  // 根据评论数量决定样式
  const getButtonStyle = () => {
    if (commentCount === 0) {
      // 无评论：半透明，诱导点击
      return 'opacity-40 hover:opacity-70 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200'
    } else if (commentCount < 50) {
      // 1-49条评论：普通样式
      return 'opacity-80 hover:opacity-100 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'
    } else if (commentCount < 100) {
      // 50-99条评论：红色数字
      return 'opacity-90 hover:opacity-100 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 font-semibold'
    } else {
      // 99+条评论：红色+火焰特效
      return 'opacity-100 text-red-600 hover:text-red-700 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 font-bold animate-pulse'
    }
  }

  const displayCount = commentCount >= 100 ? '99+' : commentCount

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all duration-200 ${getButtonStyle()} ${
        isActive ? 'ring-2 ring-amber-500 shadow-md' : ''
      }`}
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
      </svg>
      <span>{displayCount}</span>
      {commentCount >= 100 && (
        <span className="text-xs">🔥</span>
      )}
    </button>
  )
}
