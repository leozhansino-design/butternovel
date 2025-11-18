# SEO 优化设置指南

## 概述

ButterNovel 已集成完整的 SEO 优化功能，包括动态 Sitemap、robots.txt、Open Graph 元数据、Twitter Cards、结构化数据（JSON-LD）和 PWA 支持。

## 已实现的功能

### ✅ 1. 动态 Sitemap（自动生成）

文件位置: `src/app/sitemap.ts`

**功能**:
- 自动包含所有静态页面（首页、作家页、搜索页）
- 自动包含所有分类页面
- 自动包含所有已发布的小说
- 自动包含最新 1000 章节（避免 sitemap 过大）
- 每个 URL 都包含正确的 `lastModified`、`changeFrequency` 和 `priority`

**访问地址**: `https://your-domain.com/sitemap.xml`

**无需额外配置** - Next.js 会自动生成并提供服务

### ✅ 2. Robots.txt（自动生成）

文件位置: `src/app/robots.ts`

**功能**:
- 允许搜索引擎抓取所有公开页面
- 禁止抓取 API 路由、仪表板、管理员后台
- 自动引用 sitemap.xml
- 针对不同爬虫设置不同规则

**访问地址**: `https://your-domain.com/robots.txt`

**无需额外配置** - Next.js 会自动生成

### ✅ 3. Open Graph 元数据

文件位置: `src/app/layout.tsx`（全局） + `src/lib/metadata.ts`（动态页面）

**功能**:
- 全局 Open Graph 配置（网站标题、描述、图片）
- 动态小说页面 Open Graph（标题、描述、封面图）
- 动态分类页面 Open Graph
- 动态章节页面 Open Graph

**工具函数**:
```typescript
import { generateNovelMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }): Promise<Metadata> {
  const novel = await getNovel(params.slug)
  return generateNovelMetadata({
    title: novel.title,
    blurb: novel.blurb,
    coverImage: novel.coverImage,
    authorName: novel.authorName,
    categoryName: novel.category.name,
    slug: novel.slug,
  })
}
```

### ✅ 4. Twitter Cards

已集成在元数据中，支持：
- `summary_large_image` 卡片（小说、分类、首页）
- `summary` 卡片（章节、搜索）

### ✅ 5. 结构化数据（JSON-LD）

文件位置: `src/lib/metadata.ts` - `generateNovelJsonLd()`

**功能**:
- Book Schema（小说）
- AggregateRating Schema（评分）
- Author Schema（作者）

**使用方法**:
在小说详情页添加：
```typescript
import { generateNovelJsonLd } from '@/lib/metadata'

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(generateNovelJsonLd(novel)),
  }}
/>
```

### ✅ 6. PWA 支持

文件位置: `public/site.webmanifest`

**功能**:
- 应用名称、描述、图标
- 独立显示模式（standalone）
- 主题颜色配置
- 屏幕方向配置

## 配置步骤

### 1. 设置网站 URL

在 `.env` 或 `.env.local` 文件中（已在 `.env.example` 中有示例）：

```bash
# 本地开发
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# 生产环境
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

**重要**: 生产环境部署后，务必修改为正式域名

### 2. 准备 Open Graph 图片

需要在 `public/` 目录下添加以下图片：

```bash
public/
  og-image.png        # 1200x630px - Open Graph 主图
  favicon.ico         # 网站图标
  apple-touch-icon.png # 180x180px - Apple 设备图标
  icon-192.png        # 192x192px - PWA 图标
  icon-512.png        # 512x512px - PWA 图标
```

**推荐工具**:
- [Favicon Generator](https://realfavicongenerator.net/)
- [Open Graph Image Generator](https://www.opengraph.xyz/)

### 3. Google Search Console 验证

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 添加网站并选择"HTML 标签"验证方式
3. 复制验证代码（形如 `google1234567890abcdef.html`）
4. 在 `src/app/layout.tsx` 中更新：

```typescript
verification: {
  google: 'your-google-verification-code', // 替换为实际代码
},
```

### 4. 提交 Sitemap

验证完成后，在 Google Search Console 中：
1. 点击左侧菜单 "Sitemaps"
2. 输入 `sitemap.xml`
3. 点击 "Submit"

**其他搜索引擎**:
- Bing: [Bing Webmaster Tools](https://www.bing.com/webmasters)
- Yandex: [Yandex Webmaster](https://webmaster.yandex.com/)

### 5. 更新社交媒体信息

在 `src/app/layout.tsx` 中更新：

```typescript
twitter: {
  card: 'summary_large_image',
  site: '@butternovel',      // 替换为你的 Twitter 账号
  creator: '@butternovel',   // 替换为你的 Twitter 账号
},
```

## 动态页面元数据集成

### 小说详情页

在 `src/app/novels/[slug]/page.tsx` 中添加：

```typescript
import { generateNovelMetadata, generateNovelJsonLd } from '@/lib/metadata'

