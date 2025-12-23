# ButterNovel - Claude 开发参考文档

> **快速参考**: 每次开发前必读，帮助 Claude 快速理解项目上下文

**最后更新**: 2025-12-23
**项目版本**: MVP v3.0 (移动端开发)
**当前阶段**: 📱 手机版 App 开发
**目标平台**: Google Play + App Store

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [移动端 App 规划](#2-移动端-app-规划) ⭐ 重要
3. [技术栈](#3-技术栈)
4. [项目结构](#4-项目结构)
5. [数据库设计](#5-数据库设计)
6. [开发规范](#6-开发规范)
7. [API 路由](#7-api-路由)
8. [核心功能模块](#8-核心功能模块)
9. [环境变量](#9-环境变量)

---

## 1. 项目概述

### 1.1 项目定位

**ButterNovel** 是一个短篇小说阅读与创作平台。

**手机版核心特征**:
- 📱 只做短篇小说（暂不做长篇）
- 🎯 抖音式推荐体验（For You）
- ✍️ 用户即作者（一个账号双身份）
- 🌍 目标市场：全球英语用户

**平台**:
- Google Play (Android)
- App Store (iOS)

### 1.2 用户角色

```
一个账号 = 读者 + 作者

┌─────────────────────────────────────────┐
│ 读者模式                                │
│ - 浏览 For You 推荐                     │
│ - 阅读短篇小说                          │
│ - 收藏/点赞/评分/评论                   │
│ - 关注喜欢的作者                        │
│ - 查看关注作者的更新                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 作者模式                                │
│ - 创作/上传短篇小说                     │
│ - 管理自己的作品                        │
│ - 查看阅读/点赞统计                     │
│ - 回复读者评论                          │
└─────────────────────────────────────────┘
```

---

## 2. 移动端 App 规划 ⭐ 重要

### 2.1 核心功能区（Bottom Tab）

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [内容区域]                            │
│                                                         │
├─────────┬─────────┬─────────┬─────────┬─────────────────┤
│ For You │Following│   ➕    │ Bookshelf│    Profile     │
│  推荐   │  关注   │  创作   │   书架   │      我的      │
└─────────┴─────────┴─────────┴─────────┴─────────────────┘
```

### 2.2 功能详细设计

#### Tab 1: For You（推荐页）⭐ 核心

**交互方式**: 类似抖音的沉浸式体验

```
┌─────────────────────────────────┐
│ [小说封面 + 标题 + 简介预览]    │
│                                 │
│ 上滑 → 下一个推荐               │
│ 下滑 → 上一个推荐               │
│ 点击 → 进入阅读器               │
│                                 │
│ ❤️ 点赞                         │
│ 💬 评论                         │
│ 📚 收藏                         │
│ ↗️ 分享                         │
└─────────────────────────────────┘
```

**功能点**:
- 垂直滑动浏览推荐小说
- 智能推荐算法（基于阅读历史、点赞、收藏）
- 快速预览（封面 + 标题 + 前几段内容）
- 一键进入阅读
- 右侧操作栏（点赞、评论、收藏、分享）
- 标签筛选（言情、悬疑、科幻等）
- 下拉刷新获取新推荐

#### Tab 2: Following（关注页）

**功能点**:
- 关注作者的最新作品更新
- 时间线形式展示
- 未读标记提醒
- 作者头像 + 新作品信息
- 点击直接进入阅读

```
┌─────────────────────────────────┐
│ Following                       │
├─────────────────────────────────┤
│ 👤 Author A          2h ago    │
│    「New Story Title」          │
│    Chapter 1 · 3.2K words      │
├─────────────────────────────────┤
│ 👤 Author B         Yesterday  │
│    「Another Story」            │
│    Complete · 5.1K words       │
└─────────────────────────────────┘
```

#### Tab 3: Create（创作页）➕

**功能点**:
- 创建新短篇小说
- 管理已创作的作品
- 作品数据统计（阅读量、点赞、收藏）
- 草稿箱功能
- 富文本编辑器
- 封面上传
- 标签选择
- 发布/存草稿

```
┌─────────────────────────────────┐
│ My Works                        │
├─────────────────────────────────┤
│ [+ Create New Story]           │
├─────────────────────────────────┤
│ 📖 Story Title 1    Published  │
│    👁️ 1.2K  ❤️ 89  📚 45       │
├─────────────────────────────────┤
│ 📝 Draft Title      Draft      │
│    Last edited 2 days ago      │
└─────────────────────────────────┘
```

**创作流程**:
```
1. 点击 ➕ Create New Story
2. 填写标题
3. 选择分类/标签
4. 上传封面（可选，有默认封面）
5. 编写内容（富文本编辑器）
6. 预览
7. 发布 / 存为草稿
```

#### Tab 4: Bookshelf（书架）

**功能点**:
- 收藏的小说列表
- 阅读历史
- 阅读进度显示
- 继续阅读入口
- 分类筛选（收藏/历史/下载）

#### Tab 5: Profile（我的）

**功能点**:
- 个人资料编辑
- 头像/昵称/简介
- 阅读统计（读了多少本/字数）
- 创作统计（发布了多少本/获得多少赞）
- 设置入口
- 通知中心入口
- 深色模式切换
- 语言设置
- 登出

### 2.3 阅读器设计

**短篇专用阅读器**:

```
┌─────────────────────────────────┐
│ ← Back          Story Title    │
├─────────────────────────────────┤
│                                 │
│  [沉浸式阅读内容区]              │
│                                 │
│  支持手势:                       │
│  - 点击中间：显示/隐藏菜单       │
│  - 点击左侧：上一页              │
│  - 点击右侧：下一页              │
│  - 长按：复制/标注               │
│                                 │
├─────────────────────────────────┤
│ Aa   🌙   📖   💬              │
│ 字体  夜间  进度  评论          │
└─────────────────────────────────┘
```

**阅读器设置**:
- 字体大小调节
- 背景色切换（白/米/黑/护眼）
- 行间距调节
- 夜间模式
- 阅读进度条
- 自动翻页（可选）

### 2.4 补充功能

#### 登录/注册

```
支持登录方式:
├── Google 登录 ⭐ 必须
├── Apple 登录 ⭐ iOS 必须
├── Email + Password
└── 游客模式（有限功能）
```

**游客限制**:
- 可以浏览 For You
- 可以阅读
- 不能评论/点赞/收藏
- 不能创作
- 提示登录获得完整体验

#### 搜索功能

```
搜索入口: For You 页面顶部
├── 按标题搜索
├── 按作者搜索
├── 按标签搜索
├── 搜索历史
└── 热门搜索推荐
```

#### 推送通知

```
通知类型:
├── 关注作者发布新作品
├── 收藏作品有更新
├── 收到评论回复
├── 作品被点赞/收藏（作者）
└── 系统公告
```

#### 分享功能

```
分享渠道:
├── 系统分享（调用系统分享面板）
├── 复制链接
├── 生成分享卡片图片
└── 社交媒体（Twitter/Facebook/WhatsApp）
```

#### 举报功能

```
用户可举报:
├── 不当内容
├── 抄袭/侵权
├── 垃圾信息
└── 其他
```

### 2.5 技术实现方案

#### 推荐算法（For You）

```typescript
// 推荐因素权重
const RECOMMENDATION_WEIGHTS = {
  userInterests: 0.3,      // 用户兴趣标签
  readingHistory: 0.25,    // 阅读历史
  likedContent: 0.2,       // 点赞内容
  trending: 0.15,          // 热门趋势
  newContent: 0.1,         // 新发布内容
}

// API: GET /api/mobile/for-you
// 返回分页推荐列表
```

#### 关注系统

```typescript
// 关注/取关
POST /api/user/follow
DELETE /api/user/follow

// 获取关注作者更新
GET /api/mobile/following-updates
```

#### 创作系统

```typescript
// 创建短篇
POST /api/mobile/stories
{
  title: string,
  content: string,
  coverImage?: string,
  tags: string[],
  categoryId: number,
  isDraft: boolean,
}

// 获取我的作品
GET /api/mobile/my-stories

// 编辑作品
PUT /api/mobile/stories/:id

// 删除作品
DELETE /api/mobile/stories/:id
```

### 2.6 数据模型扩展

```prisma
// 为移动端优化的新增字段

model Novel {
  // ... 现有字段 ...

  // 短篇小说标记
  isShort        Boolean  @default(true)  // 是否短篇

  // 作者自主创建
  creatorId      String?  // 创作者用户ID（非管理员上传）
  creator        User?    @relation("CreatedNovels", fields: [creatorId], references: [id])
}

model User {
  // ... 现有字段 ...

  // 创作相关
  createdNovels  Novel[]  @relation("CreatedNovels")

  // 统计
  totalReads     Int      @default(0)  // 作品总阅读量
  totalLikes     Int      @default(0)  // 获得的总点赞
}

// 推荐相关
model UserInterest {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tagId      Int
  tag        Tag      @relation(fields: [tagId], references: [id])
  weight     Float    @default(1.0)  // 兴趣权重
  updatedAt  DateTime @updatedAt

  @@unique([userId, tagId])
}
```

### 2.7 开发优先级

```
Phase 1 - 基础框架（2周）
├── Expo 项目搭建
├── 导航架构
├── 登录/注册（Google + Apple）
├── API 客户端
└── 基础 UI 组件

Phase 2 - For You 推荐（2周）⭐ 核心
├── 推荐 API
├── 垂直滑动浏览
├── 小说卡片组件
├── 进入阅读流程
└── 点赞/收藏交互

Phase 3 - 阅读器（1周）
├── 短篇阅读器
├── 阅读设置
├── 进度保存
└── 阅读体验优化

Phase 4 - 创作功能（2周）⭐ 重要
├── 创建短篇 UI
├── 富文本编辑器
├── 封面上传
├── 草稿系统
└── 发布流程

Phase 5 - 关注系统（1周）
├── 关注/取关
├── 关注列表
├── 更新时间线
└── 未读标记

Phase 6 - 书架 & 个人中心（1周）
├── 收藏列表
├── 阅读历史
├── 个人资料
├── 设置页面
└── 通知中心

Phase 7 - 优化 & 上架（2周）
├── 性能优化
├── Bug 修复
├── 商店素材准备
├── 审核提交
└── 上架发布
```

### 2.8 App 商店要求清单

#### Google Play

| 要求 | 状态 | 说明 |
|------|------|------|
| 开发者账号 | ❌ | $25 一次性 |
| 隐私政策 | ❌ | 需创建 |
| 内容分级 | ❌ | 填写问卷 |
| 截图 | ❌ | 至少2张 |
| 功能图片 | ❌ | 1024x500 |
| App Bundle | - | 构建时生成 |

#### App Store

| 要求 | 状态 | 说明 |
|------|------|------|
| 开发者账号 | ❌ | $99/年 |
| Sign in with Apple | ⭐ | **必须实现** |
| 隐私政策 | ❌ | 与 GP 共用 |
| 截图 | ❌ | 多尺寸 |
| App Privacy | ❌ | 数据收集声明 |
| 年龄分级 | ❌ | 内容问卷 |

---

## 3. 技术栈

### 3.1 Web 端（现有）

```json
{
  "前端框架": "Next.js 16 (App Router)",
  "React版本": "19.2.0",
  "UI框架": "Tailwind CSS 4",
  "数据库": "Vercel Postgres (Prisma ORM)",
  "身份验证": "NextAuth.js v5",
  "图片存储": "Cloudinary",
  "部署平台": "Vercel"
}
```

### 3.2 移动端（新增）

```json
{
  "框架": "Expo SDK 52+",
  "核心": "React Native 0.76+",
  "路由": "Expo Router",
  "状态管理": "@tanstack/react-query + zustand",
  "表单验证": "react-hook-form + zod",
  "UI": "NativeWind (Tailwind CSS for RN)",
  "存储": "expo-secure-store + async-storage",
  "认证": "expo-auth-session",
  "推送": "expo-notifications + FCM"
}
```

### 3.3 开发命令

```bash
# Web 端
npm run dev              # 启动开发服务器
npm run build            # 生产环境构建
npm run db:generate      # 生成 Prisma Client
npm run db:push          # 推送数据库 schema

# 移动端（在 mobile 目录）
npx expo start           # 启动开发服务器
npx expo start --ios     # iOS 模拟器
npx expo start --android # Android 模拟器
eas build --profile development   # 开发版构建
eas build --profile production    # 生产版构建
eas submit --platform ios         # 提交 App Store
eas submit --platform android     # 提交 Google Play
```

---

## 4. 项目结构

### 4.1 整体结构

```
butternovel/
├── src/                      # Web 端代码
│   ├── app/                  # Next.js App Router
│   ├── components/           # React 组件
│   └── lib/                  # 工具库
│
├── mobile/                   # 📱 移动端代码（新增）
│   ├── app/                  # Expo Router 页面
│   │   ├── (tabs)/           # Tab 导航
│   │   │   ├── index.tsx     # For You
│   │   │   ├── following.tsx # Following
│   │   │   ├── create.tsx    # Create ➕
│   │   │   ├── bookshelf.tsx # Bookshelf
│   │   │   └── profile.tsx   # Profile
│   │   ├── auth/             # 登录/注册
│   │   ├── reader/           # 阅读器
│   │   ├── story/            # 小说详情
│   │   └── settings/         # 设置页面
│   ├── components/           # RN 组件
│   ├── lib/                  # 工具库
│   ├── hooks/                # 自定义 Hooks
│   └── stores/               # Zustand 状态
│
├── prisma/
│   └── schema.prisma         # 数据库 Schema
│
├── docs/                     # 文档
│   ├── 移动端开发计划.md
│   └── React-Native开发执行手册.md
│
└── claude.md                 # 本文件
```

---

## 5. 数据库设计

### 5.1 核心表结构

#### User（用户表）
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  password        String?
  name            String?
  avatar          String?
  bio             String?

  // OAuth
  googleId        String?  @unique
  appleId         String?  @unique  // Apple 登录

  // 创作者信息
  isWriter        Boolean  @default(false)

  // 统计
  totalReads      Int      @default(0)
  totalLikes      Int      @default(0)

  // 关系
  createdNovels   Novel[]  @relation("CreatedNovels")
  library         Library[]
  followers       Follow[] @relation("Following")
  following       Follow[] @relation("Followers")
}
```

#### Novel（小说表）
```prisma
model Novel {
  id                  Int         @id @default(autoincrement())
  title               String
  slug                String      @unique
  coverImage          String
  blurb               String      @db.Text
  content             String      @db.Text  // 短篇小说内容

  // 作者
  authorId            String
  authorName          String
  creatorId           String?     // 用户创建者
  creator             User?       @relation("CreatedNovels", fields: [creatorId], references: [id])

  // 分类
  categoryId          Int

  // 状态
  isShort             Boolean     @default(true)  // 短篇标记
  isDraft             Boolean     @default(false)
  isPublished         Boolean     @default(false)

  // 统计
  wordCount           Int         @default(0)
  viewCount           Int         @default(0)
  likeCount           Int         @default(0)
  commentCount        Int         @default(0)
}
```

#### Follow（关注表）
```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String
  follower    User     @relation("Followers", fields: [followerId], references: [id])
  followingId String
  following   User     @relation("Following", fields: [followingId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
}
```

---

## 6. 开发规范

### 6.1 代码规范

**命名约定**:
- 组件: PascalCase (`StoryCard.tsx`)
- 工具函数: camelCase (`formatDate()`)
- 常量: UPPER_SNAKE_CASE (`API_URL`)

### 6.2 Git 提交规范

```bash
feat: 新功能
fix: 修复 bug
refactor: 重构
docs: 文档更新
style: 样式调整
perf: 性能优化
```

---

## 7. API 路由

### 7.1 移动端专用 API（新增）

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/mobile/for-you` | GET | For You 推荐列表 |
| `/api/mobile/following-updates` | GET | 关注作者更新 |
| `/api/mobile/stories` | POST | 创建短篇 |
| `/api/mobile/stories` | GET | 获取我的作品 |
| `/api/mobile/stories/[id]` | PUT | 编辑作品 |
| `/api/mobile/stories/[id]` | DELETE | 删除作品 |
| `/api/mobile/stories/[id]/publish` | POST | 发布作品 |

### 7.2 复用现有 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/library` | POST/DELETE | 收藏/取消收藏 |
| `/api/user/follow` | POST | 关注/取关作者 |
| `/api/novels/[id]/rate` | POST | 评分 |
| `/api/paragraph-comments` | POST | 评论 |
| `/api/notifications` | GET | 通知列表 |
| `/api/profile` | GET/PUT | 个人资料 |
| `/api/search` | GET | 搜索 |

---

## 8. 核心功能模块

### 8.1 推荐系统

**推荐算法**:
1. 用户兴趣标签（30%）
2. 阅读历史相似内容（25%）
3. 点赞/收藏的相关内容（20%）
4. 热门趋势（15%）
5. 新发布内容（10%）

### 8.2 创作系统

**创作流程**:
1. 填写标题
2. 选择分类和标签
3. 上传封面（可选）
4. 编写内容（富文本）
5. 预览
6. 发布/存草稿

### 8.3 阅读器

**短篇阅读器特性**:
- 全屏沉浸式阅读
- 字体/背景/行距可调
- 夜间模式
- 进度保存
- 评论入口

---

## 9. 环境变量

### 9.1 必需的环境变量

```bash
# 数据库
DATABASE_URL="postgresql://..."

# NextAuth (用户认证)
AUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Cloudinary (图片存储)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# 管理员 JWT
ADMIN_JWT_SECRET="..."
```

### 9.2 移动端额外环境变量

```bash
# Expo
EXPO_PUBLIC_API_URL="https://butternovel.com/api"

# Apple Sign In (iOS)
APPLE_CLIENT_ID="..."
APPLE_TEAM_ID="..."
APPLE_KEY_ID="..."
APPLE_PRIVATE_KEY="..."

# Firebase (推送通知)
FIREBASE_PROJECT_ID="..."
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."
```

---

## 重要提醒

### 开发前必读

1. **移动端优先**: 当前阶段专注于移动端开发
2. **只做短篇**: 暂不考虑长篇小说功能
3. **一账号双身份**: 用户和作者是同一个账号
4. **Apple 登录必须**: iOS 上架强制要求
5. **文档规范**: 除非明确要求，推送时不创建 md 文件

### 设计原则

1. **抖音式体验**: For You 页面参考抖音交互
2. **简单创作**: 降低创作门槛，鼓励用户上传
3. **社交属性**: 关注、点赞、评论、分享
4. **移动原生**: 充分利用移动设备特性

---

**文档维护**: 每次重大功能更新后，请同步更新本文档
**最后更新**: 2025-12-23
**维护者**: Claude + Leo

**📱 让短篇阅读触手可及，让创作人人可为**
