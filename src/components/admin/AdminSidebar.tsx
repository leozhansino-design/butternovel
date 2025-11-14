'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  Users,
  Plus,
  LogOut
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
  {
    title: 'Admin Profile',
    href: '/admin/profile',
    icon: Users,
  },
]

type Props = {
  adminName?: string
  adminEmail?: string
}

export default function AdminSidebar({ adminName, adminEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include' // ✅ 确保 cookie 总是被发送
      })
      router.push('/auth/admin-login')
      router.refresh()
    } catch (error) {
      alert('Logout failed')
    }
  }

  return (
    <aside className="w-80 bg-[#1a1a1a] min-h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo Section */}
      <div className="h-20 flex items-center px-8 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="text-[#D4A574] font-bold text-2xl tracking-tight">
            ButterNovel
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-8">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-4 px-6 py-4 rounded-lg text-base font-medium
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-[#D4A574] text-[#1a1a1a]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon size={22} />
                  <span>{item.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10">
        {/* Admin Info */}
        {adminName && (
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#D4A574] rounded-full flex items-center justify-center">
                <span className="text-[#1a1a1a] text-base font-bold">
                  {adminName[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-white truncate">
                  {adminName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {adminEmail}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-3.5 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}