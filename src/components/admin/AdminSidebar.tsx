'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  Users,
  Plus
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

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
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
      <nav className="p-4">
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

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span>←</span>
          <span>Back to Site</span>
        </Link>
      </div>
    </aside>
  )
}