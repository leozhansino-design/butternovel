'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UserBadge from '@/components/badge/UserBadge'
import { formatReadingTime, getUserLevel } from '@/lib/badge-system'
import RatingsTabComponent from './RatingsTab'
import FollowListModal from './FollowListModal'

type Tab = 'ratings'

type UserData = {
  id: string
  name: string | null
  avatar: string | null
  bio: string | null
  contributionPoints: number
  level: number
  createdAt: Date
  stats: {
    booksRead: number
    following: number
    followers: number
    totalRatings: number
    readingTime: number
  }
}

interface PublicUserProfileProps {
  user: UserData
}

export default function PublicUserProfile({ user }: PublicUserProfileProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('ratings')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(user.stats.followers)
  const [followingCount, setFollowingCount] = useState(user.stats.following)
  const [loading, setLoading] = useState(false)
  const [showFollowModal, setShowFollowModal] = useState<'following' | 'followers' | null>(null)
  const levelData = getUserLevel(user.contributionPoints)

  const isOwnProfile = session?.user?.id === user.id

  // Check if current user is following this user
  useEffect(() => {
    if (session?.user?.id && !isOwnProfile) {
      fetch(`/api/user/follow-status?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.isFollowing !== undefined) {
            setIsFollowing(data.isFollowing)
          }
        })
        .catch(err => console.error('Failed to fetch follow status:', err))
    }
  }, [session, user.id, isOwnProfile])

  const handleFollowToggle = async () => {
    if (!session?.user?.id) {
      // Redirect to login or show message
      alert('Please log in to follow users')
      return
    }

    try {
      setLoading(true)
      const method = isFollowing ? 'DELETE' : 'POST'
      const res = await fetch('/api/user/follow', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (res.ok) {
        setIsFollowing(!isFollowing)
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update follow status')
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
      alert('Failed to update follow status')
    } finally {
      setLoading(false)
    }
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Top user info section */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar + Badge */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <UserBadge
              avatar={user.avatar}
              name={user.name}
              level={user.level}
              contributionPoints={user.contributionPoints}
              size="large"
              showLevelName={false}
            />
            {/* Level name below avatar */}
            <div className="text-center">
              <p className="text-xs font-semibold text-amber-600">{levelData.nameEn}</p>
            </div>
          </div>

          {/* User info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.name || 'Anonymous Reader'}
              </h1>

              {/* Follow button - only show if not own profile and user is logged in */}
              {!isOwnProfile && session?.user?.id && (
                <button
                  onClick={handleFollowToggle}
                  disabled={loading}
                  className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-md disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                  }`}
                >
                  {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{user.bio}</p>
            )}

            <p className="text-gray-500 text-sm mb-4">Joined {joinDate}</p>

            {/* Stats cards - 4 cards in a row with frosted glass effect */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {/* Books Read */}
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg">
                <div className="text-2xl font-bold text-gray-900">{user.stats.booksRead}</div>
                <div className="text-xs text-gray-600 mt-1">Books Read</div>
              </div>

              {/* Following - clickable */}
              <button
                onClick={() => setShowFollowModal('following')}
                className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                <div className="text-2xl font-bold text-gray-900">{followingCount}</div>
                <div className="text-xs text-gray-600 mt-1">Following</div>
              </button>

              {/* Followers - clickable */}
              <button
                onClick={() => setShowFollowModal('followers')}
                className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                <div className="text-2xl font-bold text-gray-900">{followersCount}</div>
                <div className="text-xs text-gray-600 mt-1">Followers</div>
              </button>

              {/* Reviews */}
              <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg">
                <div className="text-2xl font-bold text-gray-900">{user.stats.totalRatings}</div>
                <div className="text-xs text-gray-600 mt-1">Reviews</div>
              </div>
            </div>

            {/* Reading Time - separate row */}
            <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg">
              <div className="text-lg font-bold text-gray-900">
                {formatReadingTime(user.stats.readingTime)}
              </div>
              <div className="text-xs text-gray-600 mt-1">Reading Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
        </div>
        <div className="p-6">
          <RatingsTabComponent userId={user.id} />
        </div>
      </div>

      {/* Follow List Modal */}
      {showFollowModal && (
        <FollowListModal
          isOpen={!!showFollowModal}
          onClose={() => setShowFollowModal(null)}
          userId={user.id}
          type={showFollowModal}
          onUserClick={(userId) => router.push(`/profile/${userId}`)}
        />
      )}
    </div>
  )
}
