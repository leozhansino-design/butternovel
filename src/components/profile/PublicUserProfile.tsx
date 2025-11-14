'use client'

import { useState } from 'react'
import UserBadge from '@/components/badge/UserBadge'
import { formatReadingTime } from '@/lib/badge-system'
import RatingsTabComponent from './RatingsTab'

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
    booksInLibrary: number
    chaptersRead: number
    readingTime: number
    totalRatings: number
  }
}

interface PublicUserProfileProps {
  user: UserData
}

export default function PublicUserProfile({ user }: PublicUserProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>('ratings')

  const joinDate = new Date(user.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 顶部用户信息区 */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* 头像 + 勋章 */}
          <div className="relative">
            <UserBadge
              avatar={user.avatar}
              name={user.name}
              level={user.level}
              contributionPoints={user.contributionPoints}
              size="large"
              showLevelName={true}
            />
          </div>

          {/* 用户信息 */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user.name || 'Anonymous Reader'}
            </h1>

            {user.bio && <p className="text-gray-700 mb-6 leading-relaxed">{user.bio}</p>}

            <div className="text-sm text-gray-500 mb-6">
              加入于 {joinDate}
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{user.stats.booksInLibrary}</div>
                <div className="text-sm text-blue-800 mt-1">书架</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{user.stats.chaptersRead}</div>
                <div className="text-sm text-green-800 mt-1">章节已读</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{user.stats.totalRatings}</div>
                <div className="text-sm text-purple-800 mt-1">评分数</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                <div className="text-lg font-bold text-orange-600">
                  {formatReadingTime(user.stats.readingTime)}
                </div>
                <div className="text-sm text-orange-800 mt-1">阅读时长</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 导航 - 只显示点评记录 */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('ratings')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'ratings'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 hover:text-amber-500 hover:bg-gray-50'
              }`}
            >
              点评记录
            </button>
          </div>
        </div>

        {/* Tab 内容 */}
        <div className="p-6">
          <RatingsTabComponent userId={user.id} />
        </div>
      </div>
    </div>
  )
}
