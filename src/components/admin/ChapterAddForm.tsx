// src/components/admin/ChapterAddForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  novelId: number
  chapterNumber: number
  novelTitle: string
}

export default function ChapterAddForm({ novelId, chapterNumber, novelTitle }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 计算字数
  const wordCount = content.trim().length

  // 提交表单
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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
      console.log('📤 Creating new chapter...')

      const response = await fetch(`/api/admin/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId,
          title,
          content,
          chapterNumber,
          isPublished,
          wordCount: content.trim().length
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chapter')
      }

      console.log('✅ Chapter created successfully!')

      // 跳转回小说编辑页
      router.push(`/admin/novels/${novelId}/edit`)
      router.refresh()

    } catch (error: any) {
      console.error('Submit error:', error)
      setMessage({ type: 'error', text: error.message })
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <p className="text-sm text-gray-500">Novel</p>
            <p className="text-lg font-semibold text-gray-900">{novelTitle}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Chapter Number</p>
            <p className="text-lg font-semibold text-gray-900">Chapter {chapterNumber}</p>
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
            required
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
            required
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
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {saving ? 'Creating...' : 'Create Chapter'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}