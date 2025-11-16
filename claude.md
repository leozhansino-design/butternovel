# 🦋 ButterNovel - Claude 开发参考文档

> **快速参考**: 每次开发前必读,帮助 Claude 快速理解项目上下文

**最后更新**: 2025-11-16
**项目版本**: MVP v1.1 (性能优化完成)
**Redis优化**: 使用量降低91% ✅

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [数据库设计](#4-数据库设计)
5. [开发规范](#5-开发规范)
6. [API 路由](#6-api-路由)
7. [核心功能模块](#7-核心功能模块)
8. [缓存策略](#8-缓存策略) ⭐ NEW!
9. [常见任务参考](#9-常见任务参考)
10. [环境变量](#10-环境变量)
11. [已完成功能](#11-已完成功能)

---

## 1. 项目概述

### 1.1 项目定位

**ButterNovel** 是一个免费短篇小说阅读平台,集成了阅读、创作和社区互动功能。

**核心特征**:
- 免费短篇小说 (5,000-20,000 字)
- 移动优先设计
- 用户既是读者也可以成为作家
- 管理员后台管理所有内容

**三种角色**:
```
┌─────────────────────────────────────────┐
│ 读者 (默认)                             │
│ - 浏览/搜索小说                         │
│ - 阅读小说                              │
│ - 管理书架                              │
│ - 点赞/评论                             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 作家 (后期功能)                         │
│ - 创建/编辑小说                         │
│ - 管理章节                              │
│ - 查看统计数据                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 管理员 (独立后台)                       │
│ - 搜索/编辑所有小说                     │
│ - 上传小说                              │
│ - 管理章节                              │
│ - 封禁内容                              │
│ - 用户管理                              │
└─────────────────────────────────────────┘
```

### 1.2 产品特色

| 特性 | 说明 |
|------|------|
| **内容长度** | 5,000-20,000 字完整短篇 |
| **商业模式** | 完全免费 (未来广告变现) |
| **设计理念** | 移动优先 (Mobile First) |
| **用户身份** | 一个账号,多种角色 |
| **数据追踪** | 阅读进度自动保存 |

---

## 2. 技术栈

### 2.1 核心技术

```json
{
  "前端框架": "Next.js 16 (App Router)",
  "React版本": "19.2.0",
  "UI框架": "Tailwind CSS 4",
  "图标库": "Lucide React",
  "数据库": "Vercel Postgres (通过 Prisma ORM)",
  "身份验证": "NextAuth.js v5",
  "图片存储": "Cloudinary",
  "表单处理": "React Hook Form + Zod",
  "图表": "Recharts",
  "部署平台": "Vercel"
}
```

### 2.2 关键依赖

```json
{
  "dependencies": {
    "next": "16.0.1",
    "react": "19.2.0",
    "@prisma/client": "^6.18.0",
    "next-auth": "^5.0.0-beta.30",
    "cloudinary": "^2.8.0",
    "react-hook-form": "^7.66.0",
    "zod": "^4.1.12",
    "bcryptjs": "^3.0.3",
    "use-debounce": "^10.0.0"
  }
}
```

### 2.3 开发命令

```bash
npm run dev              # 启动开发服务器
npm run build            # 生产环境构建
npm run db:generate      # 生成 Prisma Client
npm run db:push          # 推送数据库 schema
npm run db:seed          # 种子分类数据
npm run db:seed-admin    # 创建管理员账户
npm run db:studio        # 打开 Prisma Studio
```

---

## 3. 项目结构

### 3.1 完整目录树

```
butternovel/
├── prisma/
│   └── schema.prisma          # 数据库 Schema
│
├── scripts/
│   ├── seed-categories.ts     # 分类种子数据
│   └── seed-admin-user.ts     # 管理员账户创建
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # 首页 (/)
│   │   ├── layout.tsx         # 根布局
│   │   │
│   │   ├── auth/              # 用户认证
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── novels/            # 小说模块
│   │   │   ├── [slug]/page.tsx                    # 小说详情
│   │   │   └── [slug]/chapters/[number]/page.tsx  # 章节阅读器
│   │   │
│   │   ├── admin/             # 管理员后台
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── profile/page.tsx
│   │   │   ├── novels/
│   │   │   │   ├── page.tsx   # 小说列表 (带搜索)
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── edit/page.tsx
│   │   │   │       └── chapters/
│   │   │   │           ├── new/page.tsx
│   │   │   │           └── [chapterId]/Edit/page.tsx
│   │   │
│   │   ├── admin-login/       # 管理员登录
│   │   │   └── page.tsx
│   │   │
│   │   └── api/               # API Routes
│   │       ├── auth/
│   │       ├── admin/
│   │       ├── library/
│   │       ├── profile/
│   │       ├── views/
│   │       └── reading-progress/
│   │
│   ├── components/
│   │   ├── shared/            # 公共组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── LibraryModal.tsx
│   │   │   ├── LoginModal.tsx
│   │   │   └── UserMenu.tsx
│   │   │
│   │   ├── admin/             # 管理员组件
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── NovelSearchBar.tsx
│   │   │   ├── NovelUploadForm.tsx
│   │   │   ├── EditNovelForm.tsx
│   │   │   ├── ChapterAddForm.tsx
│   │   │   ├── ChapterEditForm.tsx
│   │   │   ├── AdminProfileForm.tsx
│   │   │   ├── AvatarCropper.tsx
│   │   │   ├── BanButton.tsx
│   │   │   └── StatsCard.tsx
│   │   │
│   │   ├── front/             # 前台组件
│   │   │   ├── BookCard.tsx
│   │   │   ├── CategorySection.tsx
│   │   │   ├── FeaturedCarousel.tsx
│   │   │   └── NovelCover.tsx
│   │   │
│   │   ├── library/           # 书架组件
│   │   │   ├── MyLibrary.tsx
│   │   │   ├── LibrarySidebar.tsx
│   │   │   └── ProfileView.tsx
│   │   │
│   │   ├── reader/            # 阅读器组件
│   │   │   └── ChapterReader.tsx
│   │   │
│   │   ├── novel/             # 小说组件
│   │   │   └── AddToLibraryButton.tsx
│   │   │
│   │   └── auth/              # 认证组件
│   │       └── AuthModal.tsx
│   │
│   └── lib/                   # 工具库
│       ├── prisma.ts          # Prisma 客户端
│       ├── auth.ts            # NextAuth 配置
│       ├── admin-auth.ts      # 管理员认证
│       ├── cloudinary.ts      # Cloudinary 配置
│       ├── format.ts          # 格式化工具
│       ├── utils.ts           # 通用工具
│       ├── validate-env.ts    # 环境变量验证
│       └── view-tracker.ts    # 浏览量追踪
│
├── types/
│   └── next-auth.d.ts         # NextAuth 类型定义
│
├── README.md                  # 项目文档
├── claude.md                  # 本文件 (Claude 参考)
└── .env.local                 # 环境变量 (不提交)
```

### 3.2 重要文件说明

| 文件路径 | 用途 |
|---------|------|
| `src/lib/prisma.ts` | Prisma 客户端单例 |
| `src/lib/auth.ts` | NextAuth 用户认证配置 |
| `src/lib/admin-auth.ts` | 管理员认证工具 |
| `prisma/schema.prisma` | 数据库 Schema 定义 |
| `src/app/api/admin/` | 管理员 API 路由 |
| `src/components/admin/` | 管理员组件 |

---

## 4. 数据库设计

### 4.1 核心表结构

#### User (用户表)
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  password        String?
  name            String?
  avatar          String?
  avatarPublicId  String?  // Cloudinary Public ID
  bio             String?
  role            String   @default("USER")

  // OAuth
  googleId        String?  @unique
  facebookId      String?  @unique

  // 作家信息 (后期)
  isWriter        Boolean  @default(false)
  writerName      String?
  writerBio       String?

  // 状态
  isVerified      Boolean  @default(false)
  isActive        Boolean  @default(true)
  isBanned        Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // 关系
  library         Library[]
  readingHistory  ReadingHistory[]
  likes           NovelLike[]
  chapterProgress ChapterProgress[]
  comments        Comment[]
}
```

#### Novel (小说表)
```prisma
model Novel {
  id                  Int         @id @default(autoincrement())
  title               String
  slug                String      @unique
  coverImage          String
  coverImagePublicId  String?     // Cloudinary Public ID
  blurb               String      @db.Text

  // 作者
  authorId            String
  authorName          String      @default("ButterNovel Official")

  // 分类
  categoryId          Int
  category            Category    @relation(fields: [categoryId], references: [id])

  // 状态
  status              NovelStatus @default(ONGOING)
  isPublished         Boolean     @default(false)
  isDraft             Boolean     @default(true)

  // 审核
  isApproved          Boolean     @default(true)
  reviewNote          String?     @db.Text

  // 封禁功能
  isBanned            Boolean     @default(false)
  bannedUntil         DateTime?
  banReason           String?     @db.Text

  // 统计
  totalChapters       Int         @default(0)
  wordCount           Int         @default(0)
  viewCount           Int         @default(0)
  likeCount           Int         @default(0)
  commentCount        Int         @default(0)

  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
  publishedAt         DateTime?

  // 关系
  chapters            Chapter[]
  library             Library[]
  readingHistory      ReadingHistory[]
  likes               NovelLike[]
  comments            Comment[]
  views               NovelView[]
}

enum NovelStatus {
  ONGOING
  COMPLETED
}
```

#### Chapter (章节表)
```prisma
model Chapter {
  id            Int      @id @default(autoincrement())
  novelId       Int
  novel         Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)

  chapterNumber Int
  title         String
  slug          String
  content       String   @db.Text
  wordCount     Int      @default(0)
  isPublished   Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // 关系
  readingHistory  ReadingHistory[]
  chapterProgress ChapterProgress[]

  @@unique([novelId, chapterNumber])
  @@index([novelId, isPublished, chapterNumber])
}
```

#### Category (分类表)
```prisma
model Category {
  id     Int      @id @default(autoincrement())
  name   String   @unique
  slug   String   @unique
  icon   String?
  order  Int      @default(0)
  novels Novel[]
}
```

#### Library (书架表)
```prisma
model Library {
  id      String   @id @default(cuid())
  userId  String
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  novelId Int
  novel   Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  addedAt DateTime @default(now())

  @@unique([userId, novelId])
}
```

#### ReadingHistory (阅读历史)
```prisma
model ReadingHistory {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  novelId    Int
  novel      Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)
  chapterId  Int
  chapter    Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  lastReadAt DateTime @default(now())

  @@unique([userId, novelId])
}
```

#### ChapterProgress (章节阅读进度)
```prisma
model ChapterProgress {
  id             String   @id @default(cuid())
  userId         String
  chapterId      Int
  scrollPosition Int      @default(0)
  percentage     Int      @default(0)
  isCompleted    Boolean  @default(false)
  updatedAt      DateTime @updatedAt

  @@unique([userId, chapterId])
}
```

#### NovelView (浏览记录)
```prisma
model NovelView {
  id        Int      @id @default(autoincrement())
  novelId   Int
  novel     Novel    @relation(fields: [novelId], references: [id], onDelete: Cascade)

  userId    String?
  guestId   String?  // 游客标识

  ipAddress String?
  userAgent String?  @db.Text
  viewedAt  DateTime @default(now())
}
```

#### Admin (管理员表)
```prisma
model Admin {
  id       String    @id @default(cuid())
  email    String    @unique
  password String
  name     String
  role     AdminRole @default(MODERATOR)
  isActive Boolean   @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  MODERATOR
}
```

#### AdminProfile (管理员档案)
```prisma
model AdminProfile {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  displayName String   @default("Admin")
  bio         String?  @db.Text
  avatar      String?  @db.Text  // Base64 编码圆形头像

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4.2 关系图

```
User ──┬── Library (多对多 via Library) ─── Novel
       ├── ReadingHistory ─── Novel
       ├── ChapterProgress ─── Chapter
       ├── NovelLike ─── Novel
       └── Comment ─── Novel

Novel ──┬── Chapter (一对多)
        ├── Category (多对一)
        ├── Library
        ├── ReadingHistory
        ├── NovelLike
        ├── Comment
        └── NovelView

Admin (独立表,无关联)
AdminProfile (独立表,通过 email 关联 Admin)
```

---

## 5. 开发规范

### 5.1 代码规范

**命名约定**:
- 组件: PascalCase (`BookCard.tsx`)
- 工具函数: camelCase (`formatDate()`)
- 常量: UPPER_SNAKE_CASE (`API_URL`)
- 文件: kebab-case (page.tsx, layout.tsx)

**组件结构**:
```typescript
// 1. 导入
import { ... } from '...'

// 2. 类型定义
type Props = { ... }

// 3. 主组件
export default function Component({ ... }: Props) {
  // 状态
  const [state, setState] = useState()

  // 函数
  const handleAction = () => { ... }

  // 渲染
  return <div>...</div>
}
```

**Server Actions 约定**:
- 总是标记 `'use server'`
- 返回 `{ success: boolean, data?: any, error?: string }`
- 错误处理用 try-catch

**API 路由约定**:
- 使用 `NextResponse`
- 统一错误处理格式
- 管理员 API 需要认证检查

### 5.2 文件命名规范

| 类型 | 命名 | 示例 |
|------|------|------|
| 页面 | `page.tsx` | `app/admin/page.tsx` |
| 布局 | `layout.tsx` | `app/admin/layout.tsx` |
| 加载状态 | `loading.tsx` | `app/novels/[slug]/loading.tsx` |
| 404页面 | `not-found.tsx` | `app/novels/[slug]/not-found.tsx` |
| API路由 | `route.ts` | `app/api/admin/novels/route.ts` |
| 组件 | `PascalCase.tsx` | `BookCard.tsx` |
| 工具 | `kebab-case.ts` | `view-tracker.ts` |

### 5.3 Git 提交规范

```bash
feat: 新功能
fix: 修复 bug
refactor: 重构
docs: 文档更新
style: 样式调整
perf: 性能优化
test: 测试
chore: 构建/配置
```

**示例**:
```bash
git commit -m "feat: Library Modal 重构 + 头像上传 + 阅读进度追踪"
git commit -m "fix: 修复管理员登录 session 问题"
```

---

## 6. API 路由

### 6.1 用户认证 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 认证 |

### 6.2 管理员 API

| 路由 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/admin/login` | POST | 管理员登录 | ❌ |
| `/api/admin/logout` | POST | 管理员登出 | ✅ |
| `/api/admin/profile` | GET/PUT | 管理员档案 | ✅ |
| `/api/admin/stats` | GET | Dashboard 统计 | ✅ |
| `/api/admin/novels` | GET/POST | 小说列表/上传 | ✅ |
| `/api/admin/novels/[id]` | GET/PUT/DELETE | 小说详情/编辑/删除 | ✅ |
| `/api/admin/novels/[id]/ban` | POST | 封禁/解封小说 | ✅ |
| `/api/admin/chapters` | POST | 创建章节 | ✅ |
| `/api/admin/chapters/[id]` | GET/PUT/DELETE | 章节详情/编辑/删除 | ✅ |

### 6.3 书架 API

| 路由 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/library` | POST/DELETE | 添加/移除书架 | ✅ |
| `/api/library/check` | GET | 检查是否在书架 | ✅ |

### 6.4 用户档案 API

| 路由 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/profile` | PUT | 更新用户档案 | ✅ |
| `/api/profile/avatar` | POST | 上传头像 | ✅ |

### 6.5 阅读进度 API

| 路由 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/reading-progress` | POST | 保存阅读进度 | ✅ |

### 6.6 浏览追踪 API

| 路由 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/views/track` | POST | 追踪小说浏览 | ❌ |

---

## 7. 核心功能模块

### 7.1 管理员后台

**认证机制**:
- 独立于用户系统 (单独 Admin 表)
- 使用 JWT + Cookie Session
- `src/lib/admin-auth.ts` 提供认证工具

**核心功能**:
1. **Dashboard**: 统计数据展示
2. **小说管理**:
   - 搜索小说 (标题/作者)
   - 上传新小说
   - 编辑小说信息
   - 封禁/解封小说
3. **章节管理**:
   - 添加章节
   - 编辑章节
   - 删除章节
4. **个人档案**:
   - 修改名字
   - 上传圆形头像 (Base64)
   - 编辑简介

**关键文件**:
- `src/lib/admin-auth.ts` - 认证工具
- `src/app/admin/layout.tsx` - 管理员布局
- `src/components/admin/AdminHeader.tsx` - 顶部导航
- `src/components/admin/AdminSidebar.tsx` - 侧边栏
- `src/components/admin/NovelSearchBar.tsx` - 搜索栏

### 7.2 书架系统 (Library)

**功能**:
- 添加/移除小说到书架
- 查看书架列表
- 显示阅读进度
- 从书架继续阅读

**实现**:
- Modal 形式展示
- 支持游客和登录用户
- 游客使用 localStorage
- 用户使用数据库

**关键文件**:
- `src/components/shared/LibraryModal.tsx` - 书架弹窗
- `src/components/library/MyLibrary.tsx` - 书架内容
- `src/app/api/library/route.ts` - 书架 API

### 7.3 阅读进度追踪

**功能**:
- 自动保存阅读位置
- 记录最后阅读章节
- 从上次位置继续

**实现**:
- ChapterProgress 表记录进度
- ReadingHistory 表记录最后章节
- 客户端自动保存

**关键文件**:
- `src/components/reader/ChapterReader.tsx` - 阅读器
- `src/app/api/reading-progress/route.ts` - 进度 API
- `src/lib/view-tracker.ts` - 浏览追踪

### 7.4 浏览量统计

**功能**:
- 追踪小说浏览量
- 区分用户和游客
- 防止重复计数 (24小时内)

**实现**:
- NovelView 表记录
- guestId (IP + UserAgent hash)
- 定期清理旧数据

**关键文件**:
- `src/lib/view-tracker.ts` - 追踪工具
- `src/components/ViewTracker.tsx` - 客户端组件
- `src/app/api/views/track/route.ts` - API

### 7.5 封禁系统

**功能**:
- 封禁/解封小说
- 临时封禁 (指定到期时间)
- 永久封禁
- 封禁原因记录

**实现**:
- Novel 表的 `isBanned`, `bannedUntil`, `banReason` 字段
- 前台自动过滤被封禁内容
- 管理员可查看和管理

**关键文件**:
- `src/components/admin/BanButton.tsx` - 封禁按钮
- `src/app/api/admin/novels/[id]/ban/route.ts` - 封禁 API

---

## 8. 缓存策略 ⭐ 重要!

### 8.1 核心原则

**关键理解: ISR vs Redis**

项目经过深度优化,确立了清晰的缓存策略:

```
┌─────────────────────────────────────────────────────────┐
│ 公共页面 (Homepage, Category, Novels, 小说详情)         │
│ ✅ 使用: Next.js ISR (HTML缓存)                         │
│ ❌ 不用: Redis数据缓存                                  │
│ 原因: ISR已缓存完整HTML,双重缓存是冗余                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 用户特定数据 (Library, Profile, API)                    │
│ ✅ 使用: Redis缓存                                      │
│ ❌ 不用: ISR (每个用户数据不同,无法共享)                 │
│ 原因: 快速响应,减少DB查询                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 聚合数据 (Homepage首页数据)                              │
│ ✅ 使用: Redis缓存 + ISR                                │
│ 原因: 聚合多个数据源,减少DB压力                          │
└─────────────────────────────────────────────────────────┘
```

### 8.2 成本分析

**为什么这样设计?**

```
Supabase (你的数据库):
✅ 查询次数: 无限制
✅ 成本: 几乎为0
✅ 有完善的索引优化
→ 结论: 多用DB,不怕查询

Upstash Redis:
⚠️ Commands有限制 (免费10,000/天)
❌ 每次GET/SET都计数
❌ 这才是瓶颈所在
→ 结论: 节约使用Redis
```

**设计哲学: 让数据库多干活,让Redis少干活!**

### 8.3 实际应用

#### ✅ 公共页面 - 只用ISR

```typescript
// src/app/category/[slug]/page.tsx
export const revalidate = 1800  // 30分钟ISR

async function getCategoryWithNovels(slug: string) {
  // ❌ 不要用Redis缓存!
  // return await getOrSet('category:xxx', async () => { ... })

  // ✅ 直接查DB,让ISR缓存HTML
  const category = await prisma.category.findUnique({ where: { slug } })
  const novels = await prisma.$queryRaw`...`
  return { category, novels }
}

// 工作原理:
// 第1次访问 → 查DB → 渲染HTML → ISR缓存30分钟
// 第2-N次 (30分钟内) → 直接返回缓存HTML (0 Redis, 0 DB!)
// 30分钟后 → 重复第1步
```

#### ✅ 用户数据 - 用Redis

```typescript
// src/app/api/library/route.ts
export async function GET(request: NextRequest) {
  const session = await auth()

  // ✅ 用户特定数据,用Redis缓存
  const novels = await getOrSet(
    CacheKeys.USER_LIBRARY(session.user.id),
    async () => {
      return await prisma.library.findMany({
        where: { userId: session.user.id }
      })
    },
    CacheTTL.USER_LIBRARY
  )

  return NextResponse.json({ novels })
}

// 工作原理:
// - 每个用户数据不同,无法用ISR
// - Redis 5分钟TTL,快速响应
```

#### ✅ 聚合数据 - Redis + ISR

```typescript
// src/lib/cache-optimized.ts
export async function getHomePageData(): Promise<HomePageData> {
  // ✅ 首页聚合多个数据源,用Redis减少DB压力
  return await getOrSet(
    'home:all-data',
    async () => {
      // 聚合: featured novels + all categories + stats
      const [featured, categories, stats] = await Promise.all([
        prisma.novel.findMany({ where: { isFeatured: true } }),
        prisma.category.findMany(),
        getStats()
      ])
      return { featured, categories, stats }
    },
    CacheTTL.HOME_FEATURED  // 1小时
  )
}

// 工作原理:
// - Redis缓存数据 (1小时)
// - ISR缓存HTML (1小时)
// - 双重缓存保护DB
```

### 8.4 优化效果

| 页面类型 | 之前 | 现在 | 降低 |
|---------|------|------|------|
| Category页面 | 1440次Redis/天 | 0次 | -100% |
| Novels列表 | 96次/天 | 0次 | -100% |
| 小说详情 | 960次/天 | 0次 | -100% |
| 首页 | 50次/天 | 50次/天 | - |
| Library API | 200次/天 | 200次/天 | - |
| **总计** | **2746次/天** | **250次/天** | **-91%** |

### 8.5 开发注意事项

**添加新页面时,问自己:**

1. **这是公共页面吗?** (所有用户看到相同内容)
   - YES → 只用ISR,不用Redis
   - NO → 继续下一步

2. **这是用户特定数据吗?** (每个用户不同)
   - YES → 用Redis缓存
   - NO → 继续下一步

3. **这是聚合多个数据源吗?**
   - YES → Redis + ISR
   - NO → 只用ISR

**关键文件:**
- `src/lib/cache.ts` - Redis缓存工具
- `src/lib/cache-optimized.ts` - 首页数据缓存
- `src/lib/redis-monitor.ts` - Redis监控系统
- `src/app/api/redis-monitor/route.ts` - 监控API

**监控Redis使用:**
```bash
# 查看Redis统计
GET /api/redis-monitor?action=stats

# 查看调用日志
GET /api/redis-monitor?action=logs&limit=100
```

---

## 9. 常见任务参考

### 9.1 添加新的 API 路由

```typescript
// src/app/api/my-route/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.novel.findMany()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch' },
      { status: 500 }
    )
  }
}
```

### 9.2 创建新页面

```typescript
// src/app/my-page/page.tsx
import { prisma } from '@/lib/prisma'

export default async function MyPage() {
  const data = await prisma.novel.findMany()

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">My Page</h1>
      {/* 内容 */}
    </div>
  )
}
```

### 9.3 添加管理员页面

需要包含认证检查:

```typescript
// src/app/admin/my-page/page.tsx
import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin-login')
  }

  return <div>Admin Content</div>
}
```

### 9.4 数据库迁移

```bash
# 1. 修改 prisma/schema.prisma
# 2. 生成 Prisma Client
npm run db:generate

