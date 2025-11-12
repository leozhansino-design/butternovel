'use client'

import { useState } from 'react'

interface TagsInputProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
}

// 预设的Romance类型标签
const POPULAR_TAGS = [
  // 角色类型
  'CEO', 'Billionaire', 'Mafia', 'Bad Boy', 'Alpha Male', 'Single Parent',
  // 关系类型
  'Contract Marriage', 'Arranged Marriage', 'Fake Relationship', 'Forced Marriage', 'Secret Relationship',
  // 情节发展
  'Second Chance', 'Enemies to Lovers', 'Friends to Lovers', 'Revenge', 'Betrayal',
  // 特殊元素
  'Pregnancy', 'Secret Baby', 'Werewolf', 'Vampire', 'Age Gap', 'Forbidden Love',
  // 背景设定
  'Office Romance', 'Rags to Riches', 'Possessive'
]

export default function TagsInput({
  selectedTags,
  onChange,
  maxTags = 10
}: TagsInputProps) {
  const [showAllTags, setShowAllTags] = useState(false)
  const [customTag, setCustomTag] = useState('')

  const displayedTags = showAllTags ? POPULAR_TAGS : POPULAR_TAGS.slice(0, 8)
  const remainingTags = maxTags - selectedTags.length

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag))
    } else {
      if (selectedTags.length < maxTags) {
        onChange([...selectedTags, tag])
      }
    }
  }

  const handleAddCustomTag = () => {
    const trimmedTag = customTag.trim()
    if (!trimmedTag) return

    if (selectedTags.includes(trimmedTag)) {
      alert('Tag already added')
      return
    }

    if (selectedTags.length >= maxTags) {
      alert(`Maximum ${maxTags} tags allowed`)
      return
    }

    onChange([...selectedTags, trimmedTag])
    setCustomTag('')
  }

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustomTag()
    }
  }

  return (
    <div className="space-y-4">
      {/* 标题和剩余数量 */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags (Max {maxTags})
        </label>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {remainingTags} remaining
        </span>
      </div>

      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Selected Tags:</p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full text-sm font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-pink-900 dark:hover:text-pink-100 focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 预设标签 */}
      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Popular Tags:</p>
        <div className="flex flex-wrap gap-2">
          {displayedTags.map((tag, index) => {
            const isSelected = selectedTags.includes(tag)
            const isDisabled = !isSelected && selectedTags.length >= maxTags

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleToggleTag(tag)}
                disabled={isDisabled}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-pink-500 text-white'
                    : isDisabled
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            )
          })}

          {/* 显示更多/收起按钮 */}
          {POPULAR_TAGS.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllTags(!showAllTags)}
              className="px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              {showAllTags ? '- Less' : '+ More'}
            </button>
          )}
        </div>
      </div>

      {/* 自定义标签输入 */}
      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Custom Tag:</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter custom tag..."
            disabled={selectedTags.length >= maxTags}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={handleAddCustomTag}
            disabled={!customTag.trim() || selectedTags.length >= maxTags}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            Add Tag
          </button>
        </div>
      </div>
    </div>
  )
}
