import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { ReactNode } from 'react'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getAdminSession()
  
  if (!session) {
    redirect('/auth/admin-login')
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <AdminSidebar adminName={session.name} adminEmail={session.email} />
      
      {/* ⭐ 改这里：从 ml-64 改为 ml-80 */}
      <div className="ml-80">
        <main className="min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  )
}