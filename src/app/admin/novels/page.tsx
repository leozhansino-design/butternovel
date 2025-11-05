// src/app/admin/novels/page.tsx
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import NovelSearchBar from '@/components/admin/NovelSearchBar'

type Props = {
  searchParams: {
    q?: string        // 搜索关键词
    page?: string     // 当前页码
    category?: string // 分类筛选
    status?: string   // 状态筛选
  }
}

export default async function ManageNovelsPage({ searchParams }: Props) {
  // 验证管理员权限
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }

  const query = searchParams.q || ''
  const currentPage = parseInt(searchParams.page || '1')
  const pageSize = 10 // 每页显示 10 本小说

  // 构建搜索条件
  const where: any = {}
  
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { authorName: { contains: query, mode: 'insensitive' } },
      { blurb: { contains: query, mode: 'insensitive' } },
    ]
  }

  if (searchParams.category) {
    where.categoryId = parseInt(searchParams.category)
  }

  if (searchParams.status) {
    where.status = searchParams.status
  }

  // 获取小说列表和总数
  const [novels, total] = await Promise.all([
    prisma.novel.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            chapters: true,
            likes: true,
            comments: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.novel.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  // 获取所有分类（用于筛选）
  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 页头 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Novels</h1>
          <p className="text-gray-600 mt-1">Search, edit, and manage all novels</p>
        </div>
        <Link
          href="/admin/novels/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Upload New Novel
        </Link>
      </div>

      {/* 搜索栏 */}
      <NovelSearchBar 
        categories={categories}
        initialQuery={query}
      />

      {/* 统计信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-900">
          Found <strong className="font-bold">{total}</strong> novel{total !== 1 ? 's' : ''}
          {query && ` matching "${query}"`}
          {' · '}Page {currentPage} of {totalPages}
        </p>
      </div>

      {/* 小说列表 */}
      {novels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No novels found</p>
          {query && (
            <Link
              href="/admin/novels"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Novel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {novels.map((novel) => (
                <tr key={novel.id} className="hover:bg-gray-50 transition-colors">
                  {/* 小说信息 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-16 flex-shrink-0">
                        <Image
                          src={novel.coverImage}
                          alt={novel.title}
                          fill
                          className="rounded object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {novel.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          ID: {novel.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 作者 */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{novel.authorName}</div>
                  </td>

                  {/* 分类 */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {novel.category.name}
                    </span>
                  </td>

                  {/* 状态 */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      novel.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {novel.status}
                    </span>
                  </td>

                  {/* 统计 */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div>📚 {novel._count.chapters} chapters</div>
                      <div className="text-gray-500">
                        👍 {novel._count.likes} · 💬 {novel._count.comments}
                      </div>
                    </div>
                  </td>

                  {/* 创建时间 */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {new Date(novel.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  {/* 操作按钮 */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/novels/${novel.id}/edit`}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/novels/${novel.slug}`}
                        target="_blank"
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} results
          </div>
          
          <div className="flex gap-2">
            {/* 上一页 */}
            {currentPage > 1 && (
              <Link
                href={`/admin/novels?${new URLSearchParams({ ...searchParams, page: String(currentPage - 1) }).toString()}`}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Previous
              </Link>
            )}

            {/* 页码 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // 只显示当前页附近的页码
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <Link
                    key={page}
                    href={`/admin/novels?${new URLSearchParams({ ...searchParams, page: String(page) }).toString()}`}
                    className={`px-4 py-2 border rounded transition-colors ${
                      page === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </Link>
                )
              } else if (
                page === currentPage - 3 ||
                page === currentPage + 3
              ) {
                return <span key={page} className="px-2">...</span>
              }
              return null
            })}

            {/* 下一页 */}
            {currentPage < totalPages && (
              <Link
                href={`/admin/novels?${new URLSearchParams({ ...searchParams, page: String(currentPage + 1) }).toString()}`}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}