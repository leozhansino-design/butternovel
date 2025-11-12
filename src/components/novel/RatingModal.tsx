'use client'
// src/components/novel/RatingModal.tsx
// 评分 Modal 组件

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Rating {
  id: string
  score: number
  review: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    avatar: string | null
  }
}

interface RatingModalProps {
  novelId: number
  averageRating: number
  totalRatings: number
  isOpen: boolean
  onClose: () => void
  userId?: string
}

export default function RatingModal({
  novelId,
  averageRating,
  totalRatings,
  isOpen,
  onClose,
  userId,
}: RatingModalProps) {
  const router = useRouter()
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hasRated, setHasRated] = useState(false)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [review, setReview] = useState('')
  const [showReviewInput, setShowReviewInput] = useState(false)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 获取用户评分状态
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserRating()
    }
  }, [isOpen, userId, novelId])

  // 获取评分列表
  useEffect(() => {
    if (isOpen) {
      fetchRatings(1)
    }
  }, [isOpen, novelId])

  const fetchUserRating = async () => {
    try {
      const res = await fetch(`/api/novels/${novelId}/user-rating`)
      const data = await res.json()
      if (data.hasRated) {
        setHasRated(true)
        setUserRating(data.rating.score)
      }
    } catch (error) {
      console.error('Error fetching user rating:', error)
    }
  }

  const fetchRatings = async (pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/novels/${novelId}/ratings?page=${pageNum}&limit=10`)
      const data = await res.json()

      if (pageNum === 1) {
        setRatings(data.ratings)
      } else {
        setRatings(prev => [...prev, ...data.ratings])
      }

      setHasMore(data.pagination.page < data.pagination.totalPages)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching ratings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStarClick = async (score: number) => {
    if (hasRated) return

    if (!userId) {
      // 未登录，跳转到登录页
      router.push(`/auth/login?redirect=/novels/${novelId}`)
      return
    }

    setUserRating(score)
    setShowReviewInput(true)

    // 立即提交评分（无评论）
    await submitRating(score, '')
  }

  const submitRating = async (score: number, reviewText: string) => {
    if (submitting) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/novels/${novelId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, review: reviewText || null }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to submit rating')
        return
      }

      const data = await res.json()
      setHasRated(true)

      // 刷新评分列表
      fetchRatings(1)

      // 刷新页面以更新统计
      router.refresh()
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviewSubmit = async () => {
    if (!userRating || !review.trim()) return
    await submitRating(userRating, review)
    setReview('')
    setShowReviewInput(false)
  }

  const renderStars = (score: number, size: 'large' | 'small' = 'large') => {
    const starCount = score / 2 // Convert 2-10 to 1-5 stars
    const fullStars = Math.floor(starCount)
    const hasHalfStar = starCount % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    const sizeClass = size === 'large' ? 'w-6 h-6' : 'w-4 h-4'
    const color = '#FFB800'

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className={sizeClass} fill={color} viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg className={sizeClass} fill="none" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor={color} />
                <stop offset="50%" stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
            <path
              fill="url(#half)"
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className={sizeClass} fill="#E5E7EB" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    )
  }

  const renderInteractiveStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const score = star * 2
          const isFilled = hoverRating ? score <= hoverRating : userRating ? score <= userRating : false
          const isClickable = !hasRated

          return (
            <button
              key={star}
              type="button"
              disabled={hasRated}
              className={`transition-all ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
              onMouseEnter={() => isClickable && setHoverRating(score)}
              onMouseLeave={() => isClickable && setHoverRating(null)}
              onClick={() => handleStarClick(score)}
            >
              <svg
                className="w-6 h-6"
                fill={isFilled ? '#FFB800' : '#E5E7EB'}
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          )
        })}
      </div>
    )
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {averageRating > 0 ? averageRating.toFixed(1) : '-'}
              </span>
              <div>
                {averageRating > 0 && renderStars(averageRating, 'small')}
                <p className="text-sm text-gray-500 mt-1">
                  {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Your rating:</span>
            {renderInteractiveStars()}
          </div>
        </div>

        {/* Review Input */}
        {showReviewInput && !hasRated && (
          <div className="p-6 border-b border-gray-200 animate-slideDown">
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts..."
              maxLength={1000}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">{review.length}/1000</span>
              <button
                onClick={handleReviewSubmit}
                disabled={submitting || !review.trim()}
                className="px-6 py-2 bg-gradient-to-br from-[#f4d03f] via-[#e8b923] to-[#d4a017] text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Reviews</h3>

          {ratings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    {rating.user.avatar ? (
                      <img
                        src={rating.user.avatar}
                        alt={rating.user.name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-semibold text-sm">
                        {rating.user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {rating.user.name || 'Anonymous'}
                        </span>
                        {renderStars(rating.score, 'small')}
                      </div>
                      {rating.review && (
                        <p className="text-gray-700 text-sm leading-relaxed mb-2">{rating.review}</p>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(rating.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <button
              onClick={() => fetchRatings(page + 1)}
              disabled={loading}
              className="w-full mt-6 py-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
