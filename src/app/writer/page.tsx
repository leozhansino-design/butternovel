// src/app/writer/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Footer from '@/components/shared/Footer'
import Link from 'next/link'

async function WriterContent() {
  return (
    <main className="flex-1 bg-gradient-to-b from-blue-50/30 via-white to-white">
      <div className="container mx-auto px-4 max-w-4xl py-20">
        {/* Hero Section - 简约高端 */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-6 tracking-tight">
            Become a Writer
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Share your stories with millions of readers worldwide. Start your writing journey today.
          </p>
        </div>

        {/* Features Grid - 简约设计，无 icon */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          <div className="glass-effect p-8 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all group">
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              Easy to Publish
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Simple and intuitive tools to write, edit, and publish your novels. Focus on what matters - your story.
            </p>
          </div>

          <div className="glass-effect p-8 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all group">
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              Reach Global Readers
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Connect with readers from around the world. Build your fanbase and grow your audience.
            </p>
          </div>

          <div className="glass-effect p-8 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all group">
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              Monetize Your Work
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Earn from your passion. Multiple monetization options available for published authors.
            </p>
          </div>

          <div className="glass-effect p-8 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all group">
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              Track Your Success
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Detailed analytics to understand your readers. See what works and grow your craft.
            </p>
          </div>
        </div>

        {/* CTA Section - 简约高端蓝色 */}
        <div className="text-center glass-effect-blue rounded-2xl p-12 border border-blue-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Writing?
          </h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
            Join thousands of writers who are already sharing their stories on ButterNovel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="btn-primary px-8 py-4 text-white font-semibold rounded-lg"
            >
              Start Writing Now
            </Link>
            <Link
              href="/"
              className="btn-secondary px-8 py-4 font-medium rounded-lg"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Info Notice - 简约 */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Already have an account? You'll be automatically redirected to your Writer Dashboard.
          </p>
        </div>
      </div>
    </main>
  )
}

// ✅ ISR: 1小时重新验证
export const revalidate = 3600

// 🔧 CRITICAL FIX: Override Upstash's default no-store fetch behavior
// Upstash Redis uses fetch with cache: 'no-store', which prevents ISR
// By setting fetchCache = 'force-cache', we allow ISR to work properly
// NOTE: Removed force-dynamic as it defeats the purpose of ISR
export const fetchCache = 'force-cache'

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
            <div className="animate-pulse">
              <div className="h-2 w-32 bg-blue-200 rounded mx-auto"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        </div>
      }>
        <WriterContent />
      </Suspense>
      <Footer />
    </div>
  )
}
