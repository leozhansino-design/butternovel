import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import UserProfile from '@/components/profile/UserProfile'

export const metadata = {
  title: 'Profile - ButterNovel',
  description: 'User profile and statistics',
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50">
      <UserProfile />
    </div>
  )
}
