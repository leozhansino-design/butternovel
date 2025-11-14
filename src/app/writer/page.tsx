// src/app/writer/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Footer from '@/components/shared/Footer'
import Link from 'next/link'

async function WriterContent() {
  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/30 to-white">
      <div className="container mx-auto px-4 max-w-4xl py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">✍️</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Become a Writer
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Share your stories with millions of readers worldwide. Start your writing journey today!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Easy to Publish
            </h3>
            <p className="text-gray-600">
              Simple and intuitive tools to write, edit, and publish your novels. Focus on what matters - your story.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Reach Global Readers
            </h3>
            <p className="text-gray-600">
              Connect with readers from around the world. Build your fanbase and grow your audience.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Monetize Your Work
            </h3>
            <p className="text-gray-600">
              Earn from your passion. Multiple monetization options available for published authors.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Track Your Success
            </h3>
            <p className="text-gray-600">
              Detailed analytics to understand your readers. See what works and grow your craft.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-amber-50 rounded-2xl p-12 border border-amber-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Writing?
          </h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Join thousands of writers who are already sharing their stories on ButterNovel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded-lg transition-colors shadow-sm"
            >
              Start Writing Now
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-colors border border-gray-200"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            ✨ Already have an account? You'll be automatically redirected to your Writer Dashboard.
          </p>
        </div>
      </div>
    </main>
  )
}

// ✅ ISR: 1小时重新验证
export const revalidate = 3600

// ⚡ CRITICAL: 覆盖 Upstash Redis 的 no-store，允许 ISR 缓存（虽然此页面不使用 Redis）
export const fetchCache = 'default-cache'

export default async function WriterPage() {
  // Check if user is already logged in
  const session = await auth()

  // If logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <WriterContent />
      </Suspense>
      <Footer />
    </div>
  )
}
