import { redirect } from 'next/navigation'
// import { auth } from '@/lib/auth'  // 暂时注释
import AdminSidebar from '@/components/admin/AdminSidebar'
import { ReactNode } from 'react'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  // 暂时注释掉权限检查
  /*
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }
  */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="ml-72">
        {/* Page Content */}
        <main className="min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  )
}