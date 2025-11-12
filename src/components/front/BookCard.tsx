// src/components/front/BookCard.tsx
import Link from 'next/link'
import NovelCover from '././NovelCover'

interface BookCardProps {
  id: number
  title: string
  coverImage?: string
  category: string
  status: string
  chapters: number
  likes: number
  slug?: string
}

export default function BookCard({
  id,
  title,
  coverImage,
  category,
  status,
  chapters,
  likes,
  slug
}: BookCardProps) {
  const cover = coverImage || `https://images.unsplash.com/photo-${1544947950 + id}?w=300&h=450&fit=crop`
  const bookLink = slug ? `/novels/${slug}` : `/novels/book-${id}`
  
  return (
    <Link
      href={bookLink}
      className="group block"
    >
      <NovelCover 
        src={cover}
        alt={title}
      />

      <div className="mt-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
          <span className="px-2.5 py-0.5 bg-[#fffae6] text-[#b39320] rounded-full font-medium">
            {category}
          </span>
          <span className="text-gray-400">•</span>
          <span>{chapters} chapters</span>
        </div>

        {/* ⭐ 关键修改：2行显示 + 省略号 */}
        <h3 
          className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[#b39320] transition-colors"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4rem',
            height: '2.8rem',
          }}
        >
          {title}
        </h3>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span className="text-base">👍</span>
            <span className="font-medium">{likes.toLocaleString()}</span>
          </div>
          {status === 'COMPLETED' ? (
            <span className="text-emerald-600 text-xs font-medium">✓ Completed</span>
          ) : (
            <span className="text-blue-600 text-xs font-medium">📝 Ongoing</span>
          )}
        </div>
      </div>
    </Link>
  )
}