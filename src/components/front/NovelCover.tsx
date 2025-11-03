import Image from 'next/image'

interface NovelCoverProps {
  src: string
  alt: string
  priority?: boolean
}

/**
 * 简约大气的小说封面组件
 * - 固定 2:3 比例（标准书籍比例）
 * - 精致边框和阴影
 * - 悬停缩放效果
 */
export default function NovelCover({ src, alt, priority = false }: NovelCoverProps) {
  return (
    <div className="relative w-full">
      {/* 主封面容器 */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shadow-lg hover:shadow-2xl transition-shadow duration-300 group">
        {/* 封面图片 */}
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        
        {/* 精致的内边框 */}
        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 pointer-events-none" />
        
        {/* 轻微的渐变遮罩增强立体感 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none" />
      </div>
      
      {/* 底部阴影效果 */}
      <div className="absolute -bottom-2 left-[10%] right-[10%] h-4 bg-black/10 blur-md rounded-full opacity-40 group-hover:opacity-60 transition-opacity" />
    </div>
  )
}