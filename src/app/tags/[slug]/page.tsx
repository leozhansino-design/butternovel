// src/app/tags/[slug]/page.tsx
// ⚠️ DEPRECATED: This route now redirects to the unified search page
// All tag browsing should use /search?tags={slug}

import { redirect } from 'next/navigation'

interface TagPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params

  // Redirect to unified search page with tag filter
  redirect(`/search?tags=${slug}`)
}
