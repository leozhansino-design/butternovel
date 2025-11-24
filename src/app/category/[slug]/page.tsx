// src/app/category/[slug]/page.tsx
// ⚠️ DEPRECATED: This route now redirects to the unified search page
// All category browsing should use /search?category={slug}

import { redirect } from 'next/navigation'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  // Redirect to unified search page with category filter
  redirect(`/search?category=${slug}`)
}
