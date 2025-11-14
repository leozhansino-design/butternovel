import NovelUploadForm from '@/components/dashboard/NovelUploadForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href="/dashboard/novels"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Stories
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create New Story</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details below to create your story</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <NovelUploadForm />
      </div>
    </div>
  )
}
