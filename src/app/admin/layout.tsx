import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { ReactNode } from 'react'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  // ⭐ 取消注释，启用权限检查
  const session = await getAdminSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - 传递管理员信息 */}
      <AdminSidebar adminName={session.name} adminEmail={session.email} />
      
      {/* Main Content */}
      <div className="ml-72">
        <main className="min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  )
}