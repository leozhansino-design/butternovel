import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { CATEGORIES } from '@/lib/constants'

/**
 * 动态生成 Sitemap
 * Next.js 会自动在 /sitemap.xml 提供此内容
 *
 * 参考: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/writer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]

  // 分类页面
  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  // 获取所有已发布的小说
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
  })

  const novelPages: MetadataRoute.Sitemap = novels.map((novel: { slug: string; updatedAt: Date }) => ({
    url: `${baseUrl}/novels/${novel.slug}`,
    lastModified: novel.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  // 获取所有已发布的章节（限制最新 1000 章以避免 sitemap 过大）
  const chapters = await prisma.chapter.findMany({
    where: {
      isPublished: true,
      novel: {
        isPublished: true,
        isBanned: false,
      },
    },
    select: {
      id: true,
      updatedAt: true,
      novel: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 1000, // 限制最新 1000 章
  })

  const chapterPages: MetadataRoute.Sitemap = chapters.map((chapter: { id: number; updatedAt: Date; novel: { slug: string } }) => ({
    url: `${baseUrl}/novels/${chapter.novel.slug}/chapter/${chapter.id}`,
    lastModified: chapter.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticPages, ...categoryPages, ...novelPages, ...chapterPages]
}
