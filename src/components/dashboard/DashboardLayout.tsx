'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, Upload, PenTool, LogOut, User } from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
  userName: string
  userEmail: string
}

export default function DashboardLayout({ children, userName, userEmail }: DashboardLayoutProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: Home, exact: true },
    { path: '/dashboard/novels', label: 'My Novels', icon: BookOpen, exact: false },
    { path: '/dashboard/upload', label: 'Upload', icon: Upload, exact: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <PenTool className="text-blue-600" size={24} />
            <span className="text-xl font-bold text-gray-900">ButterNovel</span>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
              Author
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = item.exact
                ? pathname === item.path
                : isActive(item.path)

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName || 'Author'}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {userName?.charAt(0).toUpperCase() || 'A'}
              </div>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Exit
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </div>
  )
}
