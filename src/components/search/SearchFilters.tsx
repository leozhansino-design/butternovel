// src/components/search/SearchFilters.tsx
'use client'

import { useEffect, useState } from 'react'

interface Category {
  id: number
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
  count?: number
  coOccurrence?: number
}

interface SearchFiltersProps {
  selectedCategory: string
  selectedTags: string[]
  selectedStatuses: string[]
  selectedSort: string
  onCategoryChange: (category: string) => void
  onTagsChange: (tags: string[]) => void
  onStatusesChange: (statuses: string[]) => void
  onSortChange: (sort: string) => void
  onClearAll: () => void
}

export default function SearchFilters({
  selectedCategory,
  selectedTags,
  selectedStatuses,
  selectedSort,
  onCategoryChange,
  onTagsChange,
  onStatusesChange,
  onSortChange,
  onClearAll,
}: SearchFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loadingTags, setLoadingTags] = useState(false)

  // 加载分类列表
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.data || [])
        }
      })
      .catch((err) => console.error('Failed to fetch categories:', err))
  }, [])

  // 加载热门标签或相关标签（智能联动）
  useEffect(() => {
    const loadTags = async () => {
      setLoadingTags(true)
      try {
        if (selectedTags.length > 0) {
          // 已选标签，获取相关标签
          const params = new URLSearchParams()
          params.set('tags', selectedTags.join(','))
          if (selectedCategory) {
            params.set('category', selectedCategory)
          }
          params.set('limit', '15')

          const response = await fetch(`/api/tags/related?${params}`)
          const data = await response.json()

          if (data.success) {
            setAvailableTags(data.data || [])
          }
        } else {
          // 未选标签，获取热门标签
          const params = new URLSearchParams()
          if (selectedCategory) {
            params.set('category', selectedCategory)
          }
          params.set('limit', '15')

          const response = await fetch(`/api/tags/popular?${params}`)
          const data = await response.json()

          if (data.success) {
            setAvailableTags(data.data || [])
          }
        }
      } catch (err) {
        console.error('Failed to fetch tags:', err)
      } finally {
        setLoadingTags(false)
      }
    }

    loadTags()
  }, [selectedCategory, selectedTags])

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      onCategoryChange('')
    } else {
      onCategoryChange(categoryName)
    }
  }

  const handleTagClick = (tagSlug: string) => {
    if (selectedTags.includes(tagSlug)) {
      // 移除标签
      onTagsChange(selectedTags.filter((t) => t !== tagSlug))
    } else {
      // 添加标签
      onTagsChange([...selectedTags, tagSlug])
    }
  }

  const handleStatusChange = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status))
    } else {
      onStatusesChange([...selectedStatuses, status])
    }
  }

  const hasFilters = selectedCategory || selectedTags.length > 0 || selectedStatuses.length > 0

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl py-4">
        {/* 第一行：分类筛选 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => onCategoryChange('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.name
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 第二行：热门标签（智能联动） */}
        {availableTags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                {selectedTags.length > 0 ? 'Related Tags:' : 'Popular Tags:'}
              </h3>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => onTagsChange([])}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear tags
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.slug)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.slug)
                      ? 'bg-yellow-400 text-gray-900 font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                  {tag.count !== undefined && (
                    <span className="ml-1 text-xs text-gray-500">({tag.count})</span>
                  )}
                  {tag.coOccurrence !== undefined && (
                    <span className="ml-1 text-xs text-gray-500">({tag.coOccurrence})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 第三行：状态筛选 & 排序 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* 左侧：状态筛选 */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStatuses.includes('completed')}
                onChange={() => handleStatusChange('completed')}
                className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
              />
              <span className="text-sm text-gray-700">Completed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStatuses.includes('ongoing')}
                onChange={() => handleStatusChange('ongoing')}
                className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
              />
              <span className="text-sm text-gray-700">Ongoing</span>
            </label>
          </div>

          {/* 右侧：排序 & 清除筛选 */}
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button
                onClick={onClearAll}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear all filters
              </button>
            )}
            <select
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            >
              <option value="hot">Hot</option>
              <option value="new">New</option>
              <option value="top_rated">Top Rated</option>
              <option value="most_read">Most Read</option>
            </select>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
