// src/app/admin/novels/[id]/chapters/new/page.tsx
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect, notFound } from 'next/navigation'
import ChapterAddForm from '@/components/admin/ChapterAddForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AddChapterPage(props: Props) {
  const params = await props.params
  
  // 验证管理员权限
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  const novelId = parseInt(params.id)
  
  if (isNaN(novelId)) {
    notFound()
  }

  // 获取小说信息
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: {
      id: true,
      title: true,
      _count: {
        select: { chapters: true }
      }
    }
  })

  if (!novel) {
    notFound()
  }

  // 计算下一个章节号
  const nextChapterNumber = novel._count.chapters + 1

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Chapter</h1>
        <p className="text-gray-600 mt-1">
          Novel: {novel.title} · Chapter {nextChapterNumber}
        </p>
      </div>

      <ChapterAddForm novelId={novelId} chapterNumber={nextChapterNumber} novelTitle={novel.title} />
    </div>
  )
}