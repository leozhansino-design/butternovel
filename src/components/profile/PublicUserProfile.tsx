'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UserBadge from '@/components/badge/UserBadge'
import { formatReadingTime, getUserLevel } from '@/lib/badge-system'
import RatingsTabComponent from './RatingsTab'
import FollowListModal from './FollowListModal'
import PublicLibraryView from './PublicLibraryView'
import PublicReadingHistory from './PublicReadingHistory'
import PublicNovelsView from './PublicNovelsView'

type Tab = 'novels' | 'library' | 'history' | 'reviews'

type UserData = {
  id: string
  name: string | null
  avatar: string | null
  bio: string | null
  role: string
  contributionPoints: number
  level: number
  createdAt: Date
  libraryPrivacy?: boolean  // Privacy setting for library
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
  const [activeTab, setActiveTab] = useState<Tab>('novels')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(user.stats.followers)
  const [followingCount, setFollowingCount] = useState(user.stats.following)
  const [loading, setLoading] = useState(false)
  const [showFollowModal, setShowFollowModal] = useState<'following' | 'followers' | null>(null)
  const levelData = getUserLevel(user.contributionPoints)

  const isOwnProfile = session?.user?.id === user.id
  const isAdmin = user.role !== 'USER' // Check if user is admin/moderator

  // Check if library is private and user is not the owner
  const isLibraryPrivate = user.libraryPrivacy && !isOwnProfile

  // Check if current user is following this user
  useEffect(() => {
    if (session?.user?.id && session.user.id !== user.id) {
      fetch(`/api/user/follow-status?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.isFollowing !== undefined) {
            setIsFollowing(data.isFollowing)
          }
        })
        .catch(err => console.error('Failed to fetch follow status:', err))
    }
  }, [session?.user?.id, user.id])

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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top user info section */}
      <div className="flex-shrink-0 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-8 mb-6 mx-6 mt-6">
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

              {/* Follow button - only show if not own profile, user is logged in, and target is not admin */}
              {!isOwnProfile && !isAdmin && session?.user?.id && (
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

            {/* Stats cards - Only show for regular users */}
            {!isAdmin && (
              <>
                {/* Regular user stats - 4 cards in a row with frosted glass effect */}
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
                <div className="mt-4">
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-4 text-center shadow-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {formatReadingTime(user.stats.readingTime)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Reading Time</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-6">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('novels')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                activeTab === 'novels'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                  : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
              }`}
            >
              Novels
            </button>
            {/* Only show other tabs for regular users (not admin) */}
            {!isAdmin && (
              <>
                {/* Only show Library tab if not private or if viewing own profile */}
                {!isLibraryPrivate && (
                  <button
                    onClick={() => setActiveTab('library')}
                    className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                      activeTab === 'library'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                        : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                    }`}
                  >
                    Library
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                  }`}
                >
                  Reading History
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                    activeTab === 'reviews'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                  }`}
                >
                  Reviews
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden px-6 pt-4 pb-6">
        <div className="h-full bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          {activeTab === 'novels' && (
            <PublicNovelsView userId={user.id} />
          )}
          {activeTab === 'library' && (
            <PublicLibraryView userId={user.id} />
          )}
          {activeTab === 'history' && (
            <PublicReadingHistory userId={user.id} />
          )}
          {activeTab === 'reviews' && (
            <div className="h-full overflow-y-auto p-6">
              <RatingsTabComponent userId={user.id} />
            </div>
          )}
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
