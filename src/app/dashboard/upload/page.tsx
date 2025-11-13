import NovelUploadForm from '@/components/dashboard/NovelUploadForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UploadPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/novels"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Novels
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload New Novel</h1>
        <p className="text-gray-600">
          Fill in the details below to publish your novel
        </p>
      </div>

      {/* Upload Form */}
      <NovelUploadForm />
    </div>
  )
}
