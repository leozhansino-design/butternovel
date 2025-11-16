/**
 * 首页数据获取
 *
 * 🔧 OPTIMIZATION: 完全移除Redis缓存
 * 原因: Next.js ISR已经缓存了完整的HTML页面(1小时)
 * - ISR期间，HTML直接返回，根本不会执行这个函数
 * - Redis缓存数据在ISR期间完全用不到
 * - 每小时只需查询DB一次，性能完全够用
 *
 * 架构: 完全依赖ISR + Supabase
 * - 第1次访问: 查DB → 渲染HTML → ISR缓存1小时
 * - 后续访问(1小时内): 直接返回缓存HTML (0 Redis, 0 DB!)
 * - 1小时后: 重复第1步
 */

import { prisma } from '@/lib/prisma';
import { withRetry, withConcurrency } from '@/lib/db-utils';

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
 * 获取所有首页数据
 *
 * 🔧 OPTIMIZATION: 移除Redis缓存,完全依赖ISR
 * - 直接查询数据库
 * - ISR缓存HTML (1小时)
 * - 每小时只查询1次DB
 */
export async function getHomePageData(): Promise<HomePageData> {
  console.log('[Homepage] 🏠 getHomePageData called');
  const totalStartTime = Date.now();

  try {
    console.log('[Homepage] 📊 Fetching fresh data from database');

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
    ) as any[];

    // 2. 获取所有分类
    const categories = await withRetry(() =>
      prisma.category.findMany({
        orderBy: { order: 'asc' }
      })
    ) as any[];

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
    ) as any[];

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

    console.log(`[Homepage] ✅ Data prepared: ${featured.length} featured, ${categories.length} categories`);

    const totalDuration = Date.now() - totalStartTime;
    console.log(`[Homepage] 🏁 getHomePageData complete (total: ${totalDuration}ms)`);

    return data;
  } catch (error) {
    console.error('[Homepage] 🚨 Database error:', error);

    // 返回空数据而不是抛出错误，避免整个页面崩溃
    return {
      featured: [],
      categories: [],
      categoryNovels: {},
      timestamp: Date.now()
    };
  }
}

/**
 * 清除首页缓存（当内容更新时）
 *
 * 🔧 OPTIMIZATION: 移除Redis缓存清理
 * 现在只需要清除Next.js的ISR缓存
 */
export async function invalidateHomePageCache(): Promise<void> {
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/', 'page');
  console.log('[Homepage] ✅ ISR cache invalidated for homepage');
}
