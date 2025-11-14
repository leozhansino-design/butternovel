import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PublicUserProfile from '@/components/profile/PublicUserProfile'

interface PageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  return {
    title: `${user?.name || 'User'}'s Profile - ButterNovel`,
    description: `View ${user?.name || 'user'}'s profile and activity`,
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      contributionPoints: true,
      level: true,
      totalReadingTime: true,
      createdAt: true,
      _count: {
        select: {
          library: true,
          ratings: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  // Get completed chapters count
  const completedChapters = await prisma.chapterProgress.count({
    where: {
      userId: user.id,
      isCompleted: true,
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50">
      <PublicUserProfile
        user={{
          ...user,
          stats: {
            booksInLibrary: user._count.library,
            chaptersRead: completedChapters,
            readingTime: user.totalReadingTime,
            totalRatings: user._count.ratings,
          },
        }}
      />
    </div>
  )
}
