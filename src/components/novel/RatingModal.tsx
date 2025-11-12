'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import StarRating from './StarRating'

interface Rating {
  id: string
  score: number
  review: string | null
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

interface RatingModalProps {
  novelId: number
  isOpen: boolean
  onClose: () => void
  initialScrollToReviews?: boolean
}

export default function RatingModal({
  novelId,
  isOpen,
  onClose,
  initialScrollToReviews = false
}: RatingModalProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [averageRating, setAverageRating] = useState<number>(0)
  const [totalRatings, setTotalRatings] = useState<number>(0)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [userReview, setUserReview] = useState<string>('')
  const [hasRated, setHasRated] = useState(false)

  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [showReviewInput, setShowReviewInput] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [ratings, setRatings] = useState<Rating[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingRatings, setIsLoadingRatings] = useState(false)

  // 获取用户评分状态
  const fetchUserRating = useCallback(async () => {
    try {
      const res = await fetch(`/api/novels/${novelId}/user-rating`)
      const data = await res.json()

      if (data.success && data.data.hasRated) {
        setHasRated(true)
        setUserRating(data.data.rating.score)
        setUserReview(data.data.rating.review || '')
      }
    } catch (error) {
      console.error('Failed to fetch user rating:', error)
    }
  }, [novelId])

  // 获取评分列表
  const fetchRatings = useCallback(async (page: number = 1) => {
    setIsLoadingRatings(true)
    try {
      const res = await fetch(`/api/novels/${novelId}/ratings?page=${page}&limit=10`)
      const data = await res.json()

      if (data.success) {
        setAverageRating(data.data.novelStats.averageRating || 0)
        setTotalRatings(data.data.novelStats.totalRatings || 0)

        if (page === 1) {
          setRatings(data.data.ratings)
        } else {
          setRatings(prev => [...prev, ...data.data.ratings])
        }

        setHasMore(data.data.pagination.hasMore)
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error)
    } finally {
      setIsLoadingRatings(false)
    }
  }, [novelId])

  // 初始化数据
  useEffect(() => {
    if (isOpen) {
      fetchUserRating()
      fetchRatings(1)
      setCurrentPage(1)
    }
  }, [isOpen, fetchUserRating, fetchRatings])

  // 处理星星点击
  const handleStarClick = async (score: number) => {
    if (hasRated) return

    if (!session) {
      // 未登录，跳转到登录页
      router.push('/auth/login?callbackUrl=' + window.location.pathname)
      return
    }

    setSelectedRating(score)

    // 立即提交评分（不需要评论）
    await submitRating(score, '')

    // 显示评论输入框
    setShowReviewInput(true)
  }

  // 提交评分
  const submitRating = async (score: number, review: string) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/novels/${novelId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, review })
      })

      const data = await res.json()

      if (data.success) {
        setHasRated(true)
        setUserRating(score)
        setAverageRating(data.data.novelStats.averageRating)
        setTotalRatings(data.data.novelStats.totalRatings)

        // 重新加载评分列表
        fetchRatings(1)
        setCurrentPage(1)

        return true
      } else {
        alert(data.error?.message || 'Failed to submit rating')
        return false
      }
    } catch (error) {
      console.error('Failed to submit rating:', error)
      alert('Failed to submit rating')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // 提交评论
  const handleSubmitReview = async () => {
    if (!selectedRating) return

    const success = await submitRating(selectedRating, reviewText)
    if (success) {
      setShowReviewInput(false)
      setReviewText('')
    }
  }

  // 加载更多评论
  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    fetchRatings(nextPage)
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-[600px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 内容区（可滚动） */}
        <div className="overflow-y-auto p-6">
          {/* 顶部评分区域 */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            {/* 左侧：平均分 */}
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalRatings > 0 ? (averageRating / 2).toFixed(1) : 'N/A'}
              </span>
              <span className="text-gray-500 dark:text-gray-400">•</span>
              <span className="text-gray-500 dark:text-gray-400">
                {totalRatings.toLocaleString()} rating{totalRatings !== 1 ? 's' : ''}
              </span>
            </div>

            {/* 右侧：用户评分 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Your rating:</span>
              <StarRating
                rating={userRating || 0}
                interactive={!hasRated}
                onRate={handleStarClick}
                size="medium"
              />
            </div>
          </div>

          {/* 评论输入区（点击星星后显示） */}
          {showReviewInput && !hasRated && (
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 animate-fadeIn">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts..."
                maxLength={1000}
                className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">
                  {reviewText.length}/1000
                </span>
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}

          {/* 评论列表 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Reviews</h3>

            {ratings.length === 0 && !isLoadingRatings ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No reviews yet. Be the first!
              </p>
            ) : (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="flex gap-3">
                    {/* 头像 */}
                    <div className="flex-shrink-0">
                      {rating.user.avatar ? (
                        <img
                          src={rating.user.avatar}
                          alt={rating.user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {rating.user.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {rating.user.name}
                        </span>
                        <StarRating rating={rating.score} size="small" />
                      </div>
                      {rating.review && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                          {rating.review}
                        </p>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(rating.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* 加载更多按钮 */}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingRatings}
                    className="w-full py-2 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium disabled:opacity-50"
                  >
                    {isLoadingRatings ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
