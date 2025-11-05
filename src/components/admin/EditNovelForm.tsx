// src/components/admin/EditNovelForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

type Category = {
  id: number
  name: string
}

type Chapter = {
  id: number
  title: string
  slug: string
  content: string
  chapterNumber: number
  wordCount: number
  isPublished: boolean
}

type Novel = {
  id: number
  title: string
  slug: string
  coverImage: string
  coverImagePublicId: string | null
  blurb: string
  status: string
  isPublished: boolean
  categoryId: number
  category: Category
  chapters: Chapter[]
}

type Props = {
  novel: Novel
  categories: Category[]
}

export default function EditNovelForm({ novel, categories }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 基本信息状态
  const [title, setTitle] = useState(novel.title)
  const [blurb, setBlurb] = useState(novel.blurb)
  const [categoryId, setCategoryId] = useState(novel.categoryId.toString())
  const [status, setStatus] = useState(novel.status)
  const [isPublished, setIsPublished] = useState(novel.isPublished)

  // 封面状态
  const [coverPreview, setCoverPreview] = useState(novel.coverImage)
  const [newCoverImage, setNewCoverImage] = useState<string | null>(null)

  // 追踪改动
  const [hasChanges, setHasChanges] = useState(false)

  // 处理封面上传
  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setCoverPreview(base64)
      setNewCoverImage(base64)
      setHasChanges(true)
    }
    reader.readAsDataURL(file)
  }

  // 检测表单改动
  function detectChanges() {
    const changed = 
      title !== novel.title ||
      blurb !== novel.blurb ||
      categoryId !== novel.categoryId.toString() ||
      status !== novel.status ||
      isPublished !== novel.isPublished ||
      newCoverImage !== null

    setHasChanges(changed)
  }

  // 保存修改（增量更新）
  async function handleSave() {
    if (!hasChanges) {
      setMessage({ type: 'error', text: 'No changes to save' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // 只发送改动的字段
      const updates: any = {}

      if (title !== novel.title) updates.title = title
      if (blurb !== novel.blurb) updates.blurb = blurb
      if (categoryId !== novel.categoryId.toString()) updates.categoryId = parseInt(categoryId)
      if (status !== novel.status) updates.status = status
      if (isPublished !== novel.isPublished) updates.isPublished = isPublished
      if (newCoverImage) updates.newCoverImage = newCoverImage

      console.log('📤 Sending updates:', Object.keys(updates))

      const response = await fetch(`/api/admin/novels/${novel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update novel')
      }

      setMessage({ type: 'success', text: '✅ Novel updated successfully!' })
      setHasChanges(false)
      setNewCoverImage(null)

      // 刷新页面数据
      router.refresh()

    } catch (error: any) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  // 删除小说
  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${novel.title}"?\n\nThis will also delete:\n- All chapters\n- Cover image from Cloudinary\n- All related data\n\nThis action cannot be undone!`)) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/novels/${novel.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete novel')
      }

      // 跳转回列表页
      router.push('/admin/novels')
      router.refresh()

    } catch (error: any) {
      console.error('Delete error:', error)
      setMessage({ type: 'error', text: error.message })
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

        <div className="space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                detectChanges()
              }}
              maxLength={120}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">{title.length}/120 characters</p>
          </div>

          {/* 简介 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={blurb}
              onChange={(e) => {
                setBlurb(e.target.value)
                detectChanges()
              }}
              maxLength={3000}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">{blurb.length}/3000 characters</p>
          </div>

          {/* 分类和状态 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  detectChanges()
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  detectChanges()
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* 发布状态 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => {
                setIsPublished(e.target.checked)
                detectChanges()
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
              Publish this novel (visible to readers)
            </label>
          </div>
        </div>
      </div>

      {/* 封面 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cover Image</h2>

        <div className="flex items-start gap-6">
          {/* 预览 */}
          <div>
            <div className="relative w-48 h-64 border-2 border-gray-300 rounded-lg overflow-hidden">
              <Image
                src={coverPreview}
                alt={title}
                sizes="(max-width: 768px) 100vw, 300px"
                fill
                className="object-cover"
              />
            </div>
            {newCoverImage && (
              <p className="text-sm text-green-600 mt-2">✅ New cover selected</p>
            )}
          </div>

          {/* 上传 */}
          <div className="flex-1">
            <label className="block">
              <span className="sr-only">Choose new cover</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Recommended: 300x400px, max 2MB
            </p>
            {newCoverImage && (
              <p className="text-sm text-orange-600 mt-2">
                ⚠️ Old cover will be deleted from Cloudinary
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 章节管理 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Chapters ({novel.chapters.length})
          </h2>
          <Link
            href={`/admin/novels/${novel.id}/chapters/new`}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            + Add Chapter
          </Link>
        </div>

        {novel.chapters.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No chapters yet</p>
        ) : (
          <div className="space-y-2">
            {novel.chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {chapter.wordCount} words · {chapter.isPublished ? '✅ Published' : '📝 Draft'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/novels/${novel.id}/chapters/${chapter.id}/edit`}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleDelete}
          disabled={saving}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Delete Novel
        </button>

        <div className="flex gap-4">
          <Link
            href="/admin/novels"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`px-6 py-3 rounded-lg transition-colors ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}