import { BookOpen, Users, Eye, Heart } from 'lucide-react'
import StatsCard from '@/components/admin/StatsCard'

export default async function AdminDashboard() {
  // 模拟数据
  const stats = {
    totalNovels: 156,
    totalUsers: 1234,
    totalViews: 45678,
    totalLikes: 8901,
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your ButterNovel platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              +12%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Novels</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalNovels.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="text-green-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              +8%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Eye className="text-orange-600" size={24} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
              +23%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Views</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Heart className="text-purple-600" size={24} />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
              -5%
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Likes</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalLikes.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-gray-400" size={28} />
          </div>
          <p className="text-gray-600 font-medium">No recent activity</p>
          <p className="text-sm text-gray-400 mt-1">Activity logs will appear here</p>
        </div>
      </div>

      {/* Quick Stats Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Platform Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Novels Published</td>
                <td className="px-6 py-4 text-sm text-gray-600">156</td>
                <td className="px-6 py-4 text-sm text-green-600">+12%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Active Users</td>
                <td className="px-6 py-4 text-sm text-gray-600">1,234</td>
                <td className="px-6 py-4 text-sm text-green-600">+8%</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Page Views</td>
                <td className="px-6 py-4 text-sm text-gray-600">45,678</td>
                <td className="px-6 py-4 text-sm text-green-600">+23%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}