export async function generateMetadata({ params }): Promise<Metadata> {
  const novel = await getNovel(params.slug)
  return generateNovelMetadata({
    title: novel.title,
    blurb: novel.blurb,
    coverImage: novel.coverImage,
    authorName: novel.authorName,
    categoryName: novel.category.name,
    slug: novel.slug,
  })
}

export default async function NovelPage({ params }) {
  const novel = await getNovel(params.slug)
  const jsonLd = generateNovelJsonLd({
    ...novel,
    categoryName: novel.category.name,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 页面内容 */}
    </>
  )
}
```

### 分类页

```typescript
import { generateCategoryMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }): Promise<Metadata> {
  const category = await getCategory(params.slug)
  const novelCount = await getNovelsCount(category.id)

  return generateCategoryMetadata({
    categoryName: category.name,
    categorySlug: category.slug,
    novelCount,
  })
}
```

### 章节页

```typescript
import { generateChapterMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }): Promise<Metadata> {
  const chapter = await getChapter(params.id)

  return generateChapterMetadata({
    novelTitle: chapter.novel.title,
    chapterTitle: chapter.title,
    chapterNumber: chapter.chapterNumber,
    novelSlug: chapter.novel.slug,
    chapterId: chapter.id,
    authorName: chapter.novel.authorName,
  })
}
```

## 验证和测试

### 1. Open Graph 验证

- **Facebook**: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- **LinkedIn**: [Post Inspector](https://www.linkedin.com/post-inspector/)
- **Twitter**: [Card Validator](https://cards-dev.twitter.com/validator)

### 2. 结构化数据验证

- **Google**: [Rich Results Test](https://search.google.com/test/rich-results)
- **Schema.org**: [Schema Markup Validator](https://validator.schema.org/)

### 3. SEO 综合检查

- [Lighthouse](https://developers.google.com/web/tools/lighthouse) (Chrome DevTools)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [SEO Site Checkup](https://seositecheckup.com/)

### 4. Sitemap 验证

访问 `https://your-domain.com/sitemap.xml` 确认：
- XML 格式正确
- 包含所有重要页面
- `lastModified` 日期正确

### 5. Robots.txt 验证

访问 `https://your-domain.com/robots.txt` 确认：
- 允许搜索引擎抓取公开页面
- 禁止抓取私有页面
- 正确引用 sitemap.xml

## 性能优化建议

### 1. 静态生成优先

确保重要页面使用 ISR（Incremental Static Regeneration）：

```typescript
export const revalidate = 3600 // 1小时重新生成
```

### 2. 图片优化

使用 Next.js Image 组件优化图片：
- 自动 WebP 转换
- 响应式图片
- 懒加载

### 3. 内部链接优化

- 确保所有小说、分类、章节页面有合理的内部链接
- 使用描述性链接文本
- 避免孤立页面

### 4. 移动端优化

- 响应式设计
- 快速加载时间（< 3 秒）
- 适合触摸的按钮尺寸

## 监控和分析

### Google Search Console

监控：
- 索引状态
- 搜索性能
- 爬取错误
- 移动可用性

### Google Analytics（可选）

安装 GA4 追踪：
- 页面浏览量
- 用户行为
- 转化率

## 常见问题

### Q: Sitemap 没有自动更新怎么办？

A: Sitemap 是动态生成的，每次访问 `/sitemap.xml` 都会查询数据库。如果部署到 Vercel，可能需要等待构建完成。

### Q: Open Graph 图片不显示？

A: 检查：
1. 图片路径是否正确（绝对 URL）
2. 图片尺寸是否符合规范（1200x630px）
3. 使用 Facebook Debugger 重新抓取

### Q: Google 没有索引我的页面？

A: 可能原因：
1. 新站需要时间（1-4 周）
2. 检查 robots.txt 是否禁止
3. 检查页面是否在 sitemap 中
4. 使用 Search Console 请求索引

### Q: 结构化数据验证失败？

A: 检查：
1. JSON-LD 语法是否正确
2. 必需字段是否完整
3. 日期格式是否符合 ISO 8601

## 进阶优化

### 1. 自定义 404 页面

创建 `src/app/not-found.tsx`：
```typescript
export default function NotFound() {
  return <div>Page not found</div>
}
```

### 2. Canonical URLs

已在元数据中自动配置：
```typescript
alternates: {
  canonical: pageUrl,
}
```

### 3. Hreflang（多语言支持）

如果支持多语言，在元数据中添加：
```typescript
alternates: {
  languages: {
    'en': '/en',
    'zh': '/zh',
  },
}
```

### 4. 面包屑导航

在页面中添加面包屑 Schema：
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [...]
}
```

## 参考资料

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Open Graph Protocol](https://ogp.me/)
- [Schema.org](https://schema.org/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
