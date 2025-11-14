'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import UserBadge from '@/components/user/UserBadge'
import { getUserLevel, getPointsToNextLevel, formatReadingTime } from '@/lib/user-level'
import Link from 'next/link'

interface ProfileData {
  user: {
    id: string
    email: string
    name: string
    avatar: string | null
    bio: string | null
    isWriter: boolean
    writerName: string | null
    createdAt: string
  }
  stats: {
    contributionPoints: number
    totalReadingMinutes: number
    booksRead: number
    comments: number
    ratings: number
    likes: number
    libraryBooks: number
    replies: number
    receivedLikes: number
  }
  library: Array<{
    addedAt: string
    novel: {
      id: number
      title: string
      slug: string
      coverImage: string
      authorName: string
      averageRating: number | null
    }
  }>
  readingHistory: Array<{
    lastReadAt: string
    novel: {
      id: number
      title: string
      slug: string
      coverImage: string
    }
    chapter: {
      id: number
      title: string
      chapterNumber: number
    }
  }>
  ratings: Array<{
    id: string
    score: number
    review: string | null
    likeCount: number
    createdAt: string
    novel: {
      id: number
      title: string
      slug: string
      coverImage: string
    }
  }>
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'works' | 'library' | 'history' | 'ratings'>('library')

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/${userId}`)
      const data = await res.json()

      if (data.success) {
        setProfile(data.profile)
      } else {
        console.error('Failed to load profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">用户不存在</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:underline"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const levelInfo = getPointsToNextLevel(profile.stats.contributionPoints)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar with Badge */}
            <div className="flex flex-col items-center">
              <UserBadge
                user={{
                  name: profile.user.name,
                  avatar: profile.user.avatar,
                  contributionPoints: profile.stats.contributionPoints,
                }}
                size="xl"
                showLevel={true}
              />
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.user.name}
              </h1>

              {profile.user.isWriter && profile.user.writerName && (
                <p className="text-gray-600 mb-2">
                  ✍️ 作家笔名: {profile.user.writerName}
                </p>
              )}

              {profile.user.bio && (
                <p className="text-gray-600 mb-4">{profile.user.bio}</p>
              )}

              {/* Level Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold" style={{ color: levelInfo.current.borderColor }}>
                    {levelInfo.current.name}
                  </span>
                  {levelInfo.next && (
                    <span className="text-gray-500">
                      距离 {levelInfo.next.name} 还需 {levelInfo.pointsNeeded} 分
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${levelInfo.progress}%`,
                      backgroundColor: levelInfo.current.borderColor,
                    }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {profile.stats.contributionPoints}
                  </p>
                  <p className="text-sm text-gray-600">贡献度</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {profile.stats.booksRead}
                  </p>
                  <p className="text-sm text-gray-600">已读小说</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatReadingTime(profile.stats.totalReadingMinutes)}
                  </p>
                  <p className="text-sm text-gray-600">总阅读时长</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {profile.stats.ratings}
                  </p>
                  <p className="text-sm text-gray-600">发表评分</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>💬 评论 {profile.stats.comments}</span>
                <span>👍 点赞 {profile.stats.likes}</span>
                <span>💭 回复 {profile.stats.replies}</span>
                <span>📚 书架 {profile.stats.libraryBooks}</span>
                <span>❤️ 获赞 {profile.stats.receivedLikes}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { key: 'works' as const, label: '作品', count: 0 },
                { key: 'library' as const, label: '书架', count: profile.stats.libraryBooks },
                { key: 'history' as const, label: '浏览记录', count: profile.readingHistory.length },
                { key: 'ratings' as const, label: '点评记录', count: profile.stats.ratings },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Works Tab */}
            {activeTab === 'works' && (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无作品</p>
              </div>
            )}

            {/* Library Tab */}
            {activeTab === 'library' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {profile.library.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">书架为空</p>
                  </div>
                ) : (
                  profile.library.map((item) => (
                    <Link
                      key={item.novel.id}
                      href={`/novels/${item.novel.slug}`}
                      className="group"
                    >
                      <div className="aspect-[3/4] relative rounded-lg overflow-hidden mb-2 shadow-md group-hover:shadow-xl transition-shadow">
                        <img
                          src={item.novel.coverImage}
                          alt={item.novel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
                        {item.novel.title}
                      </h3>
                      <p className="text-xs text-gray-500">{item.novel.authorName}</p>
                      {item.novel.averageRating && (
                        <p className="text-xs text-yellow-600">
                          ⭐ {item.novel.averageRating.toFixed(1)}
                        </p>
                      )}
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {profile.readingHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">暂无浏览记录</p>
                  </div>
                ) : (
                  profile.readingHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Link href={`/novels/${item.novel.slug}`}>
                        <img
                          src={item.novel.coverImage}
                          alt={item.novel.title}
                          className="w-20 h-28 object-cover rounded shadow"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link
                          href={`/novels/${item.novel.slug}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {item.novel.title}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          读到: 第 {item.chapter.chapterNumber} 章 - {item.chapter.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(item.lastReadAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <Link
                        href={`/novels/${item.novel.slug}/chapter-${item.chapter.chapterNumber}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 self-center"
                      >
                        继续阅读
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Ratings Tab */}
            {activeTab === 'ratings' && (
              <div className="space-y-4">
                {profile.ratings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">暂无点评记录</p>
                  </div>
                ) : (
                  profile.ratings.map((rating) => (
                    <div
                      key={rating.id}
                      className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Link href={`/novels/${rating.novel.slug}`}>
                        <img
                          src={rating.novel.coverImage}
                          alt={rating.novel.title}
                          className="w-20 h-28 object-cover rounded shadow"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link
                          href={`/novels/${rating.novel.slug}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {rating.novel.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="text-yellow-500">
                            {'⭐'.repeat(rating.score / 2)}
                          </div>
                          <span className="text-sm font-semibold">{rating.score}/10</span>
                          {rating.likeCount > 0 && (
                            <span className="text-sm text-gray-500">
                              👍 {rating.likeCount}
                            </span>
                          )}
                        </div>
                        {rating.review && (
                          <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                            {rating.review}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(rating.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
