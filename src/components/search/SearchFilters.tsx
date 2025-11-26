// src/components/search/SearchFilters.tsx
'use client'

import { useEffect, useState } from 'react'
import { CATEGORIES } from '@/lib/constants'
import { safeParseJson } from '@/lib/fetch-utils'

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
  // Use static categories from constants to ensure consistency with Header/Footer
  const [categories] = useState<Category[]>(
    CATEGORIES.map((cat, index) => ({
      id: index + 1,
      name: cat.name,
      slug: cat.slug,
    }))
  )
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loadingTags, setLoadingTags] = useState(false)

  // 加载热门标签或相关标签（智能联动）
  useEffect(() => {
    const loadTags = async () => {
      setLoadingTags(true)
      try {
        let tags: Tag[] = []

        if (selectedTags.length > 0) {
          // 已选标签，获取相关标签
          const params = new URLSearchParams()
          params.set('tags', selectedTags.join(','))
          if (selectedCategory) {
            params.set('genre', selectedCategory)
          }
          params.set('limit', '15')

          const response = await fetch(`/api/tags/related?${params}`)
          const data = await safeParseJson(response)

          if (response.ok && data.success) {
            tags = data.data || []
          }

          // 构建已选标签对象数组 - 确保所有已选标签都被保留
          const selectedTagObjects: Tag[] = []

          // 首先从相关标签中查找已选标签
          for (const slug of selectedTags) {
            const tagInRelated = tags.find((t: Tag) => t.slug === slug)
            if (tagInRelated) {
              selectedTagObjects.push(tagInRelated)
            }
          }

          // 如果有已选标签在相关标签中找不到，从当前可用标签中查找
          const foundSlugs = selectedTagObjects.map((t: Tag) => t.slug)
          const missingSlugs = selectedTags.filter(slug => !foundSlugs.includes(slug))

          if (missingSlugs.length > 0) {
            for (const slug of missingSlugs) {
              const tagInAvailable = availableTags.find((t: Tag) => t.slug === slug)
              if (tagInAvailable) {
                selectedTagObjects.push(tagInAvailable)
              }
            }

            // 如果还有找不到的，从popular中获取
            const stillMissingSlugs = selectedTags.filter(
              slug => !selectedTagObjects.find((t: Tag) => t.slug === slug)
            )

            if (stillMissingSlugs.length > 0) {
              const popularResponse = await fetch(
                `/api/tags/popular?limit=50${selectedCategory ? `&genre=${selectedCategory}` : ''}`
              )
              const popularData = await safeParseJson(popularResponse)
              if (popularResponse.ok && popularData.success) {
                for (const slug of stillMissingSlugs) {
                  const tagInPopular = popularData.data.find((t: Tag) => t.slug === slug)
                  if (tagInPopular) {
                    selectedTagObjects.push(tagInPopular)
                  }
                }
              }
            }
          }

          // 过滤掉相关标签中已包含的已选标签（去重）
          const selectedSlugs = selectedTagObjects.map((t: Tag) => t.slug)
          const uniqueRelatedTags = tags.filter((t: Tag) => !selectedSlugs.includes(t.slug))
          // 将已选标签放在前面，然后是去重后的相关标签
          tags = [...selectedTagObjects, ...uniqueRelatedTags]
        } else {
          // 未选标签，获取热门标签
          const params = new URLSearchParams()
          if (selectedCategory) {
            params.set('genre', selectedCategory)
          }
          params.set('limit', '15')

          const response = await fetch(`/api/tags/popular?${params}`)
          const data = await safeParseJson(response)

          if (response.ok && data.success) {
            tags = data.data || []
          }
        }

        setAvailableTags(tags)
      } catch (err) {
        console.error('Failed to fetch tags:', err)
      } finally {
        setLoadingTags(false)
      }
    }

    loadTags()
  }, [selectedCategory, selectedTags])

  const handleCategoryClick = (categorySlug: string) => {
    if (selectedCategory === categorySlug) {
      onCategoryChange('')
    } else {
      onCategoryChange(categorySlug)
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
    <div className="bg-white sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl py-2 sm:py-4">
        {/* Category filters - 移动端水平滚动 */}
        <div className="mb-2 sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap overflow-x-auto sm:flex-wrap scrollbar-hide pb-1 sm:pb-0">
            <button
              onClick={() => onCategoryChange('')}
              className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 第二行：热门标签（智能联动）- 移动端隐藏或简化 */}
        {availableTags.length > 0 && (
          <div className="mb-2 sm:mb-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">
                {selectedTags.length > 0 ? 'Related:' : 'Popular:'}
              </h3>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => onTagsChange([])}
                  className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-nowrap overflow-x-auto sm:flex-wrap max-h-[60px] sm:max-h-[120px] scrollbar-hide pb-1 sm:pb-0">
              {availableTags.slice(0, 10).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.slug)}
                  className={`px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full text-[10px] sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                    selectedTags.includes(tag.slug)
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {/* 显示剩余的标签（平板以上） */}
              {availableTags.slice(10).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.slug)}
                  className={`hidden sm:block px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                    selectedTags.includes(tag.slug)
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 第三行：状态筛选 & 排序 - 移动端更紧凑 */}
        <div className="flex items-center justify-between gap-2">
          {/* 左侧：状态筛选 */}
          <div className="flex items-center gap-2 sm:gap-4">
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStatuses.includes('completed')}
                onChange={() => handleStatusChange('completed')}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs sm:text-sm text-gray-700">Done</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStatuses.includes('ongoing')}
                onChange={() => handleStatusChange('ongoing')}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs sm:text-sm text-gray-700">Ongoing</span>
            </label>
          </div>

          {/* 右侧：排序 & 清除筛选 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {hasFilters && (
              <button
                onClick={onClearAll}
                className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear all
              </button>
            )}
            <select
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="hot">Hot</option>
              <option value="new">New</option>
              <option value="top_rated">Top</option>
              <option value="most_read">Views</option>
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
