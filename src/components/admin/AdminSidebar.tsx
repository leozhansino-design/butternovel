'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  Users,
  Plus,
  LogOut  // ⭐ 新增
} from 'lucide-react'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Upload Novel',
    href: '/admin/novels/new',
    icon: Plus,
  },
  {
    title: 'Manage Novels',
    href: '/admin/novels',
    icon: BookOpen,
  },
  {
    title: 'Manage Users',
    href: '/admin/users',
    icon: Users,
  },
]

// ⭐ 添加 Props 类型
type Props = {
  adminName?: string
  adminEmail?: string
}

export default function AdminSidebar({ adminName, adminEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  // ⭐ 新增登出处理函数
  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin-login')  // ✅ 应该是这个
      router.refresh()
    } catch (error) {
      alert('Logout failed')
    }
  }

  return (
    <aside className="w-72 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-xl">🦋</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">ButterNovel</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 flex-1">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ⭐ 新增：Footer - Admin Info + Logout */}
      <div className="border-t border-gray-200">
        {/* Admin Info */}
        {adminName && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {adminName[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {adminName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {adminEmail}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

        {/* Back to Site */}
        <div className="p-4 pt-0">
          <Link
            href="/"
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>←</span>
            <span>Back to Site</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}