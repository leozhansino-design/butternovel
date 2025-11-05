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

  const wordCount = content.trim().length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
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
      if (!response.ok) throw new Error(data.error || 'Failed to create chapter')

      router.push(`/admin/novels/${novelId}/edit`)
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-gray-50 border rounded-lg p-4 flex justify-between">
        <div>
          <p className="text-sm text-gray-500">Novel</p>
          <p className="text-lg font-semibold">{novelTitle}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Chapter Number</p>
          <p className="text-lg font-semibold">Chapter {chapterNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Word Count</p>
          <p className="text-lg font-semibold">{wordCount.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
          <p className="text-sm text-gray-500 mt-1">{title.length}/100</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={20}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm" required />
          <p className="text-sm text-gray-500 mt-1">{wordCount.toLocaleString()} chars</p>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="isPublished" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)}
            className="w-5 h-5 rounded" />
          <label htmlFor="isPublished" className="text-sm font-medium">Publish this chapter</label>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
          {saving ? 'Creating...' : 'Create Chapter'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400">
          Cancel
        </button>
      </div>
    </form>
  )
}