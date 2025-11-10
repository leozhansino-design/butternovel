# 🦋 ButterNovel - 项目结构文档

**最后更新:** 2025-11-10  
**文档目的:** 快速理解项目架构和代码组织

---

## 📁 项目总览

```
butternovel/
├── src/                    # 源代码目录
│   ├── app/               # Next.js 16 App Router
│   ├── components/        # React组件
│   ├── lib/              # 工具库和配置
│   └── types/            # TypeScript类型
├── prisma/               # 数据库Schema和迁移
├── public/               # 静态资源
└── 配置文件              # 各种配置
```

---

## 🗂️ 详细结构

### 1. `/src/app` - 路由和页面

Next.js 16 App Router，文件系统即路由。

```
app/
├── (auth)/                          # 认证相关路由组
│   └── auth/
│       └── admin-login/
│           └── page.tsx             # 管理员登录页
│
├── admin/                           # 管理后台 (需admin token)
│   ├── layout.tsx                   # 后台布局 (侧边栏+顶栏)
│   ├── page.tsx                     # Dashboard (统计卡片+图表)
│   │   功能: 显示Total Novels/Users/Views
│   │        时间范围筛选 (1天、3天、1周等)
│   │        echarts图表展示趋势
│   │
│   ├── novels/                      # 小说管理
│   │   ├── page.tsx                 # 小说列表 (搜索、筛选、分页)
│   │   ├── new/
│   │   │   └── page.tsx             # 上传新小说 (Cloudinary上传)
│   │   └── [id]/
│   │       ├── edit/
│   │       │   └── page.tsx         # 编辑小说 (增量更新)
│   │       └── chapters/
│   │           ├── page.tsx         # 章节管理列表
│   │           ├── new/
│   │           │   └── page.tsx     # 添加新章节
│   │           └── [chapterId]/edit/
│   │               └── page.tsx     # 编辑章节
│   │
│   ├── profile/
│   │   └── page.tsx                 # 管理员个人资料
│   │
│   └── users/
│       └── page.tsx                 # 用户管理 (TODO)
│
├── novels/                          # 前台小说页面
│   ├── [slug]/
│   │   ├── page.tsx                 # 小说详情页
│   │   │   功能: 显示封面、简介、stats
│   │   │        展示第一章内容
│   │   │        ViewTracker自动追踪浏览
│   │   │        formatNumber显示浏览量
│   │   │
│   │   └── chapters/
│   │       └── [number]/
│   │           └── page.tsx         # 章节阅读页
│   │               功能: 加载章节内容
│   │                    ViewTracker追踪
│   │                    传递给ChapterReader组件
│   │
│   └── page.tsx                     # 小说列表页 (TODO)
│
├── api/                             # API路由
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts             # NextAuth handlers
│   │
│   ├── admin/
│   │   ├── login/
│   │   │   └── route.ts             # 管理员登录API (JWT)
│   │   ├── logout/
│   │   │   └── route.ts             # 登出API
│   │   ├── profile/
│   │   │   └── route.ts             # 管理员资料CRUD
│   │   ├── novels/
│   │   │   └── route.ts             # 小说CRUD
│   │   ├── chapters/
│   │   │   └── [id]/
│   │   │       └── route.ts         # 章节CRUD
│   │   └── stats/
│   │       └── route.ts             # 统计数据API
│   │           功能: GET - 获取时间范围统计
│   │                POST - 获取图表数据
│   │                统计真实浏览量 (NovelView表)
│   │
│   └── views/
│       └── track/
│           └── route.ts             # 浏览量追踪API
│               功能: 接收novelId
│                    检查24小时去重
│                    记录到NovelView表
│                    增加Novel.viewCount
│
├── page.tsx                         # 首页
│   功能: Featured轮播
│        分类展示
│        骨架屏加载
│
├── layout.tsx                       # 根布局
├── globals.css                      # 全局样式
└── providers.tsx                    # Context Providers (TODO)
```

---

### 2. `/src/components` - 组件库

