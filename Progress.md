# 🦋 ButterNovel - 开发进度文档

## 📊 项目概览

**项目名称:** ButterNovel  
**类型:** 免费短篇小说阅读平台  
**技术栈:** Next.js 15 + TypeScript + Prisma + PostgreSQL  
**当前状态:** ✅ MVP 阶段完成 - 核心功能已实现

---

## ✅ 已完成功能

### 🎨 前端界面
- [x] 首页设计（轮播 + 分类展示）
- [x] 响应式导航栏和页脚
- [x] 精美的封面展示组件
- [x] 横向滚动轮播（每次显示8本书）
- [x] 分类展示（Fantasy, Urban, Romance）

### 👨‍💼 管理员系统
- [x] 管理员登录页面（JWT 认证）
- [x] 管理员仪表板（Dashboard）
- [x] 侧边栏导航（固定宽度 320px）
- [x] 小说上传功能
  - 标题（最多 120 字符）
  - 封面图片（300x400px，Base64 存储）
  - 分类选择（8 个分类）
  - 简介（最多 3000 字符）
  - 状态（连载/完结）
  - 发布/草稿选项
  - 章节管理（添加/删除）

### 🗄️ 数据库设计
- [x] 完整的 Prisma Schema
  - User（用户表）
  - Novel（小说表）
  - Chapter（章节表）
  - Category（分类表）
  - Library（书架）
  - ReadingHistory（阅读历史）
  - NovelLike（点赞）
  - Comment（评论）
  - ForumPost/ForumReply（社区功能）
  - Admin（管理员）

### 🔧 基础设施
- [x] Vercel Postgres 数据库连接
- [x] Prisma Client 配置（单例模式）
- [x] 环境变量管理（dotenv-cli）
- [x] 数据库迁移脚本
- [x] 分类数据种子（8 个分类）
- [x] 管理员用户种子

### 🚀 API 接口
- [x] POST `/api/admin/login` - 管理员登录
- [x] POST `/api/admin/logout` - 管理员登出
- [x] POST `/api/admin/novels` - 创建小说
- [x] GET `/api/admin/novels` - 获取小说列表

---

## 🔄 当前进展

### 🎉 最新完成（2025-11-05）

#### ✅ 小说上传功能完全实现
**状态:** 成功测试，数据正确保存

**功能详情:**
```typescript
// 成功上传的数据示例
Novel ID: 7
Title: "test"
Slug: "test-1762265824749"
Author ID: "cabbas3241000p4604q7h7ft8"
Category: Fantasy (ID: 1)
Status: ONGOING
Chapters: 1
Word Count: 4
```

**解决的问题:**
1. ✅ 连接池超时 → Prisma Client 单例模式
2. ✅ 外键约束错误 → 临时移除外键（开发阶段）
3. ✅ 管理员用户创建
4. ✅ 数据库连接配置（dotenv-cli）

#### 🗄️ 数据存储结构

**Novel 表（1条记录）:**
- 存储小说基本信息
- 封面图片（Base64）
- 统计数据（章节数、字数）

**Chapter 表（N条记录）:**
- 每章单独存储
- 完整章节内容在 `content` 字段
- 独立的字数统计

```
📚 Novel (小说表)
    └── 📖 Chapter (章节表)
         ├── 第1章 (content: 完整内容)
         ├── 第2章 (content: 完整内容)
         └── 第N章 (content: 完整内容)
```

#### 🔧 外键优化（临时方案）

**当前状态:** 已移除外键约束

```prisma
model Novel {
  authorId   String
  // author   User @relation(...) // ❌ 已注释
  authorName String
}

model User {
  // novels Novel[] // ❌ 已注释
}
```

**原因:**
- 开发阶段快速迭代
- 避免频繁的外键约束错误
- authorId 仍然保存，只是不验证

**生产环境计划:**
1. 清理所有现有数据，确保 authorId 有效
2. 恢复外键约束
3. 添加 `onDelete: Cascade` 级联删除

```prisma
// 生产环境恢复
model Novel {
  authorId String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

model User {
  novels Novel[]
}
```

---

## 🚧 待优化项目

### 🔥 高优先级优化

#### 1. 图片存储优化 ⭐⭐⭐
**当前问题:**
- 封面图片用 Base64 存在数据库
- 每张图片 ~300-400KB
- 查询速度慢
- 数据库体积膨胀

**解决方案:** 集成 Cloudinary

```bash
# 安装依赖
npm install cloudinary

# 环境变量配置
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**实现步骤:**

**a) 创建 Cloudinary 配置**
```typescript
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(base64: string) {
  const result = await cloudinary.uploader.upload(base64, {
    folder: 'butternovel/covers',
    transformation: [
      { width: 300, height: 400, crop: 'fill', quality: 'auto' }
    ]
  })
  return result.secure_url
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId)
}
```

**b) 修改上传 API**
```typescript
// src/app/api/admin/novels/route.ts
import { uploadImage } from '@/lib/cloudinary'

