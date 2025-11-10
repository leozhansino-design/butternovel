'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Trash2, ArrowLeft, Book, AlertCircle, CheckCircle } from 'lucide-react'

type Chapter = {
  id: number
  novelId: number
  title: string
  content: string
  chapterNumber: number
  wordCount: number
  isPublished: boolean
  novel: { id: number; title: string }
}

type Props = {
  chapter: Chapter
  novelId: number
}

const MAX_WORDS = 5000

export default function ChapterEditForm({ chapter, novelId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(chapter.title)
  const [content, setContent] = useState(chapter.content)
  const [isPublished, setIsPublished] = useState(chapter.isPublished)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ⭐ 计算字数 (words, 不是 characters)
  const wordCount = content.trim().split(/\s+/).filter(w => w).length

  // ⭐ 检查是否超过限制
  const isOverLimit = wordCount > MAX_WORDS

  // ⭐ 计算进度百分比
  const progressPercent = Math.min((wordCount / MAX_WORDS) * 100, 100)

  useEffect(() => {
    const changed = title !== chapter.title || content !== chapter.content || isPublished !== chapter.isPublished
    setHasChanges(changed)
  }, [title, content, isPublished, chapter])

  async function handleSave() {
    if (!hasChanges) {
      setMessage({ type: 'error', text: 'No changes to save' })
      return
    }
    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required' })
      return
    }

    if (isOverLimit) {
      setMessage({ 
        type: 'error', 
        text: `Chapter exceeds maximum word limit of ${MAX_WORDS} words. Current: ${wordCount} words.` 
      })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const updates: any = {}
      if (title !== chapter.title) updates.title = title
      if (content !== chapter.content) {
        updates.content = content
        // ⭐ 修复：使用单词数而不是字符数
        updates.wordCount = content.trim().split(/\s+/).filter(w => w).length
      }
      if (isPublished !== chapter.isPublished) updates.isPublished = isPublished

      const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update chapter')

      setMessage({ type: 'success', text: '✅ Chapter updated successfully!' })
      setHasChanges(false)
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${chapter.title}"?\n\nThis action cannot be undone!`)) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/chapters/${chapter.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete')

      router.push(`/admin/novels/${novelId}/edit`)
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Chapter</h1>
          <div className="w-20"></div>
        </div>

        {/* 章节信息卡片 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 rounded-lg p-2">
                    <Book className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Chapter {chapter.chapterNumber}</p>
                    <p className="text-white text-lg font-bold">{chapter.novel.title}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm mb-1">Word Count</p>
                <p className={`text-2xl font-bold ${isOverLimit ? 'text-red-300' : 'text-white'}`}>
                  {wordCount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 字数进度条 */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Word Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverLimit ? 'bg-red-500' : progressPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {isOverLimit && (
              <div className="flex items-center gap-2 mt-3 text-red-600">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">
                  Exceeds limit by {(wordCount - MAX_WORDS).toLocaleString()} words
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <div
            className={`rounded-lg border px-4 py-3 mb-6 flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            )}
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* 编辑表单 */}
        <div className="space-y-6">
          {/* 标题输入 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Chapter Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Enter chapter title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">{title.length} / 100 characters</p>
              {title === chapter.title ? (
                <span className="text-xs text-gray-400">Original</span>
              ) : (
                <span className="text-xs text-blue-600 font-medium">Modified</span>
              )}
            </div>
          </div>

          {/* 内容编辑 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              placeholder="Write your chapter content here..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 font-mono text-sm transition-all ${
                isOverLimit
                  ? 'border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
              }`}
            />
            {isOverLimit && (
              <div className="flex items-center gap-2 mt-3 text-red-600">
                <AlertCircle size={18} />
                <span className="text-sm font-medium">
                  Please reduce content by {(wordCount - MAX_WORDS).toLocaleString()} words
                </span>
              </div>
            )}
          </div>

          {/* 发布状态 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-900">
                Publish this chapter (make it visible to readers)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2 ml-8">
              {isPublished ? '✅ Published' : '📝 Draft'} - {isPublished !== chapter.isPublished ? 'Change pending' : 'Unchanged'}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Trash2 size={18} />
              {deleting ? 'Deleting...' : 'Delete Chapter'}
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving || isOverLimit}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Save size={18} />
                {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}