```
components/
├── shared/                          # 共享组件
│   ├── Header.tsx                   # 顶部导航栏
│   │   功能: Logo、导航链接、登录按钮
│   │        显示用户头像 (已登录时)
│   │
│   ├── HeaderWrapper.tsx            # Header服务端wrapper
│   │   功能: 获取session传递给Header
│   │
│   └── Footer.tsx                   # 页脚
│
├── admin/                           # 管理后台组件
│   ├── AdminSidebar.tsx             # 侧边栏菜单
│   │   功能: Dashboard、Upload、Novels等链接
│   │        显示管理员信息
│   │        Logout按钮
│   │
│   ├── BanButton.tsx                # Ban/Unban按钮
│   │   功能: 封禁/解封小说
│   │
│   └── StatsCard.tsx                # 统计卡片 (TODO)
│
├── reader/                          # 阅读器组件
│   └── ChapterReader.tsx            # 章节阅读器
│       功能: Scroll/Page双模式
│            4种背景色、4种字体大小
│            目录侧边栏、设置侧边栏
│            章节导航、键盘支持
│            localStorage保存设置
│
├── novel/                           # 小说相关组件
│   ├── NovelCard.tsx                # 小说卡片
│   │   功能: 显示封面、标题、分类、stats
│   │
│   └── NovelGrid.tsx                # 小说网格布局
│
├── auth/                            # 认证组件
│   └── AuthModal.tsx                # 登录模态框 (TODO)
│
├── ui/                              # 基础UI组件
│   ├── Button.tsx                   # 按钮组件 (TODO)
│   ├── Input.tsx                    # 输入框 (TODO)
│   └── Modal.tsx                    # 模态框 (TODO)
│
└── ViewTracker.tsx                  # 浏览量追踪组件
    功能: 客户端组件
         延迟3秒后追踪
         调用/api/views/track
         useRef防止重复追踪
```

---

### 3. `/src/lib` - 工具库

```
lib/
├── prisma.ts                        # Prisma客户端单例
│   功能: 开发环境防止连接池耗尽
│        globalThis保存实例
│
├── auth.ts                          # NextAuth配置
│   功能: Google OAuth Provider
│        自动创建用户到数据库
│        Session callbacks
│        trustHost: true (生产环境必需)
│
├── admin-auth.ts                    # 管理员JWT认证
│   功能: getAdminSession()
│        验证JWT token
│        从cookie读取
│
├── cloudinary.ts                    # Cloudinary工具
│   功能: uploadToCloudinary - 上传图片
│        deleteFromCloudinary - 删除图片
│        自动优化 (300x400, quality: auto)
│
├── view-tracker.ts                  # 浏览量追踪核心
│   功能: trackNovelView() - 追踪浏览
│        generateGuestId() - 生成游客ID
│        getClientIp() - 获取IP
│        getUserAgent() - 获取UA
│        24小时去重检查
│        自动清理30天旧数据
│        getUniqueViewers() - 统计唯一访客
│        getViewTrend() - 7天趋势
│
└── format.ts                        # 格式化工具
    功能: formatNumber() - 数字格式化
         10 → "10"
         1500 → "1.5k"
         1500000 → "1.5m"
```

---

### 4. `/prisma` - 数据库

```
prisma/
├── schema.prisma                    # 数据库Schema
│   Models (13个):
│   ├── User                         # 用户表
│   ├── Category                     # 分类表
│   ├── Novel                        # 小说表
│   ├── Chapter                      # 章节表
│   ├── Library                      # 书架表
│   ├── ReadingHistory               # 阅读历史表
│   ├── ChapterProgress              # 章节进度表
│   ├── NovelLike                    # 点赞表
│   ├── Comment                      # 评论表
│   ├── NovelView                    # ⭐ 浏览记录表
│   │   Fields:
│   │   - novelId (外键)
│   │   - userId (登录用户, nullable)
│   │   - guestId (游客hash, nullable)
│   │   - ipAddress
│   │   - userAgent
│   │   - viewedAt
│   │   Indexes:
│   │   - (novelId, userId, viewedAt)
│   │   - (novelId, guestId, viewedAt)
│   │   - (viewedAt) 用于清理
│   │
│   ├── ForumPost                    # 论坛帖子表
│   ├── ForumReply                   # 论坛回复表
│   ├── Admin                        # 管理员表
│   └── AdminProfile                 # 管理员资料表
│
├── migrations/                      # 数据库迁移历史
└── seed.ts                          # 种子数据 (分类+管理员)
```

---

### 5. 数据流向图

#### 浏览量追踪流程:

```
用户访问小说详情页
    ↓
ViewTracker组件加载 (客户端)
    ↓
延迟3秒
    ↓
调用 POST /api/views/track
    ↓
view-tracker.ts
    ├── 获取IP和UserAgent
    ├── 生成guestId (如果是游客)
    ├── 检查NovelView表 (24小时内是否浏览过)
    ├── 如果已浏览 → 返回不计数
    └── 如果未浏览 → 
        ├── 创建NovelView记录
        ├── Novel.viewCount + 1
        └── 1%概率清理30天旧数据
    ↓
返回 { counted: true/false, viewCount: number }
```

