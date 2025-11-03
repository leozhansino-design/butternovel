import Link from 'next/link'
import NovelCover from '././NovelCover'

interface BookCardProps {
  id: number
  title: string
  coverImage?: string  // 添加封面图片字段
  category: string
  chapters: number
  likes: number
  slug?: string  // 添加 slug 用于链接
}

export default function BookCard({ 
  id, 
  title, 
  coverImage,
  category, 
  chapters, 
  likes,
  slug 
}: BookCardProps) {
  // 如果没有提供 coverImage，使用占位图
  const cover = coverImage || `https://images.unsplash.com/photo-${1544947950 + id}?w=300&h=450&fit=crop`
  const bookLink = slug ? `/novels/${slug}` : `/novels/book-${id}`
  
  return (
    <Link
      href={bookLink}
      className="group block"
    >
      {/* 封面 */}
      <NovelCover 
        src={cover}
        alt={title}
      />

      {/* Book Info */}
      <div className="mt-3">
        {/* 分类和章节信息 */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
          <span className="px-2.5 py-0.5 bg-[#fffae6] text-[#b39320] rounded-full font-medium">
            {category}
          </span>
          <span className="text-gray-400">•</span>
          <span>{chapters} chapters</span>
        </div>

        {/* 标题 */}
        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 mb-2 leading-tight group-hover:text-[#b39320] transition-colors">
          {title}
        </h3>

        {/* 点赞和状态 */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="text-base">👍</span>
            <span className="font-medium">{likes.toLocaleString()}</span>
          </div>
          <span className="text-emerald-600 text-xs font-medium">✓ Completed</span>
        </div>
      </div>
    </Link>
  )
}