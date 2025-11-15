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
      role: true,
      contributionPoints: true,
      level: true,
      totalReadingTime: true,
      libraryPrivacy: true,
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

  // Get books read count (unique novels from reading history)
  const booksReadRecords = await prisma.readingHistory.findMany({
    where: {
      userId: user.id,
    },
    select: { novelId: true },
    distinct: ['novelId'],
  })
  const booksRead = booksReadRecords.length

  // Get following and followers counts (default to 0 if Follow table doesn't exist)
  let following = 0
  let followers = 0
  try {
    following = await prisma.follow.count({
      where: { followerId: user.id }
    })
    followers = await prisma.follow.count({
      where: { followingId: user.id }
    })
  } catch (error) {
    // Follow table doesn't exist yet. Run: npx prisma db push
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50">
      <PublicUserProfile
        user={{
          ...user,
          stats: {
            booksRead: booksRead,
            following: following,
            followers: followers,
            totalRatings: user._count.ratings,
            readingTime: user.totalReadingTime,
          },
        }}
      />
    </div>
  )
}
