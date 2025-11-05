// src/components/admin/ChapterEditForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Chapter = {
  id: number
  novelId: number
  title: string
  content: string
  chapterNumber: number
  wordCount: number
  isPublished: boolean
  novel: {
    id: number
    title: string
  }
}

type Props = {
  chapter: Chapter
  novelId: number
}

export default function ChapterEditForm({ chapter, novelId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(chapter.title)
  const [content, setContent] = useState(chapter.content)
  const [isPublished, setIsPublished] = useState(chapter.isPublished)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 计算字数
  const wordCount = content.trim().length

  // 检测改动
  useEffect(() => {
    const changed =
      title !== chapter.title ||
      content !== chapter.content ||
      isPublished !== chapter.isPublished

    setHasChanges(changed)
  }, [title, content, isPublished, chapter])

  // 保存修改
  async function handleSave() {
    if (!hasChanges) {
      setMessage({ type: 'error', text: 'No changes to save' })
      return
    }

    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Chapter title is required' })
      return
    }

    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Chapter content is required' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const updates: any = {}

      if (title !== chapter.title) updates.title = title
      if (content !== chapter.content) {
        updates.content = content
        updates.wordCount = content.trim().length
      }
      if (isPublished !== chapter.isPublished) updates.isPublished = isPublished

      console.log('📤 Sending updates:', Object.keys(updates))

      const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update chapter')
      }

      setMessage({ type: 'success', text: '✅ Chapter updated successfully!' })
      setHasChanges(false)

      // 刷新数据
      router.refresh()

    } catch (error: any) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  // 删除章节
  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${chapter.title}"?\n\nThis action cannot be undone!`)) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete chapter')
      }

      // 跳转回小说编辑页
      router.push(`/admin/novels/${novelId}/edit`)
      router.refresh()

    } catch (error: any) {
      console.error('Delete error:', error)
      setMessage({ type: 'error', text: error.message })
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
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

      {/* 章节信息 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Chapter Number</p>
            <p className="text-lg font-semibold text-gray-900">Chapter {chapter.chapterNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Word Count</p>
            <p className="text-lg font-semibold text-gray-900">{wordCount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 编辑表单 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chapter Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter chapter title"
          />
          <p className="text-sm text-gray-500 mt-1">
            {title.length}/100 characters
          </p>
        </div>

        {/* 内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chapter Content *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
            placeholder="Enter chapter content"
          />
          <p className="text-sm text-gray-500 mt-1">
            {wordCount.toLocaleString()} characters
          </p>
        </div>

        {/* 发布状态 */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
            Publish this chapter
          </label>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>

        <button
          onClick={handleDelete}
          disabled={saving}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
        >
          Delete Chapter
        </button>
      </div>
    </div>
  )
}