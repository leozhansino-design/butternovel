/**
 * 优化的缓存策略
 * 目标：减少 Redis commands 消耗
 *
 * 问题：首页使用 17 个独立缓存键，每次渲染 = 17 reads
 * 解决：合并为 1 个缓存键，每次渲染 = 1 read
 *
 * 优化效果：
 * - 第一次访问：1 read (miss) + 1 write = 2 commands
 * - 后续访问（缓存命中）：1 read = 1 command
 * - 节省：从 17 commands → 1 command（减少 94%）
 */

import { prisma } from '@/lib/prisma';
import { withRetry, withConcurrency } from '@/lib/db-utils';
import { getOrSet, CacheKeys, CacheTTL } from '@/lib/cache';

/**
 * 首页数据类型
 */
export interface HomePageData {
  featured: Array<{
    id: number;
    title: string;
    slug: string;
    coverImage: string;
    blurb: string;
    categoryName: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    order: number;
  }>;
  categoryNovels: Record<string, Array<{
    id: number;
    title: string;
    slug: string;
    coverImage: string;
    categoryName: string;
    status: string;
    chaptersCount: number;
    likesCount: number;
  }>>;
  timestamp: number; // 缓存生成时间
}

/**
 * 获取所有首页数据（单个缓存键）
 *
 * 优化前：
 * - home:featured (1 read)
 * - home:all-categories (1 read)
 * - home:category:{slug} (15 reads)
 * = 17 reads per 渲染
 *
 * 优化后：
 * - home:all-data (1 read)
 * = 1 read per 渲染
 *
 * 节省：94% Redis commands
 */
export async function getHomePageData(): Promise<HomePageData> {
  return await getOrSet(
    'home:all-data', // 单个缓存键
    async () => {
      console.log('🔄 首页缓存未命中，查询数据库...');

      // 1. 获取精选小说
      const featured = await withRetry(() =>
        prisma.$queryRaw<Array<{
          id: number;
          title: string;
          slug: string;
          coverImage: string;
          blurb: string;
          categoryName: string;
        }>>`
          SELECT
            n.id,
            n.title,
            n.slug,
            n."coverImage",
            n.blurb,
            c.name as "categoryName"
          FROM "Novel" n
          INNER JOIN "Category" c ON n."categoryId" = c.id
          WHERE n."isPublished" = true AND n."isBanned" = false
          ORDER BY RANDOM()
          LIMIT 24
        `
      );

      // 2. 获取所有分类
      const categories = await withRetry(() =>
        prisma.category.findMany({
          orderBy: { order: 'asc' }
        })
      );

      // 3. 为每个分类获取小说（并发控制）
      const categoryNovelsArray = await withConcurrency(
        categories.map(category => async () => {
          return await withRetry(() =>
            prisma.$queryRaw<Array<{
              id: number;
              title: string;
              slug: string;
              coverImage: string;
              categoryName: string;
              status: string;
              chaptersCount: number;
              likesCount: number;
            }>>`
              SELECT
                n.id,
                n.title,
                n.slug,
                n."coverImage",
                n.status,
                c.name as "categoryName",
                (SELECT COUNT(*) FROM "Chapter" ch WHERE ch."novelId" = n.id AND ch."isPublished" = true) as "chaptersCount",
                (SELECT COUNT(*) FROM "NovelLike" nl WHERE nl."novelId" = n.id) as "likesCount"
              FROM "Novel" n
              INNER JOIN "Category" c ON n."categoryId" = c.id
              WHERE n."isPublished" = true
                AND n."isBanned" = false
                AND c.slug = ${category.slug}
              ORDER BY RANDOM()
              LIMIT 10
            `
          );
        }),
        { concurrency: 3 }
      );

      // 4. 构造 categoryNovels 映射
      const categoryNovels: Record<string, Array<any>> = {};
      categories.forEach((category, index) => {
        categoryNovels[category.slug] = categoryNovelsArray[index];
      });

      const data: HomePageData = {
        featured,
        categories,
        categoryNovels,
        timestamp: Date.now()
      };

      console.log(`✅ 首页数据已聚合：${featured.length} featured, ${categories.length} categories`);
      return data;
    },
    CacheTTL.HOME_FEATURED // 使用 1 小时 TTL
  );
}

/**
 * 清除首页缓存（当内容更新时）
 */
export async function invalidateHomePageCache(): Promise<void> {
  const { invalidate } = await import('@/lib/cache');
  await invalidate('home:all-data');
  console.log('✓ 首页缓存已清除 (home:all-data)');
}