#### 管理后台统计流程:

```
Admin访问 /admin
    ↓
Dashboard页面加载
    ↓
调用 GET /api/admin/stats?range=1day
    ↓
stats/route.ts
    ├── 计算时间范围 (startDate)
    ├── COUNT NovelView WHERE viewedAt >= startDate
    ├── COUNT Novel WHERE createdAt >= startDate
    └── COUNT User WHERE createdAt >= startDate
    ↓
返回 { totalNovels, totalUsers, totalViews }
    ↓
Dashboard渲染统计卡片和图表
```

---

## 🔑 关键技术点

### 1. 浏览量去重机制

```typescript
// 登录用户 - 按userId去重
WHERE novelId = X AND userId = Y AND viewedAt >= (now - 24h)

// 游客 - 按guestId去重  
WHERE novelId = X AND guestId = hash(IP+UA) AND viewedAt >= (now - 24h)
```

### 2. Cloudinary图片优化

```typescript
{
  folder: 'butternovel/covers',
  transformation: [
    { width: 300, height: 400, crop: 'fill' },
    { quality: 'auto' },
    { fetch_format: 'auto' }  // 自动WebP
  ]
}
```

### 3. Prisma单例模式

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### 4. NextAuth v5配置

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GoogleProvider({...})],
  callbacks: {
    async signIn() {
      await prisma.user.upsert({...})
      return true
    }
  },
  trustHost: true  // Vercel必需
})
```

---

## 📊 数据库关系图

```
User ←→ Library ←→ Novel
User ←→ ReadingHistory ←→ Chapter
User ←→ NovelLike ←→ Novel
User ←→ Comment ←→ Novel
User ←→ ChapterProgress ←→ Chapter

Novel ←→ Category
Novel ←→ Chapter
Novel ←→ NovelView  ⭐ (浏览记录)

Admin ←→ AdminProfile
```

---

## 🚀 部署架构

```
Vercel (前端+API)
    ├── Next.js 16 App
    ├── API Routes
    └── Edge Functions
    
Vercel Postgres (数据库)
    └── Prisma ORM
    
Cloudinary (图片CDN)
    ├── 封面图片
    └── 用户头像
    
Google OAuth (认证)
    └── NextAuth.js
```

---

## 💡 最佳实践

### 1. 不要删除内容
- 小说: isBanned标记
- 用户: isActive标记  
- 评论: isHidden标记
- 例外: 章节可删除 (用于修正错误)

### 2. 增量更新
```typescript
// ✅ 只发送改动的字段
const updates: any = {}
if (title !== old.title) updates.title = title
await prisma.novel.update({ where: { id }, data: updates })

// ❌ 不要全量更新
await prisma.novel.update({ data: { ...allFields } })
```

### 3. 图片清理
```typescript
// 删除小说时自动清理Cloudinary
if (novel.coverImagePublicId) {
  await deleteFromCloudinary(novel.coverImagePublicId)
}
```

### 4. 日志记录
```typescript
console.log('✅ [Success]', data)
console.error('❌ [Error]', error)
console.warn('⚠️ [Warning]', warning)
```

---

## 📝 命名规范

### 文件命名
- 组件: `PascalCase.tsx`
- 工具: `kebab-case.ts`
- 路由: `page.tsx`, `layout.tsx`, `route.ts`

### 变量命名
- 常量: `UPPER_SNAKE_CASE`
- 函数: `camelCase`
- 组件: `PascalCase`
- 类型: `PascalCase`

### 数据库命名
- 表名: `PascalCase` (Novel, Chapter)
- 字段: `camelCase` (coverImage, isPublished)
- 关系: `camelCase` (chapters, author)

---

## 🔍 快速查找

需要修改某个功能时,快速定位文件:

| 功能 | 文件位置 |
|------|---------|
| 小说详情页布局 | `app/novels/[slug]/page.tsx` |
| 浏览量追踪逻辑 | `lib/view-tracker.ts` |
| 管理后台Dashboard | `app/admin/page.tsx` |
| 阅读器界面 | `components/reader/ChapterReader.tsx` |
| 数据库Schema | `prisma/schema.prisma` |
| 图片上传 | `lib/cloudinary.ts` |
| 用户认证 | `lib/auth.ts` |
| API: 浏览追踪 | `app/api/views/track/route.ts` |
| API: 统计数据 | `app/api/admin/stats/route.ts` |
| 数字格式化 | `lib/format.ts` |

---

**维护者:** Leo  
**最后更新:** 2025-11-10  
**文档版本:** v1.0

---

## 🦋 ButterNovel
**Clean Code, Clear Structure**