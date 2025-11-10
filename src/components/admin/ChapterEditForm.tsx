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
  novel: { id: number; title: string }
}

type Props = {
  chapter: Chapter
  novelId: number
}

const MAX_WORDS = 5000 // ⭐ 新增: 最大字数限制

export default function ChapterEditForm({ chapter, novelId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(chapter.title)
  const [content, setContent] = useState(chapter.content)
  const [isPublished, setIsPublished] = useState(chapter.isPublished)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ⭐ 计算字数 (words, 不是 characters)
  const wordCount = content.trim().split(/\s+/).filter(w => w).length

  // ⭐ 检查是否超过限制
  const isOverLimit = wordCount > MAX_WORDS

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

    // ⭐ 新增: 检查字数限制
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

      setMessage({ type: 'success', text: '✅ Chapter updated!' })
      setHasChanges(false)
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${chapter.title}"?\n\nThis cannot be undone!`)) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/chapters/${chapter.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete')

      router.push(`/admin/novels/${novelId}/edit`)
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' 
          ? 'bg-green-50 border border-green-200 text-green-800' 
          : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-gray-50 border rounded-lg p-4 flex justify-between">
        <div>
          <p className="text-sm text-gray-500">Chapter</p>
          <p className="text-lg font-semibold">Chapter {chapter.chapterNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Words</p>
          {/* ⭐ 显示字数和限制,超过限制时变红 */}
          <p className={`text-lg font-semibold ${isOverLimit ? 'text-red-600' : 'text-gray-900'}`}>
            {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            maxLength={100}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" 
          />
          <p className="text-sm text-gray-500 mt-1">{title.length}/100</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Content *
            {/* ⭐ 显示字数限制提示 */}
            <span className={`ml-2 text-xs ${isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
              ({wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words)
            </span>
          </label>
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            rows={20}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 font-mono text-sm ${
              isOverLimit ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
            }`}
          />
          {/* ⭐ 超过限制时显示警告 */}
          {isOverLimit && (
            <p className="text-sm text-red-600 mt-2 font-medium">
              ⚠️ Warning: Chapter exceeds maximum word limit by {(wordCount - MAX_WORDS).toLocaleString()} words
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            id="pub" 
            checked={isPublished} 
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-5 h-5 rounded" 
          />
          <label htmlFor="pub" className="text-sm font-medium">Published</label>
        </div>
      </div>

      <div className="flex justify-between">
        <div className="flex gap-3">
          <button 
            onClick={handleSave} 
            disabled={!hasChanges || saving || isOverLimit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
          <button 
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Back
          </button>
        </div>
        
        <button
          onClick={handleDelete}
          disabled={saving}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
        >
          {saving ? 'Deleting...' : 'Delete Chapter'}
        </button>
      </div>
    </div>
  )
}