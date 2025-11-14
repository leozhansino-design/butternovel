import { BookOpen, FileText, Eye, Star, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

async function getDashboardStats(userEmail: string) {
  try {
    const novels = await prisma.novel.findMany({
      where: {
        authorId: userEmail,
      },
      include: {
        chapters: {
          select: {
            id: true,
          },
        },
        ratings: {
          select: {
            score: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const totalNovels = novels.length
    const totalChapters = novels.reduce((sum, novel) => sum + novel.chapters.length, 0)
    const totalViews = novels.reduce((sum, novel) => sum + novel.viewCount, 0)

    let totalRatings = 0
    let ratingSum = 0

    novels.forEach((novel) => {
      novel.ratings.forEach((rating) => {
        totalRatings++
        ratingSum += rating.score
      })
    })

    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0

    const recentNovels = novels.slice(0, 5).map((novel) => ({
      id: novel.id,
      title: novel.title,
      slug: novel.slug,
      coverImage: novel.coverImage,
      status: novel.status,
      totalChapters: novel.chapters.length,
      viewCount: novel.viewCount,
      averageRating: novel.averageRating,
      updatedAt: novel.updatedAt,
      isPublished: novel.isPublished,
    }))

    return {
      stats: {
        totalNovels,
        totalChapters,
        totalViews,
        averageRating: parseFloat(averageRating.toFixed(1)),
      },
      recentNovels,
    }
  } catch (error) {
    console.error('[Dashboard] Error fetching stats:', error)
    return {
      stats: {
        totalNovels: 0,
        totalChapters: 0,
        totalViews: 0,
        averageRating: 0,
      },
      recentNovels: [],
    }
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/auth/login?callbackUrl=/dashboard')
  }

  const { stats, recentNovels } = await getDashboardStats(session.user.email)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {session.user.name || 'Author'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening with your stories</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Total Stories */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Stories</p>
              <BookOpen className="text-gray-400" size={20} />
            </div>
            <p className="text-3xl font-semibold text-gray-900">{stats.totalNovels}</p>
          </div>

          {/* Total Chapters */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Chapters</p>
              <FileText className="text-gray-400" size={20} />
            </div>
            <p className="text-3xl font-semibold text-gray-900">{stats.totalChapters}</p>
          </div>

          {/* Total Views */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Views</p>
              <Eye className="text-gray-400" size={20} />
            </div>
            <p className="text-3xl font-semibold text-gray-900">{stats.totalViews.toLocaleString()}</p>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Avg. Rating</p>
              <Star className="text-gray-400" size={20} />
            </div>
            <p className="text-3xl font-semibold text-gray-900">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/dashboard/upload"
            className="bg-indigo-600 text-white rounded-lg p-6 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={24} className="mb-2" />
            <h3 className="text-lg font-semibold mb-1">Start New Story</h3>
            <p className="text-sm text-indigo-100">Create a new novel and start writing</p>
          </Link>

          <Link
            href="/dashboard/novels"
            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
          >
            <TrendingUp size={24} className="text-gray-700 mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Continue Writing</h3>
            <p className="text-sm text-gray-500">Work on your existing stories</p>
          </Link>
        </div>

        {/* Recent Stories */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Stories</h2>
            <Link
              href="/dashboard/novels"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All
            </Link>
          </div>

          {recentNovels.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentNovels.map((novel: any) => (
                <Link
                  key={novel.id}
                  href={`/dashboard/novels/${novel.id}/chapters`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Cover Image */}
                  <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                    <Image
                      src={novel.coverImage}
                      alt={novel.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{novel.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{novel.totalChapters} chapters</span>
                      <span>{novel.viewCount.toLocaleString()} views</span>
                      {novel.averageRating && (
                        <span className="flex items-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          {novel.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        novel.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {novel.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(novel.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <BookOpen className="mx-auto mb-3 text-gray-300" size={48} />
              <p className="text-gray-500 mb-4">No stories yet</p>
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus size={18} />
                Start Writing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
