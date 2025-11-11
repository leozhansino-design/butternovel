// src/components/library/ProfileView.tsx
'use client'

type ProfileViewProps = {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function ProfileView({ user }: ProfileViewProps) {
  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Profile</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-amber-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-3xl ring-4 ring-amber-100">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
              {user.name || 'Not set'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
              {user.email}
            </div>
          </div>

          {/* Reading Stats */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">0</div>
                <div className="text-xs text-gray-600 mt-1">Books Read</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">0</div>
                <div className="text-xs text-gray-600 mt-1">Total Chapters</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">0h</div>
                <div className="text-xs text-gray-600 mt-1">Reading Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
