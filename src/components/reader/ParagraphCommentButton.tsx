'use client'

import { useState, useEffect } from 'react'

interface ParagraphCommentButtonProps {
  chapterId: number
  paragraphIndex: number
  onClick: () => void
  isActive: boolean
}

export default function ParagraphCommentButton({
  chapterId,
  paragraphIndex,
  onClick,
  isActive
}: ParagraphCommentButtonProps) {
  const [commentCount, setCommentCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommentCount()
  }, [chapterId, paragraphIndex])

  const fetchCommentCount = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/paragraph-comments?chapterId=${chapterId}&paragraphIndex=${paragraphIndex}`
      )
      const data = await res.json()
      if (data.success) {
        setCommentCount(data.data?.length || 0)
      }
    } catch (error) {
      console.error('Failed to fetch comment count:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <button className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs opacity-40 bg-gray-100">
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </button>
    )
  }

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
