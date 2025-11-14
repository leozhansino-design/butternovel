'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import UserBadge from '@/components/badge/UserBadge'
import { formatReadingTime } from '@/lib/badge-system'
import RatingsTabComponent from './RatingsTab'

type Tab = 'works' | 'library' | 'history' | 'ratings'

type ProfileData = {
  id: string
  name: string | null
  email: string | null
  avatar: string | null
  bio: string | null
  contributionPoints: number
  level: number
  stats: {
    booksInLibrary: number
    chaptersRead: number
    readingTime: number
    totalRatings: number
  }
}

export default function UserProfile() {
  const { update } = useSession()

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('library')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/profile')
        const data = await res.json()

        if (res.ok) {
          setProfileData(data.user)
          setEditName(data.user.name || '')
          setEditBio(data.user.bio || '')
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (editName.trim().length === 0) {
      setError('Name cannot be empty')
      return
    }

    if (editBio.length > 500) {
      setError('Bio must be 500 characters or less')
      return
    }

    try {
      setSaving(true)
      setError('')

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                name: data.user.name,
                bio: data.user.bio,
              }
            : null
        )
        setIsEditing(false)

        await update({
          name: data.user.name,
        })
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditName(profileData?.name || '')
    setEditBio(profileData?.bio || '')
    setError('')
    setIsEditing(false)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)')
      return
    }

    if (file.size > 512 * 1024) {
      setError('Image must be smaller than 512KB')
      return
    }

    try {
      setUploadingAvatar(true)
      setError('')

      const validImage = await validateImageSize(file, 256, 256)

      if (!validImage) {
        setError('Image must be exactly 256x256 pixels')
        setUploadingAvatar(false)
        return
      }

      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                avatar: data.avatar,
              }
            : null
        )

        await update({
          image: data.avatar,
        })
      } else {
        setError(data.error || 'Failed to upload avatar')
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      setError('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      if (e.target) e.target.value = ''
    }
  }

  const validateImageSize = (
    file: File,
    requiredWidth: number,
    requiredHeight: number
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()

      img.onload = () => {
        URL.revokeObjectURL(img.src)
        const isValid = img.width === requiredWidth && img.height === requiredHeight
        resolve(isValid)
      }

      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        resolve(false)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 顶部用户信息区 */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* 头像 + 勋章 */}
          <div className="relative">
            <div onClick={handleAvatarClick} className="cursor-pointer">
              <UserBadge
                avatar={profileData.avatar}
                name={profileData.name}
                level={profileData.level}
                contributionPoints={profileData.contributionPoints}
                size="large"
                showLevelName={true}
              />
            </div>

            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* 用户信息 */}
          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    placeholder="Tell us about yourself..."
                  />
                  <span className="text-xs text-gray-400 mt-1">{editBio.length}/500</span>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-md"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-5 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profileData.name || 'Anonymous Reader'}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-400 hover:text-amber-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit profile"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 mb-4">{profileData.email}</p>

                {profileData.bio && <p className="text-gray-700 mb-6 leading-relaxed">{profileData.bio}</p>}

                {/* 统计信息 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{profileData.stats.booksInLibrary}</div>
                    <div className="text-sm text-blue-800 mt-1">书架</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{profileData.stats.chaptersRead}</div>
                    <div className="text-sm text-green-800 mt-1">章节已读</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{profileData.stats.totalRatings}</div>
                    <div className="text-sm text-purple-800 mt-1">评分数</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {formatReadingTime(profileData.stats.readingTime)}
                    </div>
                    <div className="text-sm text-orange-800 mt-1">阅读时长</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('works')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'works'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 hover:text-amber-500 hover:bg-gray-50'
              }`}
            >
              作品
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'library'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 hover:text-amber-500 hover:bg-gray-50'
              }`}
            >
              书架
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-600 hover:text-amber-500 hover:bg-gray-50'
              }`}
            >
              浏览记录
            </button>
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
          {activeTab === 'works' && <WorksTab />}
          {activeTab === 'library' && <LibraryTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'ratings' && <RatingsTab />}
        </div>
      </div>
    </div>
  )
}

// Tab组件占位符
function WorksTab() {
  return (
    <div className="text-center py-12 text-gray-500">
      <p>作品列表功能开发中...</p>
    </div>
  )
}

function LibraryTab() {
  return (
    <div className="text-center py-12 text-gray-500">
      <p>书架功能开发中...</p>
    </div>
  )
}

function HistoryTab() {
  return (
    <div className="text-center py-12 text-gray-500">
      <p>浏览记录功能开发中...</p>
    </div>
  )
}

function RatingsTab() {
  return <RatingsTabComponent />
}
