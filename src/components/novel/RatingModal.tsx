'use client'
// src/components/novel/RatingModal.tsx
// 评分 Modal 组件

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { signIn } from 'next-auth/react'
import AuthModal from '@/components/auth/AuthModal'

interface Reply {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    avatar: string | null
  }
  childReplies?: Reply[]
}

interface Rating {
  id: string
  score: number
  review: string | null
  createdAt: string
  likeCount: number
  userHasLiked: boolean
  user: {
    id: string
    name: string | null
    avatar: string | null
  }
  replies?: Reply[]
  replyCount?: number
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
  const pathname = usePathname()
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
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Reply state
  const [activeReplyTo, setActiveReplyTo] = useState<string | null>(null) // ratingId or replyId
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [showRepliesFor, setShowRepliesFor] = useState<Set<string>>(new Set())

  // ✅ 获取用户评分状态 - 将逻辑移到 useEffect 内部，避免依赖问题
  useEffect(() => {
    if (isOpen && userId) {
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

      fetchUserRating()
    }
  }, [isOpen, userId, novelId])

  // ✅ 获取评分列表 - 提取为可重用函数
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

  // ✅ 初始加载评分列表
  useEffect(() => {
    if (isOpen) {
      fetchRatings(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, novelId])

  const handleStarClick = async (score: number) => {
    if (hasRated) return

    if (!userId) {
      // 未登录，打开登录modal而不是直接跳转
      setShowAuthModal(true)
      return
    }

    // 只设置评分，显示评论输入框，不自动提交
    setUserRating(score)
    setShowReviewInput(true)
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
    if (!userRating) return
    await submitRating(userRating, review.trim())
    setReview('')
    setShowReviewInput(false)
  }

  // 处理点赞
  const handleLike = async (ratingId: string, currentLiked: boolean) => {
    try {
      const res = await fetch(`/api/ratings/${ratingId}/like`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        // 更新ratings列表中的点赞状态
        setRatings(prevRatings =>
          prevRatings.map(r =>
            r.id === ratingId
              ? { ...r, likeCount: data.likeCount, userHasLiked: data.liked }
              : r
          )
        )
      }
    } catch (error) {
      console.error('Error liking rating:', error)
    }
  }

  // Fetch replies for a rating
  const fetchReplies = async (ratingId: string) => {
    try {
      const res = await fetch(`/api/ratings/${ratingId}/replies`)
      if (res.ok) {
        const data = await res.json()
        // Update rating with fetched replies
        setRatings(prevRatings =>
          prevRatings.map(r =>
            r.id === ratingId
              ? { ...r, replies: data.replies, replyCount: data.count }
              : r
          )
        )
      }
    } catch (error) {
      console.error('Error fetching replies:', error)
    }
  }

  // Toggle replies display
  const toggleReplies = async (ratingId: string) => {
    const newShowReplies = new Set(showRepliesFor)

    if (newShowReplies.has(ratingId)) {
      newShowReplies.delete(ratingId)
    } else {
      newShowReplies.add(ratingId)
      // Fetch replies if not already fetched
      const rating = ratings.find(r => r.id === ratingId)
      if (!rating?.replies) {
        await fetchReplies(ratingId)
      }
    }

    setShowRepliesFor(newShowReplies)
  }

  // Submit reply
  const handleSubmitReply = async (ratingId: string, parentReplyId?: string) => {
    if (!userId) {
      setShowAuthModal(true)
      return
    }

    if (!replyContent.trim()) return

    setSubmittingReply(true)
    try {
      const res = await fetch(`/api/ratings/${ratingId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentReplyId: parentReplyId || null,
        }),
      })

      if (res.ok) {
        // Refresh replies
        await fetchReplies(ratingId)
        setReplyContent('')
        setActiveReplyTo(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to post reply')
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
      alert('Failed to post reply')
    } finally {
      setSubmittingReply(false)
    }
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
      <div className="flex items-center gap-2">
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
                className="w-8 h-8"
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

  // Render a single reply
  const renderReply = (reply: Reply, ratingId: string, depth: number = 0) => {
    const isReplyingTo = activeReplyTo === reply.id
    const maxDepth = 2 // Limit nesting depth

    return (
      <div key={reply.id} className={`${depth > 0 ? 'ml-8 mt-2' : 'mt-2'}`}>
        <div className="flex items-start gap-2">
          {reply.user.avatar ? (
            <img
              src={reply.user.avatar}
              alt={reply.user.name || 'User'}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-gray-900 font-semibold text-xs border border-gray-300">
              {reply.user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <span className="font-semibold text-gray-900 text-xs">
                {reply.user.name || 'Anonymous'}
              </span>
              <p className="text-gray-700 text-sm mt-1">{reply.content}</p>
            </div>
            <div className="flex items-center gap-3 mt-1 ml-1">
              <span className="text-xs text-gray-400">
                {formatRelativeTime(reply.createdAt)}
              </span>
              {depth < maxDepth && (
                <button
                  onClick={() => setActiveReplyTo(isReplyingTo ? null : reply.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {isReplyingTo ? 'Cancel' : 'Reply'}
                </button>
              )}
            </div>

            {/* Reply input for this reply */}
            {isReplyingTo && (
              <div className="mt-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  maxLength={500}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{replyContent.length}/500</span>
                  <button
                    onClick={() => handleSubmitReply(ratingId, reply.id)}
                    disabled={submittingReply || !replyContent.trim()}
                    className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReply ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </div>
            )}

            {/* Nested replies */}
            {reply.childReplies && reply.childReplies.length > 0 && (
              <div className="mt-1">
                {reply.childReplies.map(childReply =>
                  renderReply(childReply, ratingId, depth + 1)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-[750px] max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-gray-900">
                {averageRating > 0 ? averageRating.toFixed(1) : '-'}
              </span>
              <div>
                {averageRating > 0 && renderStars(averageRating, 'large')}
                <p className="text-base text-gray-500 mt-2">
                  {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-700">Your rating:</span>
            <div className="flex gap-1">
              {renderInteractiveStars()}
            </div>
          </div>
        </div>

        {/* Review Input */}
        {showReviewInput && !hasRated && (
          <div className="p-6 border-b border-gray-200 animate-slideDown">
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts... (optional)"
              maxLength={1000}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">{review.length}/1000</span>
              <div className="flex gap-2">
                <button
                  onClick={handleReviewSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-br from-[#f4d03f] via-[#e8b923] to-[#d4a017] text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : review.trim() ? 'Submit Review' : 'Submit Rating'}
                </button>
              </div>
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
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-900 font-semibold text-sm border border-gray-300">
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
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(rating.createdAt)}
                        </span>
                        <button
                          onClick={() => handleLike(rating.id, rating.userHasLiked)}
                          className="flex items-center gap-1 text-xs transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 transition-all ${
                              rating.userHasLiked
                                ? 'fill-indigo-600 text-indigo-600'
                                : 'fill-none text-gray-400 hover:text-indigo-600'
                            }`}
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                            />
                          </svg>
                          <span className={rating.userHasLiked ? 'text-indigo-600 font-medium' : 'text-gray-500'}>
                            {rating.likeCount > 0 ? rating.likeCount : ''}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            if (activeReplyTo === rating.id) {
                              setActiveReplyTo(null)
                              setReplyContent('')
                            } else {
                              setActiveReplyTo(rating.id)
                              setReplyContent('')
                            }
                          }}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Reply
                        </button>
                        {(rating.replyCount ?? 0) > 0 && (
                          <button
                            onClick={() => toggleReplies(rating.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            {showRepliesFor.has(rating.id) ? 'Hide' : 'View'} {rating.replyCount} {rating.replyCount === 1 ? 'reply' : 'replies'}
                          </button>
                        )}
                      </div>

                      {/* Reply input for this rating */}
                      {activeReplyTo === rating.id && (
                        <div className="mt-3">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            maxLength={500}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">{replyContent.length}/500</span>
                            <button
                              onClick={() => handleSubmitReply(rating.id)}
                              disabled={submittingReply || !replyContent.trim()}
                              className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submittingReply ? 'Posting...' : 'Post Reply'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Display replies */}
                      {showRepliesFor.has(rating.id) && rating.replies && rating.replies.length > 0 && (
                        <div className="mt-3 pl-2 border-l-2 border-gray-200">
                          {rating.replies.map(reply => renderReply(reply, rating.id))}
                        </div>
                      )}
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

      {/* 登录Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="login"
      />
    </>
  )
}