# 3. 推送到数据库 (开发环境)
npm run db:push

# 4. 检查
npm run db:studio
```

### 9.5 上传图片到 Cloudinary

```typescript
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

export async function uploadImage(file: File, folder: string) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(buffer)
  })
}
```

### 9.6 创建管理员账户

```bash
# 使用脚本创建
npm run db:seed-admin

# 或手动在 Prisma Studio 中创建
npm run db:studio
# 密码需要使用 bcrypt 加密
```

---

## 10. 环境变量

### 10.1 必需的环境变量

```bash
# .env.local

# 数据库
DATABASE_URL="postgresql://..."

# NextAuth (用户认证)
AUTH_SECRET="your-nextauth-secret"  # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary (图片存储)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# 管理员 JWT
ADMIN_JWT_SECRET="your-admin-jwt-secret"  # openssl rand -base64 32
```

### 10.2 可选的环境变量

```bash
# Google OAuth (如果使用)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# 开发模式
NODE_ENV="development"
```

---

## 11. 已完成功能

### 11.1 MVP 核心功能 ✅

- [x] **用户系统**
  - [x] 注册/登录
  - [x] Google OAuth
  - [x] 用户档案
  - [x] 头像上传

- [x] **管理员后台**
  - [x] 独立登录系统
  - [x] Dashboard 统计
  - [x] 小说搜索
  - [x] 小说上传
  - [x] 小说编辑
  - [x] 章节管理
  - [x] 封禁功能
  - [x] 个人档案编辑
  - [x] 圆形头像上传

- [x] **读者功能**
  - [x] 首页展示
  - [x] 分类浏览
  - [x] 小说详情页
  - [x] 章节阅读器
  - [x] 书架系统 (Library Modal)
  - [x] 阅读进度追踪
  - [x] 浏览量统计
  - [x] 点赞功能

- [x] **性能优化**
  - [x] 图片懒加载
  - [x] 数据库索引
  - [x] 组件代码分割
  - [x] 防抖搜索

### 11.2 待开发功能 ⏳

- [ ] **评论系统**
  - [ ] 发布评论
  - [ ] 显示评论列表
  - [ ] 删除自己的评论

- [ ] **作家模式** (后期)
  - [ ] 作家引导页
  - [ ] 创建小说
  - [ ] 管理自己的作品

- [ ] **社区功能** (后期)
  - [ ] 书荒求助帖
  - [ ] 书单推荐
  - [ ] 拯救书荒统计

- [ ] **私信系统** (后期)

- [ ] **标签系统** (后期)

---

## 🚨 重要提醒

### 开发前必读

1. **管理员认证**:
   - 管理员系统独立于用户系统
   - 使用 `getAdminSession()` 检查认证
   - 登录路由: `/admin-login`

2. **图片上传**:
   - 使用 Cloudinary
   - 记录 `publicId` 用于删除
   - 头像限制: 5MB, 正方形裁剪

3. **数据库操作**:
   - 总是使用 Prisma Client
   - 注意索引性能
   - Cascade 删除关系

4. **错误处理**:
   - API 返回统一格式
   - 使用 Toast 提示用户
   - 记录错误日志

5. **性能考虑**:
   - 分页查询 (pageSize: 20)
   - 图片压缩
   - 数据库查询优化

---

## 📝 开发建议

### Claude 使用这个文档时

1. **开始任务前**:
   - 检查相关模块的文件位置
   - 了解数据库表结构
   - 查看 API 路由约定

2. **实现新功能时**:
   - 参考已有的类似功能
   - 遵循代码规范
   - 更新本文档

3. **调试问题时**:
   - 检查环境变量
   - 查看数据库结构
   - 确认认证状态

4. **提交代码前**:
   - 测试功能完整性
   - 检查错误处理
   - 更新文档

---

**文档维护**: 每次重大功能更新后,请同步更新本文档
**最后更新**: 2025-11-11
**维护者**: Claude + Leo

**🦋 让阅读更轻松,让创作更简单**
