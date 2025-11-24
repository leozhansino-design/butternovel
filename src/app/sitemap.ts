// src/app/sitemap.ts
// Generate sitemap dynamically for Google
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

  // Static pages - always available
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/writer`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  try {
    // Fetch all published novels (limit to 10,000 for sitemap size)
    const novels = await prisma.novel.findMany({
      where: {
        isPublished: true,
        isBanned: false,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10000,
    })

    const novelPages: MetadataRoute.Sitemap = novels.map((novel: { slug: string; updatedAt: Date }) => ({
      url: `${baseUrl}/novels/${novel.slug}`,
      lastModified: novel.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    // Fetch all categories
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
      },
    })

    const categoryPages: MetadataRoute.Sitemap = categories.map((category: { slug: string }) => ({
      url: `${baseUrl}/search?category=${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }))

    // Fetch popular tags (top 100)
    const tags = await prisma.tag.findMany({
      select: {
        slug: true,
      },
      orderBy: {
        count: 'desc',
      },
      take: 100,
    })

    const tagPages: MetadataRoute.Sitemap = tags.map((tag: { slug: string }) => ({
      url: `${baseUrl}/tags/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return [...staticPages, ...novelPages, ...categoryPages, ...tagPages]
  } catch (error) {
    // If database is not available during build, return static pages only
    console.warn('Sitemap: Database not available, returning static pages only')
    return staticPages
  }
}
