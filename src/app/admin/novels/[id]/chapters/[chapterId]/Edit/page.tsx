// src/app/admin/novels/[id]/chapters/[chapterId]/edit/page.tsx
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect, notFound } from 'next/navigation'
import ChapterEditForm from '@/components/admin/ChapterEditForm'

type Props = {
  params: Promise<{ id: string; chapterId: string }>
}

export default async function EditChapterPage(props: Props) {
  const params = await props.params
  
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  const novelId = parseInt(params.id)
  const chapterId = parseInt(params.chapterId)
  
  if (isNaN(novelId) || isNaN(chapterId)) {
    notFound()
  }

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      novel: {
        select: { id: true, title: true }
      }
    }
  })

  if (!chapter || chapter.novelId !== novelId) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Chapter</h1>
        <p className="text-gray-600 mt-1">Novel: {chapter.novel.title}</p>
      </div>
      <ChapterEditForm chapter={chapter} novelId={novelId} />
    </div>
  )
}