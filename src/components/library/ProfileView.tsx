// src/components/library/ProfileView.tsx
'use client'

import { useState, useEffect, useRef } from 'react'

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
  booksRead?: number
}

export default function ProfileView({ user, onNavigate }: ProfileViewProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ✅ Fetch profile and stats in parallel
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        // Fetch profile and stats in parallel
        const [profileRes, statsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/profile/stats')
        ])

        const profileData = await profileRes.json()
        const statsData = await statsRes.json()

        if (profileRes.ok) {
          setProfileData({
            ...profileData.user,
            booksRead: statsData.booksRead || 0
          })
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

      // 验证图片尺寸必须是 256x256
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
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setProfileData(prev => prev ? {
          ...prev,
          avatar: data.avatar
        } : null)
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

  return (
    <div>
      {/* 毛玻璃 Profile 卡片 */}
      <div className="relative backdrop-blur-2xl bg-white/70 rounded-2xl shadow-xl border border-white/30 p-6">
        {/* 渐变背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-2xl pointer-events-none" />

        <div className="relative flex items-start gap-6">
          {/* Avatar with upload */}
          <div className="relative group flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profileData.name || 'User'}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/50 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center text-gray-900 font-bold text-3xl ring-4 ring-white/50 shadow-lg border border-gray-300">
                {profileData.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}

            {/* Upload overlay */}
            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="absolute inset-0 bg-black/70 rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-semibold disabled:cursor-not-allowed"
            >
              {uploadingAvatar ? 'Uploading...' : 'Change'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
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
                <p className="text-gray-600 text-sm mb-3 truncate">{profileData.email}</p>

                {/* Books Read stat */}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {profileData.booksRead || 0} {(profileData.booksRead || 0) === 1 ? 'book' : 'books'} read
                  </span>
                </div>

                {profileData.bio ? (
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{profileData.bio}</p>
                ) : (
                  <p className="text-gray-400 italic text-sm">No bio yet. Click the edit button to add one!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
