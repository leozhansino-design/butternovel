// src/components/admin/EditNovelForm.tsx - 优化版
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

  // ⭐ 保存为草稿 (不发布)
  async function handleSaveDraft() {
    return handleSave(false)
  }

  // ⭐ 保存并发布
  async function handlePublish() {
    return handleSave(true)
  }

  // 统一保存函数
  async function handleSave(publish: boolean) {
    if (!hasChanges && isPublished === publish) {
      setMessage({ type: 'error', text: 'No changes to save' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // 构建更新数据
      const updates: any = {}

      if (title !== novel.title) updates.title = title
      if (blurb !== novel.blurb) updates.blurb = blurb
      if (categoryId !== novel.categoryId.toString()) updates.categoryId = parseInt(categoryId)
      if (status !== novel.status) updates.status = status
      if (newCoverImage) updates.newCoverImage = newCoverImage
      
      // ⭐ 根据按钮设置发布状态
      updates.isPublished = publish

      console.log('📤 Sending updates:', Object.keys(updates), '| Publish:', publish)

      const response = await fetch(`/api/admin/novels/${novel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ 确保 cookie 总是被发送
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update novel')
      }

      setMessage({ 
        type: 'success', 
        text: publish ? '✅ Novel published successfully!' : '✅ Draft saved successfully!' 
      })
      setHasChanges(false)
      setNewCoverImage(null)
      setIsPublished(publish) // 更新本地状态

      // 刷新页面数据
      router.refresh()

    } catch (error: any) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  // 切换章节发布状态
  async function toggleChapterPublish(chapterId: number, currentStatus: boolean) {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ 确保 cookie 总是被发送
        body: JSON.stringify({ isPublished: !currentStatus })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update chapter')
      }

      setMessage({ 
        type: 'success', 
        text: !currentStatus ? '✅ Chapter published!' : '📝 Chapter unpublished' 
      })
      
      router.refresh()

    } catch (error: any) {
      console.error('Toggle error:', error)
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
        method: 'DELETE',
        credentials: 'include' // ✅ 确保 cookie 总是被发送
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete novel')
      }

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
      {/* ⭐ 发布状态横幅 */}
      <div className={`p-4 rounded-lg border-2 ${
        isPublished 
          ? 'bg-green-50 border-green-300' 
          : 'bg-yellow-50 border-yellow-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPublished ? (
              <>
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="font-bold text-green-900">✅ Published</p>
                  <p className="text-sm text-green-700">This novel is live and visible to readers</p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="font-bold text-yellow-900">📝 Draft</p>
                  <p className="text-sm text-yellow-700">This novel is not published yet</p>
                </div>
              </>
            )}
          </div>
          {hasChanges && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
      </div>

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
        </div>
      </div>

      {/* 封面 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cover Image</h2>
        
        <div className="flex gap-6">
          <div className="flex-shrink-0">
            {coverPreview && (
              <div className="relative w-48 h-64 rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={coverPreview}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-sm text-gray-500 mt-2">
              Recommended: 300x400px, max 2MB
            </p>
          </div>
        </div>
      </div>

      {/* 章节列表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Chapters ({novel.chapters.length})
          </h2>
          <Link
            href={`/admin/novels/${novel.id}/chapters/new`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Add Chapter
          </Link>
        </div>

        {novel.chapters.length > 0 ? (
          <div className="space-y-2">
            {novel.chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900">
                      Chapter {chapter.chapterNumber}: {chapter.title}
                    </p>
                    {/* ⭐ 章节发布状态标识 */}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      chapter.isPublished 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {chapter.isPublished ? '✅ Published' : '📝 Draft'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {chapter.wordCount.toLocaleString()} characters
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Link
                    href={`/admin/novels/${novel.id}/chapters/${chapter.id}/edit`}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Edit
                  </Link>
                  {/* ⭐ 快速发布/取消发布按钮 */}
                  <button
                    onClick={() => toggleChapterPublish(chapter.id, chapter.isPublished)}
                    disabled={saving}
                    className={`px-3 py-1.5 text-sm rounded font-medium ${
                      chapter.isPublished
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    {chapter.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No chapters yet. Add your first chapter to get started.
          </div>
        )}
      </div>

      {/* ⭐ 操作按钮 - 双按钮设计 */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleDelete}
          disabled={saving}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Delete Novel
        </button>

        <div className="flex gap-3">
          <Link
            href="/admin/novels"
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </Link>
          
          {/* ⭐ Save Draft 按钮 */}
          <button
            onClick={handleSaveDraft}
            disabled={saving || (!hasChanges && !isPublished)}
            className={`px-6 py-3 rounded-lg transition-colors font-medium ${
              hasChanges || isPublished
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {/* ⭐ Publish 按钮 */}
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? 'Publishing...' : isPublished ? 'Update & Publish' : 'Publish Now'}
          </button>
        </div>
      </div>
    </div>
  )
}