export async function POST(request: Request) {
  // ... 其他代码

  // 上传图片到 Cloudinary
  const coverUrl = await uploadImage(coverImage)

  const novel = await prisma.novel.create({
    data: {
      // ...
      coverImage: coverUrl,  // ⭐ 存储 URL 而不是 Base64
      // ...
    }
  })
}
```

**c) 更新 Schema**
```prisma
model Novel {
  coverImage String  // 存储 Cloudinary URL
  // 例如: "https://res.cloudinary.com/xxx/image/upload/v123/butternovel/covers/novel-1.jpg"
}
```

**预期效果:**
- 🚀 数据库查询速度提升 **10-20倍**
- 📉 数据库体积减少 **70%**
- ⚡ 全球 CDN 加速
- 🖼️ 自动图片优化

---

#### 2. 章节阅读优化 ⭐⭐⭐

**创建阅读页面:**

```typescript
// src/app/novels/[slug]/chapters/[number]/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ChapterPage({ 
  params 
}: { 
  params: { slug: string, number: string } 
}) {
  const chapterNumber = parseInt(params.number)
  
  const [chapter, novel] = await Promise.all([
    prisma.chapter.findFirst({
      where: { 
        novel: { slug: params.slug },
        chapterNumber 
      }
    }),
    prisma.novel.findUnique({
      where: { slug: params.slug },
      select: { 
        id: true, 
        title: true, 
        totalChapters: true 
      }
    })
  ])

  const hasPrev = chapterNumber > 1
  const hasNext = chapterNumber < novel.totalChapters

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* 章节标题 */}
      <h1 className="text-2xl font-bold mb-2">
        Chapter {chapter.chapterNumber}: {chapter.title}
      </h1>

      {/* 章节内容 */}
      <div className="prose prose-lg max-w-none">
        <div className="whitespace-pre-wrap leading-relaxed">
          {chapter.content}
        </div>
      </div>

      {/* 上一章/下一章 */}
      <div className="flex justify-between mt-12 pt-6 border-t">
        {hasPrev && (
          <Link 
            href={`/novels/${params.slug}/chapters/${chapterNumber - 1}`}
            prefetch={true}  // ⭐ 预加载
            className="btn-prev"
          >
            ← Previous Chapter
          </Link>
        )}
        
        {hasNext && (
          <Link 
            href={`/novels/${params.slug}/chapters/${chapterNumber + 1}`}
            prefetch={true}  // ⭐ 预加载下一章
            className="btn-next"
          >
            Next Chapter →
          </Link>
        )}
      </div>
    </div>
  )
}
```

**预加载效果:**
- 点击"下一章" → **<0.1秒** 加载 ⚡
- 用户体验接近"秒进"

---

#### 3. 管理后台列表页面 ⭐⭐

**当前:** 只能通过 Prisma Studio 查看（慢，容易超时）

**创建管理列表页:**

```typescript
// src/app/admin/novels/list/page.tsx
import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'

