import { BookOpen, FileText, Eye, Star, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

async function getDashboardStats(userEmail: string) {
  try {
    // Get all novels by this author
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
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Calculate statistics
    const totalNovels = novels.length
    const totalChapters = novels.reduce((sum, novel) => sum + novel.chapters.length, 0)
    const totalViews = novels.reduce((sum, novel) => sum + novel.viewCount, 0)
    const totalComments = novels.reduce((sum, novel) => sum + novel.comments.length, 0)

    // Calculate average rating across all novels
    let totalRatings = 0
    let ratingSum = 0

    novels.forEach((novel) => {
      novel.ratings.forEach((rating) => {
        totalRatings++
        ratingSum += rating.score
      })
    })

    const averageRating = totalRatings > 0 ? ratingSum / totalRatings : 0

    // Get recent novels (last 5 updated)
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
        totalComments,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalRatings,
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
        totalComments: 0,
        averageRating: 0,
        totalRatings: 0,
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's your writing statistics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Novels */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Novels</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalNovels}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Total Chapters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Chapters</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalChapters}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <FileText className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Views</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalRatings} {stats.totalRatings === 1 ? 'rating' : 'ratings'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Star className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        {/* Total Comments */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Comments</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalComments}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
              <MessageSquare className="text-pink-600" size={24} />
            </div>
          </div>
        </div>

        {/* Quick Action Card */}
        <Link
          href="/dashboard/upload"
          className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-6 hover:shadow-lg transition-all hover:scale-105 text-white group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100 mb-1">Quick Action</p>
              <p className="text-xl font-bold">Upload New Novel</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <TrendingUp size={24} />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Novels */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Novels</h2>
          <Link
            href="/dashboard/novels"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </Link>
        </div>

        {recentNovels.length > 0 ? (
          <div className="space-y-4">
            {recentNovels.map((novel: any) => (
              <Link
                key={novel.id}
                href={`/dashboard/novels/${novel.id}`}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {/* Cover Image */}
                <div className="relative w-16 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                  <Image
                    src={novel.coverImage}
                    alt={novel.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Novel Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate mb-1">
                    {novel.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {novel.totalChapters} chapters
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {novel.viewCount.toLocaleString()} views
                    </span>
                    {novel.averageRating && (
                      <span className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        {novel.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      novel.isPublished
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
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
          <div className="text-center py-12">
            <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 font-medium mb-2">No novels yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Start your writing journey by uploading your first novel
            </p>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <BookOpen size={18} />
              Upload Your First Novel
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
