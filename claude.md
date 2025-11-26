# 🦋 ButterNovel - Claude 开发参考文档

> **快速参考**: 每次开发前必读,帮助 Claude 快速理解项目上下文

**最后更新**: 2025-11-26
**项目版本**: MVP v2.0 (终极简化完成)
**架构**: ISR + Supabase (完全移除Redis) ✨
**下一阶段**: 付费系统 + 反爬虫

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [数据库设计](#4-数据库设计)
5. [开发规范](#5-开发规范)
6. [API 路由](#6-api-路由)
7. [核心功能模块](#7-核心功能模块)
8. [缓存策略](#8-缓存策略)
9. [常见任务参考](#9-常见任务参考)
10. [环境变量](#10-环境变量)
11. [已完成功能](#11-已完成功能)
12. [测试指南](#12-测试指南)
13. [付费系统规划](#13-付费系统规划-重要) ⭐ NEW!

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

### 6.7 评论/回复 API ⭐ 重要!

#### 段落评论 API

| 路由 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/paragraph-comments` | GET | 获取段落评论 | ❌ |
| `/api/paragraph-comments` | POST | 发表段落评论 | ✅ |
| `/api/paragraph-comments/[id]` | DELETE | 删除评论 | ✅ |
| `/api/paragraph-comments/[id]/like` | POST | 点赞评论 | ❌ |
| `/api/paragraph-comments/[id]/replies` | GET | 获取评论回复 | ❌ |
| `/api/paragraph-comments/[id]/replies` | POST | 回复评论 | ✅ |

#### 评分回复 API

| 路由 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/ratings/[id]/replies` | GET | 获取评分回复 | ❌ |
| `/api/ratings/[id]/replies` | POST | 回复评分 | ✅ |

#### ⚠️ 关键实现细节

**ParagraphComment 和 Rating 的 Schema 区别**:

```typescript
// ❌ 错误: ParagraphComment 没有 novel/chapter 关系
const parentComment = await prisma.paragraphComment.findUnique({
  where: { id: parentId },
  include: {
    novel: { ... },      // ❌ Schema中不存在
    chapter: { ... },    // ❌ Schema中不存在
  }
})

// ✅ 正确: 只查询实际存在的字段
const parentComment = await prisma.paragraphComment.findUnique({
  where: { id: parentId },
  select: {
    id: true,
    novelId: true,      // ✅ Int字段
    chapterId: true,    // ✅ Int字段
    paragraphIndex: true,
    userId: true,
  }
})

// ✅ 如果需要 novel/chapter 信息，单独查询
const [novel, chapter] = await Promise.all([
  prisma.novel.findUnique({
    where: { id: parentComment.novelId },
    select: { slug: true }
  }),
  prisma.chapter.findUnique({
    where: { id: parentComment.chapterId },
    select: { chapterNumber: true }
  })
])
```

**Rating 有 novel 关系**:

```typescript
// ✅ 正确: Rating 有 novel 关系
const rating = await prisma.rating.findUnique({
  where: { id: ratingId },
  include: {
    novel: {            // ✅ Schema中存在
      select: {
        id: true,
        slug: true,
      }
    }
  }
})
```

**参数类型转换最佳实践**:

```typescript
// ✅ 安全的类型转换
// 1. 先检查 null/undefined
if (novelId === null || novelId === undefined) {
  return error('Missing parameter')
}

// 2. 安全转换
const novelIdNum = typeof novelId === 'number'
  ? novelId
  : parseInt(String(novelId), 10)

// 3. 检查 NaN
if (isNaN(novelIdNum)) {
  return error('Invalid number')
}
```

**为什么这很重要**:
- ParagraphComment schema 中只有 `novelId` (Int) 和 `chapterId` (Int)，**没有关系字段**
- 如果尝试使用 `include: { novel: ... }`，Prisma 会报错: `Invalid invocation`
- Rating schema 中**有** `novel` 关系，所以可以使用 `include`
- 参数可能是 `number` 或 `string` 类型，必须安全转换

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

**终极架构: ISR + Supabase (完全移除Redis)**

项目经过三轮深度优化,采用极简架构:

```
┌────────────────────────────────────────────────────────┐
│ 所有公共页面 (Homepage, Category, Novels, 小说详情)    │
│ ✅ 使用: Next.js ISR (HTML缓存)                        │
│ ❌ 不用: Redis                                         │
│ 原因: ISR已缓存完整HTML,足够快速                       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ 所有API endpoints (Library, Profile, etc)             │
│ ✅ 使用: 直接查询Supabase                              │
│ ❌ 不用: Redis                                         │
│ 原因: Supabase查询无限制,性能完全够用                  │
└────────────────────────────────────────────────────────┘
```

### 8.2 为什么完全移除Redis?

**成本分析:**

```
Supabase (你的数据库):
✅ 查询次数: 无限制
✅ 成本: 几乎为0
✅ 性能: ~100-200ms/查询
✅ 有完善的索引优化
→ 结论: 完全够用,不需要Redis!

Redis (Upstash):
⚠️ Commands有限制 (免费10,000/天)
❌ 需要额外管理
❌ 增加架构复杂度
❌ ISR期间完全用不到
→ 结论: 不值得使用!
```

**设计哲学: 极简架构 - ISR + Supabase = 完美组合!**

### 8.3 实际应用

#### ✅ 公共页面 - 只用ISR

```typescript
// src/app/category/[slug]/page.tsx
export const revalidate = 1800  // 30分钟ISR

async function getCategoryWithNovels(slug: string) {
  // ✅ 直接查DB,让ISR缓存HTML
  const category = await prisma.category.findUnique({ where: { slug } })
  const novels = await prisma.$queryRaw`...`
  return { category, novels }
}

// 工作原理:
// 第1次访问 → 查DB → 渲染HTML → ISR缓存30分钟
// 第2-N次 (30分钟内) → 直接返回缓存HTML (0 DB!)
// 30分钟后 → 重复第1步
```

#### ✅ 首页数据 - 直接查DB + ISR

```typescript
// src/lib/cache-optimized.ts
export async function getHomePageData(): Promise<HomePageData> {
  // ✅ 直接查DB,ISR缓存HTML (1小时)
  const [featured, categories] = await Promise.all([
    prisma.novel.findMany({ where: { isFeatured: true } }),
    prisma.category.findMany()
  ])

  // 聚合数据
  return { featured, categories, categoryNovels }
}

// 工作原理:
// - 每小时只查询DB一次
// - ISR缓存HTML保护性能
// - 无需Redis复杂度
```

#### ✅ API Endpoints - 直接查DB

```typescript
// src/app/api/library/route.ts
export async function GET(request: NextRequest) {
  const session = await auth()

  // ✅ 直接查DB,性能完全够用 (~100ms)
  const novels = await prisma.library.findMany({
    where: { userId: session.user.id }
  })

  return NextResponse.json({ novels })
}

// 工作原理:
// - 每次查询DB (~100ms)
// - 使用频率低 (每用户每天3次)
// - Supabase查询无限制
// - 无需Redis缓存
```

### 8.4 性能数据

**10,000 DAU场景预估:**

| 类型 | 频率 | DB查询/天 |
|------|------|----------|
| 首页 ISR revalidate | 24次/天 | 24次 |
| Category页面 | 48次/天 × 15个 | 720次 |
| Novels详情 | 48次/天 × 20本 | 960次 |
| Library API | 100用户 × 3次 | 300次 |
| **总计** | - | **~2000次** |

**Supabase完全够用:**
- ✅ 查询次数: 无限制
- ✅ 性能: 有索引优化
- ✅ 成本: $0

### 8.5 开发指南

**添加新功能时:**

1. **这是公共页面吗?**
   - YES → 使用ISR,设置revalidate
   - NO → 继续

2. **这是API endpoint吗?**
   - YES → 直接查DB,无需缓存
   - NO → 根据具体情况

**关键文件:**
- `src/lib/cache-optimized.ts` - 首页数据获取
- `src/app/api/library/route.ts` - Library API示例
- ~~`src/lib/redis.ts`~~ - 已移除
- ~~`src/lib/redis-monitor.ts`~~ - 已移除

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

## 13. 付费系统规划 ⭐ 重要!

> **目标**: 实现小说内容付费机制，支持免费区域和付费区域，作家可自主定价

### 13.1 商业模式设计

```
┌────────────────────────────────────────────────────────────┐
│                    内容分层模式                              │
├────────────────────────────────────────────────────────────┤
│ 免费章节 (前5章左右)                                        │
│ ├── 任何人可阅读                                           │
│ ├── 吸引读者入坑                                           │
│ └── 展示内容质量                                           │
├────────────────────────────────────────────────────────────┤
│ 付费章节 (第6章起)                                          │
│ ├── 需要购买/订阅                                          │
│ ├── 防止爬虫抓取                                           │
│ └── 作家获得分成                                           │
└────────────────────────────────────────────────────────────┘
```

**定价策略** (USD - US/EU Market):
```
┌─────────────────────────────────────────────────────────────┐
│ Chapter Price Range: $0.10 - $1.00 USD (platform limit)     │
│ Suggested pricing:                                          │
│   - Short chapters (<3000 chars): $0.10 - $0.30            │
│   - Medium chapters (3000-6000 chars): $0.30 - $0.50       │
│   - Long chapters (>6000 chars): $0.50 - $1.00             │
│                                                             │
│ Revenue Split: Writer 70% / Platform 30%                    │
│                                                             │
│ Note: Stripe processing fees (~2.9% + $0.30) are absorbed  │
│ by the platform, not deducted from writer earnings.         │
└─────────────────────────────────────────────────────────────┘
```

### 13.2 数据库设计

#### 新增表结构

```prisma
// 用户钱包
model UserWallet {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  balance      Decimal  @default(0) @db.Decimal(10, 2)  // 余额 (元)
  totalSpent   Decimal  @default(0) @db.Decimal(10, 2)  // 累计消费

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 关系
  transactions WalletTransaction[]
  purchases    ChapterPurchase[]
}

// 钱包交易记录
model WalletTransaction {
  id           String          @id @default(cuid())
  walletId     String
  wallet       UserWallet      @relation(fields: [walletId], references: [id], onDelete: Cascade)

  type         TransactionType // RECHARGE(充值) / PURCHASE(购买) / REWARD(打赏) / WITHDRAW(提现)
  amount       Decimal         @db.Decimal(10, 2)
  description  String?

  // 支付信息 (充值时)
  paymentMethod String?        // WECHAT / ALIPAY
  paymentId     String?        // 第三方支付订单号

  createdAt    DateTime @default(now())

  @@index([walletId, createdAt])
}

enum TransactionType {
  RECHARGE    // 充值
  PURCHASE    // 购买章节
  REWARD      // 打赏作家
  WITHDRAW    // 提现
  REFUND      // 退款
}

// 章节购买记录
model ChapterPurchase {
  id           String     @id @default(cuid())
  userId       String
  walletId     String
  wallet       UserWallet @relation(fields: [walletId], references: [id])

  novelId      Int
  novel        Novel      @relation(fields: [novelId], references: [id])
  chapterId    Int
  chapter      Chapter    @relation(fields: [chapterId], references: [id])

  price        Decimal    @db.Decimal(10, 2)  // 购买时价格
  purchasedAt  DateTime   @default(now())

  @@unique([userId, chapterId])
  @@index([userId, novelId])
}

// 作家收益
model WriterEarnings {
  id           String   @id @default(cuid())
  userId       String   // 作家用户ID
  user         User     @relation(fields: [userId], references: [id])

  totalEarned  Decimal  @default(0) @db.Decimal(10, 2)  // 累计收益
  withdrawn    Decimal  @default(0) @db.Decimal(10, 2)  // 已提现
  pending      Decimal  @default(0) @db.Decimal(10, 2)  // 待结算

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 关系
  earningRecords EarningRecord[]
}

// 收益明细
model EarningRecord {
  id           String         @id @default(cuid())
  earningsId   String
  earnings     WriterEarnings @relation(fields: [earningsId], references: [id])

  novelId      Int
  chapterId    Int
  purchaseId   String         // 关联的购买记录

  amount       Decimal        @db.Decimal(10, 2)  // 作家分成金额
  platformFee  Decimal        @db.Decimal(10, 2)  // 平台抽成

  status       EarningStatus  @default(PENDING)
  settledAt    DateTime?

  createdAt    DateTime @default(now())

  @@index([earningsId, status])
}

enum EarningStatus {
  PENDING     // 待结算
  SETTLED     // 已结算
  WITHDRAWN   // 已提现
}
```

#### 修改现有表

```prisma
// Novel 表新增字段
model Novel {
  // ... 现有字段 ...

  // 付费设置
  isPaid           Boolean  @default(false)      // 是否付费小说
  freeChapters     Int      @default(5)          // 免费章节数
  chapterPrice     Decimal? @db.Decimal(10, 2)   // 默认章节价格

  // 关系
  purchases        ChapterPurchase[]
}

// Chapter 表新增字段
model Chapter {
  // ... 现有字段 ...

  // 付费设置
  isPaid           Boolean  @default(false)      // 此章节是否付费
  price            Decimal? @db.Decimal(10, 2)   // 章节价格 (可覆盖小说默认)

  // 关系
  purchases        ChapterPurchase[]
}

// User 表新增关系
model User {
  // ... 现有字段 ...

  // 关系
  wallet           UserWallet?
  earnings         WriterEarnings?
}
```

### 13.3 API 设计

#### 钱包 API

| 路由 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/wallet` | GET | 获取钱包信息 | ✅ |
| `/api/wallet/recharge` | POST | 发起充值 | ✅ |
| `/api/wallet/recharge/callback` | POST | 支付回调 | ❌ (验签) |

#### 购买 API

| 路由 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/chapters/[id]/purchase` | POST | 购买章节 | ✅ |
| `/api/chapters/[id]/check-access` | GET | 检查访问权限 | ✅ |
| `/api/novels/[id]/purchase-all` | POST | 批量购买剩余章节 | ✅ |

#### 作家收益 API

| 路由 | 方法 | 说明 | 需要认证 |
|------|------|------|----------|
| `/api/dashboard/earnings` | GET | 查看收益 | ✅ (作家) |
| `/api/dashboard/earnings/withdraw` | POST | 申请提现 | ✅ (作家) |
| `/api/dashboard/novels/[id]/pricing` | PUT | 设置定价 | ✅ (作家) |

### 13.4 实现步骤

#### Phase 1: 基础架构 (1-2周)

```
□ 1.1 数据库迁移
  □ 创建 UserWallet 表
  □ 创建 WalletTransaction 表
  □ 创建 ChapterPurchase 表
  □ 创建 WriterEarnings 表
  □ 创建 EarningRecord 表
  □ 修改 Novel 表 (添加付费字段)
  □ 修改 Chapter 表 (添加付费字段)
  □ 添加必要索引

□ 1.2 核心模型
  □ 钱包服务 (WalletService)
  □ 购买服务 (PurchaseService)
  □ 收益服务 (EarningsService)
```

#### Phase 2: 支付集成 (1-2周)

```
□ 2.1 支付接口
  □ 微信支付 H5/JSAPI
  □ 支付宝 H5
  □ 支付回调处理
  □ 订单状态同步

□ 2.2 充值流程
  □ 充值页面 UI
  □ 充值金额选择 (6/18/68/168元等)
  □ 支付二维码/跳转
  □ 充值成功提示
```

#### Phase 3: 购买流程 (1周)

```
□ 3.1 阅读器改造
  □ 检测付费章节
  □ 显示购买提示
  □ 余额不足提示
  □ 购买确认弹窗
  □ 购买成功解锁

□ 3.2 批量购买
  □ "购买全部" 功能
  □ 折扣计算
  □ 批量解锁
```

#### Phase 4: 作家后台 (1周)

```
□ 4.1 定价设置
  □ 设置小说为付费/免费
  □ 设置免费章节数
  □ 设置章节价格
  □ 价格范围限制

□ 4.2 收益管理
  □ 收益统计面板
  □ 收益明细列表
  □ 提现申请
  □ 提现记录
```

#### Phase 5: 反爬虫系统 (1-2周)

```
□ 5.1 内容保护
  □ 付费内容不在 HTML 中直接渲染
  □ 内容通过 API 动态加载
  □ 内容分片传输 + 客户端组装
  □ 内容加密传输

□ 5.2 访问控制
  □ Token 验证 (每次请求)
  □ 请求频率限制
  □ 异常访问检测
  □ IP 黑名单

□ 5.3 前端保护
  □ 禁止右键/选择/复制
  □ 禁止开发者工具
  □ 内容水印 (用户ID)
  □ 截图检测 (可选)
```

### 13.5 反爬虫技术方案

#### 方案1: 内容动态加载

```typescript
// ❌ 错误: 付费内容直接在 HTML 中
<div className="chapter-content">
  {chapter.content}  // 爬虫可以直接抓取
</div>

// ✅ 正确: 通过 API 动态加载
// 1. 页面只渲染骨架
// 2. 客户端请求内容 API
// 3. API 验证权限后返回内容
// 4. 内容加密传输

// API 端
export async function GET(request: NextRequest) {
  // 1. 验证用户身份
  const session = await auth()
  if (!session) return unauthorized()

  // 2. 验证购买记录
  const hasPurchased = await checkPurchase(userId, chapterId)
  if (!hasPurchased) return forbidden()

  // 3. 生成时间戳 Token
  const token = generateToken(userId, chapterId, Date.now())

  // 4. 内容加密
  const encryptedContent = encrypt(chapter.content, token)

  return NextResponse.json({
    content: encryptedContent,
    token: token,
    expiresAt: Date.now() + 5 * 60 * 1000  // 5分钟有效
  })
}

// 客户端
function ChapterContent({ chapterId }) {
  const [content, setContent] = useState('')

  useEffect(() => {
    async function loadContent() {
      const res = await fetch(`/api/chapters/${chapterId}/content`)
      const data = await res.json()

      // 客户端解密
      const decrypted = decrypt(data.content, data.token)
      setContent(decrypted)
    }
    loadContent()
  }, [chapterId])

  return <div dangerouslySetInnerHTML={{ __html: content }} />
}
```

#### 方案2: 内容分片传输

```typescript
// 将内容分成多个片段
// 每个片段单独加密
// 客户端按顺序请求并组装

// 服务端
function splitContent(content: string, chunks: number = 5) {
  const chunkSize = Math.ceil(content.length / chunks)
  const parts = []

  for (let i = 0; i < chunks; i++) {
    parts.push({
      index: i,
      data: encrypt(content.slice(i * chunkSize, (i + 1) * chunkSize)),
      hash: generateHash(i, userId)
    })
  }

  return parts
}

// 客户端需要按顺序请求所有片段
// 并在内存中组装 (不存储到 DOM)
```

#### 方案3: 请求频率限制

```typescript
// src/lib/rate-limiter.ts
const LIMITS = {
  CHAPTER_READ: { window: 60, max: 10 },    // 每分钟最多读10章
  CONTENT_API: { window: 1, max: 2 },        // 每秒最多2次内容请求
  BATCH_READ: { window: 3600, max: 100 },    // 每小时最多100章
}

// 使用 IP + UserID 作为限制 key
async function checkRateLimit(userId: string, ip: string, type: string) {
  const key = `rate:${type}:${userId}:${ip}`
  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, LIMITS[type].window)
  }

  return count <= LIMITS[type].max
}
```

#### 方案4: 内容水印

```typescript
// 在内容中嵌入用户标识
// 如果内容泄露可以追溯

function addWatermark(content: string, userId: string) {
  // 1. 可见水印 (用户名淡色显示)
  // 2. 不可见水印 (零宽字符编码用户ID)

  const encoded = encodeUserId(userId)  // 转为零宽字符

  // 在内容中随机位置插入
  return insertWatermark(content, encoded)
}

function encodeUserId(userId: string): string {
  // 使用零宽字符编码
  // \u200B (零宽空格)
  // \u200C (零宽非连接符)
  // \u200D (零宽连接符)
  // \uFEFF (零宽非断空格)

  return userId
    .split('')
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .map(binary => binary.replace(/0/g, '\u200B').replace(/1/g, '\u200C'))
    .join('\u200D')
}
```

### 13.6 前端保护措施

```typescript
// src/components/reader/ProtectedContent.tsx
'use client'

import { useEffect } from 'react'

export default function ProtectedContent({ children }) {
  useEffect(() => {
    // 1. 禁止右键菜单
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)

    // 2. 禁止选择文本
    const handleSelectStart = (e: Event) => e.preventDefault()
    document.addEventListener('selectstart', handleSelectStart)

    // 3. 禁止复制
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      e.clipboardData?.setData('text/plain', '本内容受版权保护，禁止复制')
    }
    document.addEventListener('copy', handleCopy)

    // 4. 检测开发者工具 (可选)
    const checkDevTools = () => {
      const threshold = 160
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        // 检测到开发者工具
        document.body.innerHTML = '<h1>请关闭开发者工具</h1>'
      }
    }
    const devToolsInterval = setInterval(checkDevTools, 1000)

    // 5. 禁止打印
    const style = document.createElement('style')
    style.textContent = '@media print { body { display: none !important; } }'
    document.head.appendChild(style)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('selectstart', handleSelectStart)
      document.removeEventListener('copy', handleCopy)
      clearInterval(devToolsInterval)
      style.remove()
    }
  }, [])

  return (
    <div
      className="protected-content"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
      }}
    >
      {children}
    </div>
  )
}
```

### 13.7 支付集成 (International - US/EU Market)

> **Target Market**: US/EU users (English-speaking international audience)
> **Payment Providers**: Stripe (primary), PayPal (secondary)
> **Currency**: USD (primary), EUR (optional)

#### Stripe Integration (Recommended)

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Create a checkout session for wallet recharge
export async function createRechargeSession(
  userId: string,
  amount: number,  // in USD
  email: string
) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'ButterNovel Wallet Recharge',
            description: `Add $${amount.toFixed(2)} to your wallet`,
          },
          unit_amount: Math.round(amount * 100),  // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      type: 'wallet_recharge',
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/wallet?canceled=true`,
  })

  return session.url
}

// Webhook handler for payment confirmation
export async function handleStripeWebhook(
  payload: string,
  signature: string
) {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId } = session.metadata!

    // Credit user's wallet
    await creditUserWallet(
      userId,
      session.amount_total! / 100,  // convert cents to dollars
      session.id
    )
  }

  return { received: true }
}
```

#### PayPal Integration (Alternative)

```typescript
// src/lib/paypal.ts
import paypal from '@paypal/checkout-server-sdk'

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_SECRET!
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID!,
      process.env.PAYPAL_SECRET!
    )

const client = new paypal.core.PayPalHttpClient(environment)

export async function createPayPalOrder(amount: number, userId: string) {
  const request = new paypal.orders.OrdersCreateRequest()
  request.prefer('return=representation')
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount.toFixed(2),
      },
      description: 'ButterNovel Wallet Recharge',
      custom_id: userId,
    }],
    application_context: {
      return_url: `${process.env.NEXT_PUBLIC_URL}/api/wallet/paypal/capture`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/wallet?canceled=true`,
    },
  })

  const response = await client.execute(request)
  return response.result.links.find((l: any) => l.rel === 'approve').href
}
```

### 13.8 关键注意事项 (International)

```
⚠️ Legal Compliance (US/EU)
├── GDPR compliance (EU users)
├── CCPA compliance (California users)
├── Terms of Service
├── Privacy Policy
├── COPPA (children's privacy)
└── DMCA (copyright protection)

⚠️ Tax Considerations
├── Sales tax (varies by US state)
├── VAT (EU customers)
├── 1099 reporting for US writers earning >$600
├── W-8BEN for non-US writers
└── Stripe/PayPal automatic tax reporting

⚠️ Security Best Practices
├── Stripe/PayPal webhook signature verification
├── Idempotency keys for payment operations
├── PCI DSS compliance (handled by Stripe/PayPal)
├── Encrypted data storage
└── Regular security audits

⚠️ User Experience
├── Simple checkout flow
├── Multiple payment options
├── Clear refund policy (14-day EU requirement)
├── Transaction history
└── Customer support channel
```

### 13.9 技术栈补充 (International)

```json
{
  "Payment SDKs": {
    "stripe": "Primary payment processor",
    "@paypal/checkout-server-sdk": "Alternative payment"
  },
  "Security": {
    "crypto-js": "Content encryption",
    "jsonwebtoken": "Token generation"
  },
  "Compliance": {
    "@next/third-parties": "Cookie consent",
    "react-cookie-consent": "GDPR cookie banner"
  },
  "Monitoring": {
    "Custom rate limiting": "Anti-scraping",
    "User-agent detection": "Bot protection"
  }
}
```

### 13.10 环境变量 (Payment)

```bash
# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal (optional)
PAYPAL_CLIENT_ID="..."
PAYPAL_SECRET="..."

# Pricing
NEXT_PUBLIC_MIN_CHAPTER_PRICE="0.10"  # $0.10 USD minimum
NEXT_PUBLIC_MAX_CHAPTER_PRICE="1.00"  # $1.00 USD maximum
NEXT_PUBLIC_PLATFORM_FEE="0.30"       # 30% platform fee
```

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

## 12. 测试指南 ⭐ NEW!

### 12.1 测试原则

**何时需要添加测试**:

1. **核心业务逻辑**:
   - ✅ API endpoints (尤其是数据修改类API)
   - ✅ 数据库操作函数
   - ✅ 认证和权限检查
   - ✅ 数据验证和转换逻辑

2. **Bug修复**:
   - ✅ 修复bug后必须添加回归测试
   - ✅ 防止同样的问题再次出现

3. **重要功能更新**:
   - ✅ 新增重要功能后需要测试覆盖
   - ✅ 修改已有核心功能后需要测试

4. **不需要测试的**:
   - ❌ 简单的UI组件 (无复杂逻辑)
   - ❌ 纯展示类页面
   - ❌ 一次性脚本

### 12.2 常见测试场景

#### API 测试

**场景1: 数据类型转换问题**

```typescript
// ❌ 错误示例 - 未处理类型转换
const novelIdNum = parseInt(novelId)  // novelId可能已是number,导致NaN

// ✅ 正确示例 - 安全的类型转换
const novelIdNum = typeof novelId === 'number' ? novelId : parseInt(novelId)

// 测试用例:
describe('POST /api/paragraph-comments/[id]/replies', () => {
  it('应该正确处理number类型的novelId', async () => {
    const response = await fetch('/api/...', {
      body: JSON.stringify({
        novelId: 123,  // number类型
        content: 'test'
      })
    })
    expect(response.status).toBe(200)
  })

  it('应该正确处理string类型的novelId', async () => {
    const response = await fetch('/api/...', {
      body: JSON.stringify({
        novelId: "123",  // string类型
        content: 'test'
      })
    })
    expect(response.status).toBe(200)
  })
})
```

**场景2: 空值和未定义检查**

```typescript
// ❌ 错误示例 - 未检查null
const slug = parentComment.novel.slug  // novel可能是null

// ✅ 正确示例 - 添加null检查
if (parentComment.novel && parentComment.chapter) {
  const slug = parentComment.novel.slug
  // 安全使用
}

// 测试用例:
it('应该处理已删除novel的评论回复', async () => {
  // 模拟novel被删除的场景
  const response = await createReply(commentWithDeletedNovel)
  expect(response.status).toBe(200)
  expect(response.data.notificationSent).toBe(false)
})
```

**场景3: 参数验证**

```typescript
// ✅ 正确示例 - 验证参数一致性
if (
  novelIdNum !== parentComment.novelId ||
  chapterIdNum !== parentComment.chapterId
) {
  return NextResponse.json(
    { success: false, error: 'Parameters mismatch' },
    { status: 400 }
  )
}

// 测试用例:
it('应该拒绝参数不匹配的请求', async () => {
  const response = await fetch('/api/...', {
    body: JSON.stringify({
      novelId: 999,  // 与父评论不匹配
      chapterId: parentComment.chapterId,
      content: 'test'
    })
  })
  expect(response.status).toBe(400)
  expect(response.error).toContain('mismatch')
})
```

### 12.3 手动测试检查清单

在提交代码前,手动测试以下场景:

#### API 功能测试

```bash
# 1. 正常流程测试
✓ 使用正确的参数调用API
✓ 检查返回数据格式正确
✓ 验证数据已保存到数据库

# 2. 边界条件测试
✓ 空字符串/空值
✓ 超长字符串
✓ 特殊字符 (emoji, HTML标签)
✓ 负数/零/超大数字

# 3. 错误处理测试
✓ 未登录访问
✓ 无权限访问
✓ 不存在的资源ID
✓ 数据库连接失败 (模拟)

# 4. 类型测试
✓ 发送number类型的参数
✓ 发送string类型的参数
✓ 发送null/undefined
```

#### 浏览器控制台检查

```bash
# 打开浏览器开发者工具,检查:
✓ 无 JavaScript 错误
✓ 无 404 资源加载失败
✓ 无 500 API 错误
✓ 网络请求正常完成
✓ 控制台无警告信息
```

### 12.4 Bug 修复流程

```bash
# 1. 复现问题
- 记录复现步骤
- 查看错误日志
- 检查浏览器控制台

# 2. 定位原因
- 找到出错的代码位置
- 分析为什么会出错
- 确定修复方案

# 3. 修复代码
- 实现修复
- 添加防御性检查
- 改善错误处理

# 4. 测试验证
- 使用原始复现步骤测试
- 测试边界条件
- 测试相关功能未受影响

# 5. 添加测试用例 (如果是重要功能)
- 写测试覆盖这个bug场景
- 防止将来再次出现
```

### 12.5 常见问题检查清单

**API 开发检查清单**:

```typescript
// ✓ 类型转换安全性
const numValue = typeof value === 'number' ? value : parseInt(value)

// ✓ 空值检查
if (!data || !data.field) {
  return error
}

// ✓ 数组长度检查
if (items.length === 0) {
  return emptyState
}

// ✓ 数据库关联检查
if (record.relatedData && record.relatedData.field) {
  // 安全使用
}

// ✓ 错误处理
try {
  // 操作
} catch (error) {
  console.error('[Component] Error:', error)
  return errorResponse
}

// ✓ 认证检查
const session = await auth()
if (!session?.user?.id) {
  return unauthorized
}

// ✓ 参数验证
if (!content || content.trim().length === 0) {
  return validationError
}
```

### 12.6 实际案例参考

**案例1: 段落评论回复500错误修复**

```typescript
// 问题1: parseInt(novelId) 当 novelId 已是 number 时返回 NaN
// 问题2: Prisma查询使用了不存在的关系字段
// 问题3: 缺少 null/undefined 检查

// ❌ 错误代码:
const novelIdNum = parseInt(novelId)  // novelId可能是number,导致NaN
const parentComment = await prisma.paragraphComment.findUnique({
  include: {
    novel: { ... },    // ❌ ParagraphComment没有novel关系
    chapter: { ... },  // ❌ ParagraphComment没有chapter关系
  }
})

// ✅ 修复后:
// 1. 先检查 null/undefined
if (novelId === null || novelId === undefined ||
    chapterId === null || chapterId === undefined ||
    paragraphIndex === null || paragraphIndex === undefined) {
  return NextResponse.json(
    { success: false, error: 'Missing required parameters' },
    { status: 400 }
  );
}

// 2. 安全的类型转换
const novelIdNum = typeof novelId === 'number' ? novelId : parseInt(String(novelId), 10)
const chapterIdNum = typeof chapterId === 'number' ? chapterId : parseInt(String(chapterId), 10)
const paragraphIndexNum = typeof paragraphIndex === 'number' ? paragraphIndex : parseInt(String(paragraphIndex), 10)

// 3. 检查 NaN
if (isNaN(novelIdNum) || isNaN(chapterIdNum) || isNaN(paragraphIndexNum)) {
  return NextResponse.json(
    { success: false, error: 'Invalid parameter types' },
    { status: 400 }
  );
}

// 4. 正确的 Prisma 查询
const parentComment = await prisma.paragraphComment.findUnique({
  where: { id: parentId },
  select: {
    id: true,
    novelId: true,      // ✅ 只查询实际存在的字段
    chapterId: true,
    paragraphIndex: true,
    userId: true,
  }
})

// 5. 如需 novel/chapter 信息,单独查询
const [novel, chapter] = await Promise.all([
  prisma.novel.findUnique({ where: { id: parentComment.novelId }, select: { slug: true } }),
  prisma.chapter.findUnique({ where: { id: parentComment.chapterId }, select: { chapterNumber: true } })
])

// 测试:
// ✓ 测试 number 类型参数
// ✓ 测试 string 类型参数
// ✓ 测试 null/undefined 参数
// ✓ 检查浏览器控制台无500错误
// ✓ 验证通知功能正常工作
```

**案例2: Icon 404错误修复**

```typescript
// 问题:
// - manifest引用 /icon-192.png 但文件不存在
// - 浏览器不断尝试加载,控制台大量404错误

// 解决方案:
// 1. 创建缺失的icon文件
// 2. 更新manifest.json引用

// 测试:
// ✓ 检查 /icon-192.png 可访问
// ✓ 检查 /icon-512.png 可访问
// ✓ 浏览器控制台无404错误
// ✓ PWA manifest验证通过
```

### 12.7 开发工作流

```bash
# 新功能开发:
1. 阅读需求 → 2. 设计方案 → 3. 编写代码 → 4. 手动测试 → 5. 修复问题 → 6. 提交代码

# Bug修复:
1. 复现问题 → 2. 定位原因 → 3. 修复代码 → 4. 测试验证 → 5. 检查相关功能 → 6. 提交代码

# 重要功能更新:
1. 评估影响 → 2. 修改代码 → 3. 全面测试 → 4. 添加测试用例 → 5. 更新文档 → 6. 提交代码
```

**关键原则**: 每次修改后都要在浏览器中实际测试,检查控制台无错误!

---

**文档维护**: 每次重大功能更新后,请同步更新本文档
**最后更新**: 2025-11-26
**维护者**: Claude + Leo

**🦋 让阅读更轻松,让创作更简单,让创作有回报**