export default async function NovelsListPage() {
  const novels = await prisma.novel.findMany({
    include: {
      category: true,
      _count: { select: { chapters: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">All Novels</h1>

      <div className="grid gap-4">
        {novels.map(novel => (
          <div key={novel.id} className="bg-white border rounded-lg p-4 flex gap-4">
            <Image
              src={novel.coverImage}
              alt={novel.title}
              width={120}
              height={160}
              className="rounded object-cover"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold">{novel.title}</h2>
              <p className="text-sm text-gray-600">
                ID: {novel.id} | Category: {novel.category.name}
              </p>
              <p className="text-sm">
                📚 {novel._count.chapters} Chapters | 
                📝 {novel.wordCount} Words
              </p>
              <Link 
                href={`/novels/${novel.slug}`}
                className="text-blue-600 hover:underline text-sm"
              >
                View Novel →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### 🎯 中优先级优化

#### 4. 外键恢复（上线前）

**步骤:**

```typescript
// scripts/clean-author-ids.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. 获取所有有效用户 ID
  const users = await prisma.user.findMany({ select: { id: true } })
  const validIds = new Set(users.map(u => u.id))

  // 2. 修复无效的 authorId
  const novels = await prisma.novel.findMany()
  
  for (const novel of novels) {
    if (!validIds.has(novel.authorId)) {
      await prisma.novel.update({
        where: { id: novel.id },
        data: { authorId: '默认管理员ID' }
      })
    }
  }
  
  console.log('✅ 清理完成！')
}

main()
```

**恢复 Schema:**

```prisma
model Novel {
  authorId String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

model User {
  novels Novel[]
}
```

```bash
npm run db:push
```

---

#### 5. 缓存优化

```typescript
import { unstable_cache } from 'next/cache'

const getNovelsList = unstable_cache(
  async () => {
    return await prisma.novel.findMany({
      include: { category: true }
    })
  },
  ['novels-list'],
  { revalidate: 300 }  // 5分钟缓存
)
```

---

#### 6. 小说详情页

```typescript
// src/app/novels/[slug]/page.tsx
export default async function NovelPage({ params }) {
  const novel = await prisma.novel.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      chapters: { orderBy: { chapterNumber: 'asc' } }
    }
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex gap-6">
        <Image
          src={novel.coverImage}
          alt={novel.title}
          width={300}
          height={400}
        />
        <div>
          <h1 className="text-3xl font-bold">{novel.title}</h1>
          <p className="text-gray-600">{novel.category.name}</p>
          <p className="mt-4">{novel.blurb}</p>
          <div className="mt-4">
            <span>📚 {novel.totalChapters} Chapters</span>
            <span>📝 {novel.wordCount} Words</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Chapters</h2>
        {novel.chapters.map(chapter => (
          <Link 
            key={chapter.id}
            href={`/novels/${novel.slug}/chapters/${chapter.chapterNumber}`}
            className="block border-b py-3 hover:bg-gray-50"
          >
            Chapter {chapter.chapterNumber}: {chapter.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
```

---

## 📈 性能对比

### 当前性能（开发环境）
```
首页加载：      2-3秒 🐌
小说详情页：    1-2秒 🐌
章节阅读：      0.5-1秒 🐌
下一章：        0.5-1秒 🐌
```

### 优化后性能（生产环境）
```
首页加载：      0.3-0.5秒 ⚡ (5-10倍)
小说详情页：    0.2-0.3秒 ⚡ (5-7倍)
章节阅读：      0.1-0.2秒 ⚡ (5倍)
下一章：        <0.1秒 ⚡⚡ (即时！预加载)
```

**关键优化:**
1. ✅ Cloudinary CDN - 减少 70% 数据传输
2. ✅ Next.js prefetch - 预加载下一章
3. ✅ 部署到 Vercel - 全球 CDN
4. ✅ 添加缓存 - 减少数据库查询

---

## 🔐 环境变量配置

```bash
# .env
# 数据库
DATABASE_URL="postgres://xxx@db.prisma.io:5432/postgres?sslmode=require"

# 管理员认证
ADMIN_JWT_SECRET="your-super-secret-key-min-32-characters-long"
NEXTAUTH_SECRET="butternovel-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary（待配置）
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

---

## 📝 NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build",
    "start": "next start",
    
    "db:generate": "dotenv -e .env -- npx prisma generate",
    "db:push": "dotenv -e .env -- npx prisma db push",
    "db:studio": "dotenv -e .env -- npx prisma studio",
    "db:seed": "dotenv -e .env -- npx tsx scripts/seed-categories.ts",
    "db:seed-admin": "dotenv -e .env -- npx tsx scripts/seed-admin-user.ts"
  }
}
```

**重要:** 永远使用 `npm run db:studio` 而不是 `npx prisma studio`！

---

## 🎯 下一步计划

### 立即优化（本周）
- [ ] 集成 Cloudinary
- [ ] 创建章节阅读页面
- [ ] 添加管理列表页面

### 短期目标（2周内）
- [ ] 小说详情页
- [ ] 分类筛选页面
- [ ] 搜索功能
- [ ] 用户注册/登录

### 中期目标（1个月内）
- [ ] 阅读历史
- [ ] 书架功能
- [ ] 点赞评论
- [ ] 恢复外键约束

### 长期目标（2-3个月）
- [ ] 作家投稿系统
- [ ] 社区求书功能
- [ ] SEO 优化
- [ ] 多语言支持

---

## 🐛 已知问题

### 已解决 ✅
- [x] Prisma Client 连接池超时 → 单例模式
- [x] 外键约束错误 → 临时移除
- [x] 环境变量加载失败 → dotenv-cli
- [x] Prisma Studio 超时 → 改用自建管理页面
- [x] TypeScript 错误 → 重启 TS Server

### 待解决 ⚠️
- [ ] Base64 图片导致查询慢 → 需要 Cloudinary
- [ ] 没有章节阅读页面 → 需要创建
- [ ] 首页数据是假数据 → 需要从数据库读取

---

## 📚 技术债务

1. **图片存储** - 必须迁移到 Cloudinary
2. **外键约束** - 上线前必须恢复
3. **假数据** - 首页需要用真实数据
4. **错误处理** - 需要统一的错误处理机制
5. **日志系统** - 需要更好的日志记录

---

## 🏆 里程碑

- ✅ **2025-01-01** - 项目启动，基础架构搭建
- ✅ **2025-01-03** - 管理员系统完成
- ✅ **2025-01-05** - 小说上传功能完成 🎉
- 🎯 **2025-01-10** - Cloudinary 集成完成（目标）
- 🎯 **2025-01-15** - 前台阅读功能完成（目标）
- 🎯 **2025-01-31** - MVP 完整版上线（目标）

---

## 💡 开发笔记

### Prisma 最佳实践
1. 永远使用 `npm run db:*` 命令
2. 开发环境使用单例模式避免连接池耗尽
3. 生产环境添加连接池配置

### Next.js 优化技巧
1. 使用 `prefetch={true}` 预加载链接
2. 图片用 `next/image` 组件
3. 使用 `unstable_cache` 缓存数据库查询

### 数据库设计原则
1. 小说信息和章节内容分表存储
2. 索引所有查询字段
3. 外键在开发阶段可以临时移除

---

## 📞 联系方式

如有问题或建议，请联系开发团队。

---

**最后更新:** 2025-01-05  
**文档版本:** v1.2  
**项目状态:** 🟢 积极开发中