import { MetadataRoute } from 'next'

/**
 * 动态生成 robots.txt
 * Next.js 会自动在 /robots.txt 提供此内容
 *
 * 参考: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',          // 禁止爬取 API 路由
          '/dashboard/*',    // 禁止爬取作者仪表板
          '/_next/*',        // 禁止爬取 Next.js 内部路径
          '/admin/*',        // 禁止爬取管理员后台
        ],
      },
      {
        // 针对友好的爬虫可以设置不同规则
        userAgent: ['Googlebot', 'Bingbot'],
        allow: '/',
        disallow: [
          '/api/*',
          '/dashboard/*',
          '/admin/*',
        ],
        // 爬取延迟（秒）
        crawlDelay: 0,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
