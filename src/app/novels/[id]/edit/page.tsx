// src/app/admin/novels/[id]/edit/page.tsx
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect, notFound } from 'next/navigation'
import EditNovelForm from '@/components/admin/EditNovelForm'

type Props = {
  params: Promise<{ id: string }>  // ⭐ 改这里
}

export default async function EditNovelPage(props: Props) {  // ⭐ 改这里
  const params = await props.params  // ⭐ 加这一行
  
  // 验证管理员权限
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  // 将字符串转换为数字
  const novelId = parseInt(params.id)
  
  // 检查 ID 是否有效
  if (isNaN(novelId)) {
    notFound()
  }

  // 获取小说数据
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      category: true,
      chapters: {
        orderBy: { chapterNumber: 'asc' }
      }
    }
  })

  if (!novel) {
    notFound()
  }

  // 获取所有分类
  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' }
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Novel</h1>
        <p className="text-gray-600 mt-1">
          Update novel information, manage chapters, and moderate content
        </p>
      </div>

      <EditNovelForm novel={novel} categories={categories} />
    </div>
  )
}