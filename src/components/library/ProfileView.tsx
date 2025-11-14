// src/components/library/ProfileView.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UserBadge from '@/components/badge/UserBadge'
import { formatReadingTime, getUserLevel } from '@/lib/badge-system'
import FollowListModal from '@/components/profile/FollowListModal'

type ProfileViewProps = {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onNavigate?: (tab: 'library' | 'history' | 'upload' | 'manage') => void
}

type ProfileData = {
  id: string
  name: string | null
  email: string | null
  avatar: string | null
  bio: string | null
  contributionPoints: number
  level: number
  stats: {
    booksRead: number
    following: number
    followers: number
    totalRatings: number
    readingTime: number
  }
}

export default function ProfileView({ user, onNavigate }: ProfileViewProps) {
  const router = useRouter()
  // ✅ Get session update function
  const { update } = useSession()

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showFollowModal, setShowFollowModal] = useState<'following' | 'followers' | null>(null)

  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ✅ Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const profileRes = await fetch('/api/profile')
        const profileData = await profileRes.json()

        if (profileRes.ok) {
          setProfileData(profileData.user)
          setEditName(profileData.user.name || '')
          setEditBio(profileData.user.bio || '')
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
          bio: editBio.trim()
        })
      })

      const data = await res.json()

      if (res.ok) {
        setProfileData(prev => prev ? {
          ...prev,
          name: data.user.name,
          bio: data.user.bio
        } : null)
        setIsEditing(false)

        // ✅ Update next-auth session to sync with Header/UserMenu
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

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)')
      return
    }

    // 验证文件大小 (最大 512KB)
    if (file.size > 512 * 1024) {
      setError('Image must be smaller than 512KB')
      return
    }

    try {
      setUploadingAvatar(true)
      setError('')

      // 验证图片尺寸必须是 512x512
      const validImage = await validateImageSize(file, 512, 512)

      if (!validImage) {
        setError('Image must be exactly 512x512 pixels')
        setUploadingAvatar(false)
        return
      }

      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setProfileData(prev => prev ? {
          ...prev,
          avatar: data.avatar
        } : null)

        // ✅ Update next-auth session to sync avatar with Header/UserMenu
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
      // 清空 input，允许重新选择同一文件
      if (e.target) e.target.value = ''
    }
  }

  // 验证图片尺寸（必须是精确尺寸）
  const validateImageSize = (file: File, requiredWidth: number, requiredHeight: number): Promise<boolean> => {
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Failed to load profile</p>
      </div>
    )
  }

  const avatarUrl = profileData.avatar || user.image
  const levelData = getUserLevel(profileData.contributionPoints)

  return (
    <div>
      {/* 毛玻璃 Profile 卡片 */}
      <div className="relative backdrop-blur-2xl bg-white/70 rounded-2xl shadow-xl border border-white/30 p-6">
        {/* 渐变背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-2xl pointer-events-none" />

        <div className="relative flex items-start gap-6">
          {/* Avatar with Badge and upload */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="relative group">
              <div onClick={handleAvatarClick} className="cursor-pointer">
                <UserBadge
                  avatar={avatarUrl}
                  name={profileData.name}
                  level={profileData.level}
                  contributionPoints={profileData.contributionPoints}
                  size="large"
                  showLevelName={false}
                />
              </div>

              {/* Upload overlay */}
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute inset-0 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-semibold disabled:cursor-not-allowed"
              >
                {uploadingAvatar ? 'Uploading...' : 'Change'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Level name below avatar */}
            <div className="text-center">
              <p className="text-xs font-semibold text-amber-600">{levelData.nameEn}</p>
            </div>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/80"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-white/80"
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
                    className="px-5 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-white/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {profileData.name || 'Anonymous Reader'}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-400 hover:text-amber-500 hover:bg-white/60 rounded-lg transition-colors flex-shrink-0"
                    title="Edit profile"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 text-sm mb-4 truncate">{profileData.email}</p>

                {/* Bio */}
                {profileData.bio ? (
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-2">{profileData.bio}</p>
                ) : (
                  <p className="text-gray-400 italic text-sm mb-4">No bio yet. Click the edit button to add one!</p>
                )}

                {/* Stats cards - 4 cards in a row with frosted glass effect */}
                <div className="grid grid-cols-4 gap-3">
                  {/* Books Read */}
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-3 text-center shadow-lg">
                    <div className="text-lg font-bold text-gray-900">{profileData.stats.booksRead}</div>
                    <div className="text-xs text-gray-600 mt-0.5">Books Read</div>
                  </div>

                  {/* Following - clickable */}
                  <button
                    onClick={() => setShowFollowModal('following')}
                    className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-3 text-center shadow-lg hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <div className="text-lg font-bold text-gray-900">{profileData.stats.following}</div>
                    <div className="text-xs text-gray-600 mt-0.5">Following</div>
                  </button>

                  {/* Followers - clickable */}
                  <button
                    onClick={() => setShowFollowModal('followers')}
                    className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-3 text-center shadow-lg hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <div className="text-lg font-bold text-gray-900">{profileData.stats.followers}</div>
                    <div className="text-xs text-gray-600 mt-0.5">Followers</div>
                  </button>

                  {/* Reviews */}
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-3 text-center shadow-lg">
                    <div className="text-lg font-bold text-gray-900">{profileData.stats.totalRatings}</div>
                    <div className="text-xs text-gray-600 mt-0.5">Reviews</div>
                  </div>
                </div>

                {/* Reading Time - separate row */}
                <div className="mt-3">
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-lg p-3 text-center shadow-lg">
                    <div className="text-sm font-bold text-gray-900">{formatReadingTime(profileData.stats.readingTime)}</div>
                    <div className="text-xs text-gray-600 mt-0.5">Reading Time</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow List Modal */}
      {showFollowModal && profileData && (
        <FollowListModal
          isOpen={!!showFollowModal}
          onClose={() => setShowFollowModal(null)}
          userId={profileData.id}
          type={showFollowModal}
          onUserClick={(userId) => {
            setShowFollowModal(null)
            router.push(`/profile/${userId}`)
          }}
        />
      )}
    </div>
  )
}
